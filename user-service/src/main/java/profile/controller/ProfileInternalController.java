package profile.controller;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import profile.dto.request.ProfileCreationRequest;
import profile.dto.request.ProfileUpdateRequest;
import profile.dto.response.ApiResponse;
import profile.dto.response.ProfileResponse;
import profile.service.ProfileService;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileInternalController {

    ProfileService profileService;

    @PostMapping("/internal/users")
    ApiResponse<ProfileResponse> createProfile(@RequestBody ProfileCreationRequest profileCreationRequest) {
        return ApiResponse.<ProfileResponse>builder()
                .result(profileService.createProfile(profileCreationRequest))
                .code(200)
                .build();
    }

}
