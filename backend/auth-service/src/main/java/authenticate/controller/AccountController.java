package authenticate.controller;


import authenticate.dto.request.AccountCreationRequest;
import authenticate.dto.request.UpdateStatusAccountRequest;
import authenticate.dto.response.AccountResponse;
import authenticate.dto.response.ApiResponse;
import authenticate.dto.response.PageResponse;
import authenticate.dto.response.UserBasicResponse;
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



    @PostMapping("/auth/register")
    public ApiResponse<AccountResponse> register(@RequestBody AccountCreationRequest account) {

        ApiResponse<AccountResponse> response = new ApiResponse<>();
        response.setCode(200);
        response.setResult(accountService.createAccount(account));

        return response;
    }

    @GetMapping("/auth/info")
    public ApiResponse<AccountResponse> info() {


        return ApiResponse.<AccountResponse>builder()
                .code(200)
                .result(accountService.myInF())
                .build();
    }
    @GetMapping("/admin/users")
    public ApiResponse<PageResponse<UserBasicResponse>> getAllUsersBasic(
            @RequestParam(value = "keyword", required = false, defaultValue = "") String keyword,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size) {

        return ApiResponse.<PageResponse<UserBasicResponse>>builder()
                .code(200)
                .result(accountService.getAllUsersBasic(keyword, page, size))
                .build();
    }
    @PatchMapping("admin/users/{accountId}/status")
    public ApiResponse<UserBasicResponse> updateAccountStatus(
            @PathVariable("accountId") String accountId,
            @RequestBody UpdateStatusAccountRequest request) {

        return ApiResponse.<UserBasicResponse>builder()
                .code(200)
                .result(accountService.updateAccountStatus(accountId, request))
                .build();
    }

    @GetMapping("/admin/statistics")
    public ApiResponse<Long> getStatistics() {
        return ApiResponse.<Long>builder()
                .code(200)
                .result(accountService.getTotalUsers())
                .build();
    }

}
