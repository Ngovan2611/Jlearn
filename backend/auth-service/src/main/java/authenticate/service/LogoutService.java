package authenticate.service;

import authenticate.dto.request.LogoutRequest;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.text.ParseException;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LogoutService {

    AuthService authService;

    public void logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ParseException, JOSEException {

        Cookie[] cookies = request.getCookies();

        if (cookies != null) {

            String accessToken = null;

            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    accessToken = cookie.getValue();
                    break;
                }
            }

            if (accessToken != null && !accessToken.isBlank()) {

                LogoutRequest logoutRequest =
                        LogoutRequest.builder()
                                .token(accessToken)
                                .build();

                authService.logout(logoutRequest);
            }
        }

        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");
    }

    private void clearCookie(
            HttpServletResponse response,
            String name
    ) {
        ResponseCookie cookie = ResponseCookie
                .from(name, "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }
}