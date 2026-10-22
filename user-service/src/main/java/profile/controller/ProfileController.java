package profile.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import profile.dto.request.ProfileCreationRequest;
import profile.dto.request.ProfileUpdateRequest;
import profile.dto.response.ApiResponse;
import profile.dto.response.ProfileResponse;
import profile.service.ProfileService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/users") // Gom prefix chung cho tất cả các endpoint trong controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileController {

    ProfileService profileService;

    @PostMapping
    ApiResponse<ProfileResponse> createProfile(
            @RequestBody ProfileCreationRequest profileCreationRequest) {

        return ApiResponse.<ProfileResponse>builder()
                .code(200)
                .result(profileService.createProfile(profileCreationRequest))
                .build();
    }

    @GetMapping("/me")
    ApiResponse<ProfileResponse> getMyProfile() {

        return ApiResponse.<ProfileResponse>builder()
                .code(200)
                .result(profileService.getMyProfile())
                .build();
    }

    @PutMapping("/me")
    ApiResponse<ProfileResponse> updateMyProfile(
            @RequestBody ProfileUpdateRequest request) {

        return ApiResponse.<ProfileResponse>builder()
                .code(200)
                .result(profileService.updateMyProfile(request))
                .build();
    }


    @GetMapping
    ApiResponse<List<ProfileResponse>> getAllProfiles() {

        return ApiResponse.<List<ProfileResponse>>builder()
                .code(200)
                .result(profileService.getAllProfile())
                .build();
    }

    @GetMapping("/{userId}")
    ApiResponse<ProfileResponse> getProfile(
            @PathVariable("userId") String userId) {

        return ApiResponse.<ProfileResponse>builder()
                .code(200)
                .result(profileService.getProfileByUserId(userId))
                .build();
    }
}