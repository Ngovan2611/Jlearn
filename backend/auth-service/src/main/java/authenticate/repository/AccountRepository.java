package authenticate.repository;

import authenticate.dto.response.UserBasicResponse;
import authenticate.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {
    boolean existsAccountByUsername(String username);

    Optional<Account> findAccountByUsername(String username);

    @Query("SELECT DISTINCT new authenticate.dto.response.UserBasicResponse(a.id, a.username, CAST(a.status AS string)) " +
            "FROM Account a JOIN a.roles r " +
            "WHERE UPPER(r.name) NOT IN ('ADMIN', 'ROLE_ADMIN') " +
            "  AND (:keyword IS NULL OR :keyword = '' " +
            "       OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "       OR LOWER(a.id) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<UserBasicResponse> searchUsersBasicExceptAdmin(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
    SELECT COUNT(DISTINCT a.id)
    FROM Account a
    JOIN a.roles r
    WHERE UPPER(r.name) NOT IN ('ADMIN', 'ROLE_ADMIN')
""")
    long countUsersExceptAdmin();

}