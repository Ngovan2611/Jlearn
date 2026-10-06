package authenticate.controller;


import authenticate.dto.request.AuthRequest;
import authenticate.dto.request.IntrospectRequest;
import authenticate.dto.request.LogoutRequest;
import authenticate.dto.request.RefreshRequest;
import authenticate.dto.response.ApiResponse;
import authenticate.dto.response.AuthResponse;
import authenticate.dto.response.IntrospectResponse;
import authenticate.service.AuthService;
import authenticate.service.LogoutService;
import authenticate.service.RefreshTokenService;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;
import java.time.Duration;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,  makeFinal = true)
public class AuthController {
    AuthService authService;
    LogoutService logoutService;
    RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @RequestBody AuthRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse =
                authService.authenticate(request);

        setAccessTokenCookie(
                response,
                authResponse.getAccessToken()
        );

        setRefreshTokenCookie(
                response,
                authResponse.getRefreshToken()
        );

        return ApiResponse.<AuthResponse>builder()
                .result(authResponse)
                .build();
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(
            @RequestBody IntrospectRequest introspectRequest) {

        var result = authService.introspect(introspectRequest);

        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ParseException, JOSEException {

        logoutService.logout(request, response);

        return ApiResponse.<Void>builder()
                .build();
    }


    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ParseException, JOSEException {

        String refreshToken =
                refreshTokenService.extractRefreshToken(request);

        RefreshRequest refreshRequest =
                RefreshRequest.builder()
                        .refreshToken(refreshToken)
                        .build();

        AuthResponse authResponse =
                authService.refreshToken(refreshRequest);

        setAccessTokenCookie(
                response,
                authResponse.getAccessToken()
        );

        setRefreshTokenCookie(
                response,
                authResponse.getRefreshToken()
        );

        return ApiResponse.<AuthResponse>builder()
                .result(authResponse)
                .build();
    }
    private void setAccessTokenCookie(
            HttpServletResponse response,
            String token
    ) {
        ResponseCookie cookie = ResponseCookie
                .from("accessToken", token)
                .httpOnly(true)
                .secure(false) // localhost
                .path("/")
                .maxAge(Duration.ofMinutes(15))
                .sameSite("Lax")
                .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }

    private void setRefreshTokenCookie(
            HttpServletResponse response,
            String token
    ) {
        ResponseCookie cookie = ResponseCookie
                .from("refreshToken", token)
                .httpOnly(true)
                .secure(false) // localhost
                .path("/")
                .maxAge(Duration.ofDays(7))
                .sameSite("Lax")
                .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }
}
