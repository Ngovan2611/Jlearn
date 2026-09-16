package authenticate.service;


import authenticate.dto.request.AccountCreationRequest;
import authenticate.dto.response.AccountResponse;
import authenticate.entity.Account;
import authenticate.exception.AppException;
import authenticate.exception.ErrorCode;
import authenticate.mapper.AccountMapper;
import authenticate.repository.AccountRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AccountService {
    AccountRepository accountRepository;
    AccountMapper  accountMapper;

    public AccountResponse createAccount(AccountCreationRequest accountCreationRequest) {
        Account account = accountMapper.toEntity(accountCreationRequest);

        if(accountRepository.existsAccountByUsername(accountCreationRequest.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        account.setPassword(passwordEncoder.encode(accountCreationRequest.getPassword()));
        return  accountMapper.toAccountResponse(accountRepository.save(account));
    }


    public AccountResponse getAccountById(String id) {
        return accountMapper.toAccountResponse(accountRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    public Account getAccountByUsername(String username) {
        return accountRepository.findAccountByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
