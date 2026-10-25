package enrollment.repository.httpClient;

import enrollment.dto.request.AddSkillsRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "user-service",
        url = "${app.services.user}"
)
public interface ProfileClient {

    @PostMapping("/profile/internal/{userId}/skills")
    void addSkills(
            @PathVariable("userId") String userId,
            @RequestBody AddSkillsRequest request
    );
}