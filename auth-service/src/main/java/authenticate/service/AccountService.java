package authenticate.service;


import authenticate.config.PasswordEncoderConfig;
import authenticate.dto.request.AccountCreationRequest;
import authenticate.dto.request.ProfileCreationRequest;
import authenticate.dto.request.UpdateStatusAccountRequest;
import authenticate.dto.response.AccountResponse;
import authenticate.dto.response.PageResponse;
import authenticate.dto.response.UserBasicResponse;
import authenticate.entity.Account;
import authenticate.enums.Role;
import authenticate.exception.AppException;
import authenticate.exception.ErrorCode;
import authenticate.mapper.AccountMapper;
import authenticate.repository.AccountRepository;
import authenticate.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
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

        var userRole = roleService.getRoleByName(Role.USER.toString());

        account.setRoles(new HashSet<>());
        account.getRoles().add(userRole);


        AccountResponse accountResponse = accountMapper.toAccountResponse(accountRepository.save(account));
        ProfileCreationRequest profileCreationRequest = ProfileCreationRequest.builder()
                .userId(account.getId())
                .build();



        profileClient.createProfile(profileCreationRequest);
        return accountResponse;

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
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<UserBasicResponse> getAllUsersBasic(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("username").ascending());
        String searchKeyword = (keyword != null) ? keyword.trim() : "";

        var pageData = accountRepository.searchUsersBasicExceptAdmin(searchKeyword, pageable);

        return PageResponse.<UserBasicResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .data(pageData.getContent())
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserBasicResponse updateAccountStatus(String accountId, UpdateStatusAccountRequest request) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        try {
            account.setStatus(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ! Chỉ chấp nhận ACTIVE hoặc LOCKED.");
        }

        Account savedAccount = accountRepository.save(account);

        return UserBasicResponse.builder()
                .accountId(savedAccount.getId())
                .username(savedAccount.getUsername())
                .status(savedAccount.getStatus())
                .build();
    }
}
