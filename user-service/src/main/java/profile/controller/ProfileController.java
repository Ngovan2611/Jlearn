package profile.controller;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import profile.dto.request.ProfileCreationRequest;
import profile.dto.response.ProfileResponse;
import profile.service.ProfileService;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileController {

    ProfileService profileService;

    @PostMapping("/users")
    ProfileResponse createProfile(@RequestBody ProfileCreationRequest profileCreationRequest) {
        return profileService.createProfile(profileCreationRequest);
    }

    @GetMapping("/users/{profileId}")
    ProfileResponse getProfile(@PathVariable String profileId){
        return profileService.getProfile(profileId);
    }
}
