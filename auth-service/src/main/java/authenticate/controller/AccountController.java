package authenticate.controller;


import authenticate.dto.request.AccountCreationRequest;
import authenticate.dto.response.AccountResponse;
import authenticate.dto.response.ApiResponse;
import authenticate.entity.Account;
import authenticate.service.AccountService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AccountController {
    AccountService accountService;

    @GetMapping("/{id}")
    public AccountResponse getAccount(@PathVariable String id) {
        return accountService.getAccountById(id);
    }

    @PostMapping("/register")
    public ApiResponse<AccountResponse> register(@RequestBody AccountCreationRequest account) {

        ApiResponse<AccountResponse> response = new ApiResponse<>();
        response.setCode(200);
        response.setResult(accountService.createAccount(account));

        return response;
    }
}
