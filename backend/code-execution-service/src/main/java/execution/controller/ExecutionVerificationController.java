package execution.controller;


import execution.dto.request.VerifyExecutionRequest;
import execution.dto.response.ApiResponse;
import execution.service.ExecutionVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/executions")
@RequiredArgsConstructor
public class ExecutionVerificationController {

    private final ExecutionVerificationService verificationService;

    @PostMapping("/verify")
    public ApiResponse<?> verify(
            @RequestBody VerifyExecutionRequest request
    ) {

        var authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            throw new IllegalStateException("Unauthenticated");
        }

        String userId = jwtAuth.getToken()
                .getClaimAsString("accountId");

        if (userId == null || userId.isBlank()) {
            userId = jwtAuth.getToken().getSubject();
        }

        return ApiResponse.builder()
                .result(
                        verificationService.verify(request, userId)
                )
                .build();
    }
}