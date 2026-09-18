package authenticate.service;

import authenticate.entity.RefreshToken;
import authenticate.exception.AppException;
import authenticate.exception.ErrorCode;
import authenticate.repository.RefreshTokenRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
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
        return refreshTokenRepository
                .findByIdAndRevokedFalse(id)
                .orElseThrow(() ->
                        new AppException(ErrorCode.UNAUTHENTICATED));
    }

    public void revoke(RefreshToken token) {
        token.setRevoked(true);
        refreshTokenRepository.save(token);
    }

    public void revokeBySessionId(String sessionId) {

        List<RefreshToken> tokens =
                refreshTokenRepository.findAllBySessionId(sessionId);

        tokens.forEach(token -> token.setRevoked(true));

        refreshTokenRepository.saveAll(tokens);

        log.warn(
                "All refresh tokens revoked for session: {}",
                sessionId
        );
    }

    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteByExpiryDateBefore(new Date());
    }
}