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

    public AuthResponse authenticate(
            AuthRequest authRequest
    ) {

        Account account =
                accountService.getAccountByUsername(
                        authRequest.getUsername()
                );

        boolean authenticated =
                passwordEncoder.matches(
                        authRequest.getPassword(),
                        account.getPassword()
                );

        if (!authenticated) {
            throw new AppException(
                    ErrorCode.INVALID_CREDENTIALS
            );
        }

        String sessionId =
                UUID.randomUUID().toString();

        String accessToken =
                generateAccessToken(account);

        String refreshToken =
                generateRefreshToken(
                        account,
                        sessionId
                );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }


    // =========================
    // ACCESS TOKEN
    // =========================

    private String generateAccessToken(Account account) {

        JWSHeader header =
                new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet =
                new JWTClaimsSet.Builder()
                        .subject(account.getUsername())
                        .claim("accountId", account.getId())
                        .issuer("jlearn")
                        .issueTime(new Date())
                        .expirationTime(
                                new Date(
                                        Instant.now()
                                                .plus(
                                                        15,
                                                        ChronoUnit.MINUTES
                                                )
                                                .toEpochMilli()
                                )
                        )
                        .claim(
                                "scope",
                                buildScope(account)
                        )
                        .claim("type", "access")
                        .jwtID(UUID.randomUUID().toString())
                        .build();

        return signToken(header, claimsSet);
    }


    // =========================
    // REFRESH TOKEN
    // =========================

    private String generateRefreshToken(
            Account account,
            String sessionId
    ) {

        String jti = UUID.randomUUID().toString();

        Date now = new Date();

        Date expiry = new Date(
                Instant.now()
                        .plus(7, ChronoUnit.DAYS)
                        .toEpochMilli()
        );

        JWSHeader header =
                new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet =
                new JWTClaimsSet.Builder()
                        .subject(account.getUsername())
                        .issuer("jlearn")
                        .issueTime(now)
                        .expirationTime(expiry)
                        .jwtID(jti)
                        .claim("type", "refresh")
                        .claim("sessionId", sessionId)
                        .build();

        String token = signToken(header, claimsSet);

        RefreshToken refreshToken =
                RefreshToken.builder()
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
    // =========================

    private String signToken(
            JWSHeader header,
            JWTClaimsSet claimsSet
    ) {

        Payload payload =
                new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject =
                new JWSObject(header, payload);

        try {

            jwsObject.sign(
                    new MACSigner(
                            key.getBytes(StandardCharsets.UTF_8)
                    )
            );

            return jwsObject.serialize();

        } catch (JOSEException e) {

            log.error("Cannot create token", e);

            throw new RuntimeException(e);
        }
    }


    // =========================
    // REFRESH
    // =========================

    @Transactional
    public AuthResponse refreshToken(
            RefreshRequest request
    ) throws ParseException, JOSEException {

        // 1. Verify refresh token
        String refreshToken = request.getRefreshToken();

        SignedJWT signedJWT =
                verifyRefreshToken(refreshToken);

        JWTClaimsSet claims =
                signedJWT.getJWTClaimsSet();

        // 2. Lấy thông tin
        String jti =
                claims.getJWTID();

        String username =
                claims.getSubject();

        String sessionId =
                claims.getStringClaim("sessionId");

        // 3. Lấy refresh token trong DB
        RefreshToken storedToken =
                refreshTokenRepository
                        .findById(jti)
                        .orElseThrow(() ->
                                new AppException(
                                        ErrorCode.UNAUTHENTICATED
                                ));

        // 4. Phát hiện reuse
        if (storedToken.isRevoked()) {

            log.warn(
                    "Refresh token reuse detected. jti={}, sessionId={}, username={}",
                    jti,
                    sessionId,
                    username
            );

            refreshTokenService
                    .revokeBySessionId(sessionId);

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        // 5. Kiểm tra expiry DB
        if (storedToken.getExpiryDate().before(new Date())) {

            storedToken.setRevoked(true);

            refreshTokenRepository.save(storedToken);

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        // 6. Kiểm tra session
        if (!sessionId.equals(storedToken.getSessionId())) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        // 7. Revoke RT cũ
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // 8. Lấy account
        Account account =
                accountService.getAccountByUsername(username);

        // 9. Tạo access token mới
        String accessToken =
                generateAccessToken(account);

        // 10. Tạo refresh token mới
        String newRefreshToken =
                generateRefreshToken(
                        account,
                        sessionId
                );

        // 11. Lấy JTI RT mới
        SignedJWT newSignedJWT =
                SignedJWT.parse(newRefreshToken);

        String newJti =
                newSignedJWT
                        .getJWTClaimsSet()
                        .getJWTID();

        // 12. Gắn RT cũ -> RT mới
        storedToken.setReplacedBy(newJti);

        refreshTokenRepository.save(storedToken);

        // 13. Response
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .authenticated(true)
                .build();
    }


    // =========================
    // VERIFY REFRESH TOKEN
    // =========================

    private SignedJWT verifyRefreshToken(
            String token
    ) throws ParseException, JOSEException {

        SignedJWT signedJWT =
                SignedJWT.parse(token);

        JWSVerifier verifier =
                new MACVerifier(
                        key.getBytes(StandardCharsets.UTF_8)
                );

        boolean signatureValid =
                signedJWT.verify(verifier);

        if (!signatureValid) {
            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        JWTClaimsSet claims =
                signedJWT.getJWTClaimsSet();

        Date expiry =
                claims.getExpirationTime();

        if (expiry == null ||
                expiry.before(new Date())) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        String type =
                (String) claims.getClaim("type");

        if (!"refresh".equals(type)) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        return signedJWT;
    }


    // =========================
    // LOGOUT
    // =========================

    public void logout(
            LogoutRequest request
    ) throws ParseException, JOSEException {

        SignedJWT accessToken =
                verifyAccessToken(request.getToken());

        JWTClaimsSet claims =
                accessToken.getJWTClaimsSet();

        String jti =
                claims.getJWTID();

        Date expiry =
                claims.getExpirationTime();

        InvalidatedToken invalidatedToken =
                InvalidatedToken.builder()
                        .id(jti)
                        .expiryDate(expiry)
                        .build();

        invalidatedTokenRepository.save(
                invalidatedToken
        );
    }



    // =========================
    // VERIFY ACCESS TOKEN
    // =========================

    private SignedJWT verifyAccessToken(
            String token
    ) throws ParseException, JOSEException {

        SignedJWT signedJWT =
                SignedJWT.parse(token);

        JWSVerifier verifier =
                new MACVerifier(
                        key.getBytes(StandardCharsets.UTF_8)
                );

        if (!signedJWT.verify(verifier)) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        JWTClaimsSet claims =
                signedJWT.getJWTClaimsSet();

        Date expiry =
                claims.getExpirationTime();

        if (expiry == null ||
                expiry.before(new Date())) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        String type =
                (String) claims.getClaim("type");

        if (!"access".equals(type)) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        String jti =
                claims.getJWTID();

        if (invalidatedTokenRepository
                .existsById(jti)) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        return signedJWT;
    }


    // =========================
    // INTROSPECT
    // =========================

    public IntrospectResponse introspect(
            IntrospectRequest request
    ) {

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


    // =========================
    // SCOPE
    // =========================

    private String buildScope(Account account) {

        StringJoiner stringJoiner =
                new StringJoiner(" ");

        if (!CollectionUtils.isEmpty(
                account.getRoles()
        )) {

            account.getRoles()
                    .forEach(role ->
                            stringJoiner.add(
                                    role.getName()
                            )
                    );
        }

        return stringJoiner.toString();
    }
    private SignedJWT verifyToken(
            String token
    ) throws JOSEException, ParseException {

        JWSVerifier verifier =
                new MACVerifier(
                        key.getBytes(StandardCharsets.UTF_8)
                );

        SignedJWT signedJWT =
                SignedJWT.parse(token);

        Date expiryTime =
                signedJWT
                        .getJWTClaimsSet()
                        .getExpirationTime();

        boolean signatureValid =
                signedJWT.verify(verifier);

        if (!signatureValid ||
                expiryTime.before(new Date())) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        return signedJWT;
    }
}