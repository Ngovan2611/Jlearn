package authenticate.service;


import authenticate.config.PasswordEncoderConfig;
import authenticate.dto.request.AccountCreationRequest;
import authenticate.dto.response.AccountResponse;
import authenticate.entity.Account;
import authenticate.entity.Role;
import authenticate.exception.AppException;
import authenticate.exception.ErrorCode;
import authenticate.mapper.AccountMapper;
import authenticate.repository.AccountRepository;
import authenticate.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AccountService {
    AccountRepository accountRepository;
    AccountMapper  accountMapper;
    PasswordEncoderConfig  passwordEncoderConfig;
    RoleService roleService;

    public AccountResponse createAccount(AccountCreationRequest accountCreationRequest) {
        Account account = accountMapper.toEntity(accountCreationRequest);



        if(accountRepository.existsAccountByUsername(accountCreationRequest.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }


        account.setPassword(passwordEncoderConfig.passwordEncoder()
                .encode(accountCreationRequest.getPassword()));

        var roles = roleService.getAllByNameIn(accountCreationRequest.getRoles());
        account.setRoles(new HashSet<>(roles));

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

    public AccountResponse myInF() {
        SecurityContext securityContext = SecurityContextHolder.getContext();

        var name = securityContext.getAuthentication().getName();

        Account account = getAccountByUsername(name);

        return accountMapper.toAccountResponse(account);


    }
}
