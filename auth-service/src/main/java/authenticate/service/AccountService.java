package authenticate.service;


import authenticate.config.PasswordEncoderConfig;
import authenticate.dto.request.AccountCreationRequest;
import authenticate.dto.request.ProfileCreationRequest;
import authenticate.dto.response.AccountResponse;
import authenticate.entity.Account;
import authenticate.exception.AppException;
import authenticate.exception.ErrorCode;
import authenticate.mapper.AccountMapper;
import authenticate.repository.AccountRepository;
import authenticate.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashSet;

@Slf4j
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AccountService {
    AccountRepository accountRepository;
    AccountMapper  accountMapper;
    PasswordEncoderConfig  passwordEncoderConfig;
    RoleService roleService;
    ProfileClient profileClient;


    public AccountResponse createAccount(AccountCreationRequest accountCreationRequest) {
        Account account = accountMapper.toEntity(accountCreationRequest);

        if(accountRepository.existsAccountByUsername(accountCreationRequest.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        account.setPassword(passwordEncoderConfig.passwordEncoder()
                .encode(accountCreationRequest.getPassword()));

        var userRole = roleService.getRoleByName("USER");

        account.setRoles(new HashSet<>());
        account.getRoles().add(userRole);


        AccountResponse accountResponse = accountMapper.toAccountResponse(accountRepository.save(account));
        ProfileCreationRequest profileCreationRequest = ProfileCreationRequest.builder()
                .userId(account.getId())
                .build();



        profileClient.createProfile(profileCreationRequest);
        return accountResponse;

    }


    public AccountResponse getAccountById(String id) {
        return accountMapper.toAccountResponse(accountRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS)));
    }

    public Account getAccountByUsername(String username) {
        return accountRepository.findAccountByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));
    }

    public AccountResponse myInF() {
        SecurityContext securityContext = SecurityContextHolder.getContext();

        var name = securityContext.getAuthentication().getName();

        Account account = getAccountByUsername(name);

        return accountMapper.toAccountResponse(account);


    }
}
