package authenticate.repository;

import authenticate.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, String> {

    Optional<RefreshToken> findByIdAndRevokedFalse(String id);

    List<RefreshToken> findAllBySessionId(String sessionId);

    void deleteByExpiryDateBefore(Date date);
}