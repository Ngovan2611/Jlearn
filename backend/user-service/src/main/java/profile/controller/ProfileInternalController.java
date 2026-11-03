package profile.controller;


import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import profile.dto.request.AddSkillsRequest;
import profile.dto.request.ProfileCreationRequest;
import profile.dto.response.ApiResponse;
import profile.dto.response.ProfileResponse;
import profile.service.ProfileService;
import profile.service.ProfileSkillService;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileInternalController {

    ProfileService profileService;
    ProfileSkillService profileSkillService;

    @PostMapping("/internal/users")
    ApiResponse<ProfileResponse> createProfile(@RequestBody ProfileCreationRequest profileCreationRequest) {
        return ApiResponse.<ProfileResponse>builder()
                .result(profileService.createProfile(profileCreationRequest))
                .code(200)
                .build();
    }


    @PostMapping("/internal/{userId}/skills")
    public void addSkills(
            @PathVariable String userId,
            @RequestBody @Valid AddSkillsRequest request
    ) {
        profileSkillService.addSkills(
                userId,
                request.getSkills()
        );
    }
}
