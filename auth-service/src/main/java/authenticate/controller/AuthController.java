package authenticate.controller;


import authenticate.dto.request.AuthRequest;
import authenticate.dto.request.IntrospectRequest;
import authenticate.dto.request.LogoutRequest;
import authenticate.dto.request.RefreshRequest;
import authenticate.dto.response.ApiResponse;
import authenticate.dto.response.AuthResponse;
import authenticate.dto.response.IntrospectResponse;
import authenticate.service.AuthService;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,  makeFinal = true)
public class AuthController {
    AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @RequestBody AuthRequest request
    ) {

        return ApiResponse.<AuthResponse>builder()
                .result(
                        authService.authenticate(request)
                )
                .build();
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest introspectRequest)
            throws ParseException, JOSEException {

        var result = authService.introspect(introspectRequest);

        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .build();


    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @RequestBody LogoutRequest request
    ) throws ParseException, JOSEException {

        authService.logout(request);

        return ApiResponse.<Void>builder()
                .build();
    }


    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(
            @RequestBody RefreshRequest request
    ) throws ParseException, JOSEException {

        return ApiResponse.<AuthResponse>builder()
                .result(
                        authService.refreshToken(request)
                )
                .build();
    }
}
