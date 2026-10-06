package profile.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import profile.dto.request.ProfileCreationRequest;
import profile.dto.request.ProfileUpdateRequest;
import profile.dto.response.ApiResponse;
import profile.dto.response.ProfileResponse;
import profile.service.ProfileService;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileController {

    ProfileService profileService;

    // Tạo profile
    @PostMapping("/users")
    ApiResponse<ProfileResponse> createProfile(
            @RequestBody ProfileCreationRequest profileCreationRequest) {

        return ApiResponse.<ProfileResponse>builder()
                .code(200)
                .result(profileService.createProfile(profileCreationRequest))
                .build();
    }

    // Lấy profile của chính mình
    @GetMapping("/users/me")
    ApiResponse<ProfileResponse> getMyProfile() {

        return ApiResponse.<ProfileResponse>builder()
                .code(200)
                .result(profileService.getMyProfile())
                .build();
    }

    // Xem profile của người khác
    @GetMapping("/users/{userId}")
    ApiResponse<ProfileResponse> getProfile(
            @PathVariable("userId") String userId) {

        return ApiResponse.<ProfileResponse>builder()
                .code(200)
                .result(profileService.getProfileByUserId(userId))
                .build();
    }

    // Cập nhật profile của chính mình
    @PutMapping("/users/me")
    ApiResponse<ProfileResponse> updateMyProfile(
            @RequestBody ProfileUpdateRequest request) {

        return ApiResponse.<ProfileResponse>builder()
                .code(200)
                .result(profileService.updateMyProfile(request))
                .build();
    }

    // Admin lấy tất cả profile
    @GetMapping("/users/get")
    ApiResponse<List<ProfileResponse>> getProfile() {

        return ApiResponse.<List<ProfileResponse>>builder()
                .code(200)
                .result(profileService.getAllProfile())
                .build();
    }
}