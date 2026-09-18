package authenticate.service;

import authenticate.repository.InvalidatedTokenRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Transactional

public class InvalidatedTokenCleanupService {

    InvalidatedTokenRepository invalidatedTokenRepository;

    @Scheduled(fixedRate = 60000)
    public void deleteExpiredTokens() {

        Date now = new Date();

        invalidatedTokenRepository.deleteByExpiryDateBefore(now);

        log.info("Cleaned up expired invalidated tokens at {}", now);
    }
}