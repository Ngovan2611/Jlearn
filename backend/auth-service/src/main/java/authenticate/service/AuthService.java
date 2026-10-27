package authenticate.service;

import authenticate.dto.request.AuthRequest;
import authenticate.dto.request.IntrospectRequest;
import authenticate.dto.request.LogoutRequest;
import authenticate.dto.request.RefreshRequest;
import authenticate.dto.response.AuthResponse;
import authenticate.dto.response.IntrospectResponse;
import authenticate.entity.Account;
import authenticate.entity.InvalidatedToken;
import authenticate.entity.RefreshToken;
import authenticate.enums.Status;
import authenticate.exception.AppException;
import authenticate.exception.ErrorCode;
import authenticate.repository.InvalidatedTokenRepository;
import authenticate.repository.RefreshTokenRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthService {

    @NonFinal
    @Value("${jwt.signerKey}")
    String key;

    AccountService accountService;
    InvalidatedTokenRepository invalidatedTokenRepository;
    RefreshTokenRepository refreshTokenRepository;
    PasswordEncoder passwordEncoder;
    RefreshTokenService refreshTokenService;

    // =========================
    // LOGIN
    // =========================
    public AuthResponse authenticate(AuthRequest authRequest) {
        Account account = accountService.getAccountByUsername(authRequest.getUsername());

        // Kiểm tra tài khoản bị khóa khi Đăng nhập
        if (Status.LOCKED.name().equalsIgnoreCase(account.getStatus())) {
            throw new AppException(ErrorCode.LOCKED);
        }

        boolean authenticated = passwordEncoder.matches(
                authRequest.getPassword(),
                account.getPassword()
        );

        if (!authenticated) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        String sessionId = UUID.randomUUID().toString();
        String accessToken = generateAccessToken(account);
        String refreshToken = generateRefreshToken(account, sessionId);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    // =========================
    // ACCESS TOKEN GENERATION
    private String generateAccessToken(Account account) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(account.getUsername())
                .claim("accountId", account.getId())
                .issuer("jlearn")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(15, ChronoUnit.MINUTES).toEpochMilli()))
                .claim("scope", buildScope(account))
                .claim("type", "access")
                .jwtID(UUID.randomUUID().toString())
                .build();

        return signToken(header, claimsSet);
    }

    // =========================
    // REFRESH TOKEN GENERATION
    private String generateRefreshToken(Account account, String sessionId) {
        String jti = UUID.randomUUID().toString();
        Date now = new Date();
        Date expiry = new Date(Instant.now().plus(7, ChronoUnit.DAYS).toEpochMilli());

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(account.getUsername())
                .issuer("jlearn")
                .issueTime(now)
                .expirationTime(expiry)
                .jwtID(jti)
                .claim("type", "refresh")
                .claim("sessionId", sessionId)
                .build();

        String token = signToken(header, claimsSet);

        RefreshToken refreshToken = RefreshToken.builder()
                .id(jti)
                .accountId(account.getId())
                .sessionId(sessionId)
                .expiryDate(expiry)
                .revoked(false)
                .createdAt(now)
                .build();

        refreshTokenService.save(refreshToken);

        return token;
    }

    // =========================
    // SIGN JWT
    private String signToken(JWSHeader header, JWTClaimsSet claimsSet) {
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(key.getBytes(StandardCharsets.UTF_8)));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    // =========================
    // REFRESH TOKEN
    // =========================
    @Transactional
    public AuthResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        String refreshToken = request.getRefreshToken();

        // 1. Verify chữ ký, hạn dùng & tài khoản bị khóa trong Token
        SignedJWT signedJWT = verifyRefreshToken(refreshToken);
        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

        String jti = claims.getJWTID();
        String username = claims.getSubject();
        String sessionId = claims.getStringClaim("sessionId");

        // 2. Lấy refresh token từ Database
        RefreshToken storedToken = refreshTokenRepository.findById(jti)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // 3. Phát hiện hành vi tái sử dụng Token (Token Reuse Attack)
        if (storedToken.isRevoked()) {
            log.warn("Refresh token reuse detected. jti={}, sessionId={}, username={}", jti, sessionId, username);
            refreshTokenService.revokeBySessionId(sessionId);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 4. Kiểm tra Hạn dùng trong DB
        if (storedToken.getExpiryDate().before(new Date())) {
            storedToken.setRevoked(true);
            refreshTokenRepository.save(storedToken);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 5. Kiểm tra Session ID
        if (!sessionId.equals(storedToken.getSessionId())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 6. Thu hồi RT cũ
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // 7. Lấy account & Cấp cặp Token mới
        Account account = accountService.getAccountByUsername(username);

        String newAccessToken = generateAccessToken(account);
        String newRefreshToken = generateRefreshToken(account, sessionId);

        SignedJWT newSignedJWT = SignedJWT.parse(newRefreshToken);
        String newJti = newSignedJWT.getJWTClaimsSet().getJWTID();

        // 8. Đánh dấu liên kết sang Token mới
        storedToken.setReplacedBy(newJti);
        refreshTokenRepository.save(storedToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .authenticated(true)
                .build();
    }

    // =========================
    // VERIFY REFRESH TOKEN
    // =========================
    private SignedJWT verifyRefreshToken(String token)
            throws ParseException, JOSEException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(key.getBytes(StandardCharsets.UTF_8));

        if (!signedJWT.verify(verifier)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
        Date expiry = claims.getExpirationTime();

        if (expiry == null || expiry.before(new Date())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (!"refresh".equals(claims.getClaim("type"))) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String username = claims.getSubject();
        Account account = accountService.getAccountByUsername(username);
        if (Status.LOCKED.name().equalsIgnoreCase(account.getStatus())) {
            throw new AppException(ErrorCode.LOCKED);
        }

        return signedJWT;
    }

    // =========================
    // LOGOUT
    // =========================
    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        SignedJWT accessToken = verifyAccessToken(request.getToken());
        JWTClaimsSet claims = accessToken.getJWTClaimsSet();

        String jti = claims.getJWTID();
        Date expiry = claims.getExpirationTime();

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(jti)
                .expiryDate(expiry)
                .build();

        invalidatedTokenRepository.save(invalidatedToken);
    }


    private SignedJWT verifyAccessToken(String token) throws ParseException, JOSEException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(key.getBytes(StandardCharsets.UTF_8));

        if (!signedJWT.verify(verifier)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
        Date expiry = claims.getExpirationTime();

        if (expiry == null || expiry.before(new Date())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (!"access".equals(claims.getClaim("type"))) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String jti = claims.getJWTID();
        if (invalidatedTokenRepository.existsById(jti)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String username = claims.getSubject();
        Account account = accountService.getAccountByUsername(username);
        if (Status.LOCKED.name().equalsIgnoreCase(account.getStatus())) {
            throw new AppException(ErrorCode.LOCKED);
        }

        return signedJWT;
    }


    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            verifyAccessToken(request.getToken());
            return IntrospectResponse.builder()
                    .valid(true)
                    .build();
        } catch (Exception e) {
            return IntrospectResponse.builder()
                    .valid(false)
                    .build();
        }
    }

    private String buildScope(Account account) {
        StringJoiner stringJoiner = new StringJoiner(" ");
        if (!CollectionUtils.isEmpty(account.getRoles())) {
            account.getRoles().forEach(role -> stringJoiner.add(role.getName()));
        }
        return stringJoiner.toString();
    }
}