
package profile.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import profile.dto.request.ProfileCreationRequest;
import profile.dto.request.ProfileUpdateRequest;
import profile.dto.response.ProfileResponse;
import profile.entity.Profile;
import profile.entity.Skill;
import profile.mapper.ProfileMapper;
import profile.repository.ProfileRepository;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileService {

    ProfileRepository profileRepository;
    ProfileMapper profileMapper;

    /**
     * Tạo hồ sơ mới.
     */
    @Transactional
    public ProfileResponse createProfile(
            ProfileCreationRequest request
    ) {
        Profile profile = profileMapper.toUserProfile(request);

        Profile savedProfile = profileRepository.save(profile);

        return toProfileResponseWithSkills(savedProfile);
    }


    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUserId(String userId) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();


        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        Objects.equals(authority.getAuthority(), "ROLE_ADMIN"))) {

            String currentAccountId = getCurrentAccountId();

            if (currentAccountId.equals(userId)) {
                return null;
            }
        }

        Profile profile = profileRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Profile not found"));

        return toProfileResponseWithSkills(profile);
    }

    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        Objects.equals(authority.getAuthority(), "ROLE_ADMIN"))) {
            return null;
        }

        String accountId = getCurrentAccountId();

        return getProfileByUserId(accountId);
    }


    @Transactional
    public ProfileResponse updateMyProfile(
            ProfileUpdateRequest request
    ) {
        String accountId = getCurrentAccountId();

        Profile profile = profileRepository
                .findByUserId(accountId)
                .orElseThrow(() ->
                        new RuntimeException("Profile not found"));

        profileMapper.updateProfile(request, profile);

        Profile savedProfile = profileRepository.save(profile);

        return toProfileResponseWithSkills(savedProfile);
    }

    /**
     * Lấy toàn bộ hồ sơ.
     * Chỉ ADMIN được phép thực hiện.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<ProfileResponse> getAllProfile() {
        return profileRepository.findAll()
                .stream()
                .map(this::toProfileResponseWithSkills)
                .toList();
    }

    /**
     * Lấy accountId từ JWT của người dùng hiện tại.
     */
    private String getCurrentAccountId() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException(
                    "Không tìm thấy thông tin xác thực JWT");
        }

        String accountId = jwt.getClaimAsString("accountId");

        if (accountId == null || accountId.isBlank()) {
            throw new IllegalStateException(
                    "JWT không chứa claim accountId");
        }

        return accountId;
    }

    /**
     * Chuyển Profile thành ProfileResponse,
     * đồng thời ánh xạ danh sách Skill thành danh sách tên.
     */
    private ProfileResponse toProfileResponseWithSkills(
            Profile profile
    ) {
        ProfileResponse response =
                profileMapper.toProfileResponse(profile);

        if (response == null) {
            return null;
        }

        List<String> skills = profile.getSkills() == null
                ? Collections.emptyList()
                : profile.getSkills()
                .stream()
                .filter(Objects::nonNull)
                .map(Skill::getName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .distinct()
                .toList();

        response.setSkills(skills);

        return response;
    }
}
