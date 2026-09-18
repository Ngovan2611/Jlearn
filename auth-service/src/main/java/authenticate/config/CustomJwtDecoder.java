package authenticate.config;

import authenticate.dto.request.IntrospectRequest;
import authenticate.service.AuthService;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.spec.SecretKeySpec;
import java.text.ParseException;
import java.util.Objects;

@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
@Component
public class CustomJwtDecoder implements JwtDecoder {

    @NonFinal
    @Value("${jwt.signerKey}")
    private String key;

    private final AuthService authService;
    NimbusJwtDecoder jwtDecoder = null;

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            var response = authService.introspect(IntrospectRequest.builder()
                    .token(token).build());
            if (!response.isValid()) {
                throw new JwtException("Invalid token");
            }
        } catch (ParseException | JOSEException e) {
            throw new JwtException(e.getMessage());
        }
        if(Objects.isNull(jwtDecoder)){
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(), "HS512");
            jwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
                    .macAlgorithm(MacAlgorithm.HS512)
                    .build();
        }
        return jwtDecoder.decode(token);
    }
}
