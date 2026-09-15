package authenticate.repository;


import authenticate.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account,String> {
    boolean existsAccountByUsername(String username);

    Optional<Account> findAccountByUsername(String username);
}
