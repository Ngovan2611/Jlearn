package authenticate.service;

import authenticate.entity.RefreshToken;
import authenticate.exception.AppException;
import authenticate.exception.ErrorCode;
import authenticate.repository.RefreshTokenRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RefreshTokenService {

    RefreshTokenRepository refreshTokenRepository;

    public RefreshToken save(RefreshToken refreshToken) {
        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken getById(String id) {
        return refreshTokenRepository.findById(id)
                .orElseThrow(() ->
                        new AppException(ErrorCode.UNAUTHENTICATED));
    }

    public RefreshToken getActiveToken(String id) {
        RefreshToken refreshToken = refreshTokenRepository
                .findByIdAndRevokedFalse(id)
                .orElseThrow(() ->
                        new AppException(ErrorCode.UNAUTHENTICATED));

        if (refreshToken.getExpiryDate().before(new Date())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);

            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return refreshToken;
    }

    public void revoke(RefreshToken token) {
        token.setRevoked(true);
        refreshTokenRepository.save(token);
    }

    public void revokeById(String id) {
        RefreshToken token = getById(id);
        revoke(token);
    }

    public void revokeBySessionId(String sessionId) {

        List<RefreshToken> tokens =
                refreshTokenRepository.findAllBySessionId(sessionId);

        if (tokens.isEmpty()) {
            return;
        }

        tokens.forEach(token ->
                token.setRevoked(true)
        );

        refreshTokenRepository.saveAll(tokens);

        log.info(
                "All refresh tokens revoked for session: {}",
                sessionId
        );
    }

    public String extractRefreshToken(
            HttpServletRequest request
    ) {

        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            throw new AppException(
                    ErrorCode.UNAUTHENTICATED
            );
        }

        for (Cookie cookie : cookies) {

            if ("refreshToken".equals(cookie.getName())) {

                String token = cookie.getValue();

                if (token != null && !token.isBlank()) {
                    return token;
                }
            }
        }

        throw new AppException(
                ErrorCode.UNAUTHENTICATED
        );
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void deleteExpiredTokens() {
        Date now = new Date();
        refreshTokenRepository
                .deleteByExpiryDateBefore(now);
        log.info("Cleaned up expired refresh tokens at {}", now);

    }
}