package authenticate.repository.httpclient;

import authenticate.config.AuthenticationRequest;
import authenticate.dto.request.ProfileCreationRequest;
import authenticate.dto.response.ProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "user-service", url = "${app.services.profile}"
        , configuration = {AuthenticationRequest.class})
public interface ProfileClient {

    @PostMapping(value = "internal/users", produces = MediaType.APPLICATION_JSON_VALUE)
    ProfileResponse createProfile(@RequestBody ProfileCreationRequest profileCreationRequest);

}
