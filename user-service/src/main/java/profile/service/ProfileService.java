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
import profile.dto.request.ProfileCreationRequest;
import profile.dto.request.ProfileUpdateRequest;
import profile.dto.response.ProfileResponse;
import profile.entity.Profile;
import profile.mapper.ProfileMapper;
import profile.repository.ProfileRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileService {

    ProfileRepository profileRepository;
    ProfileMapper profileMapper;

    public ProfileResponse createProfile(
            ProfileCreationRequest profileCreationRequest) {

        Profile profile =
                profileMapper.toUserProfile(profileCreationRequest);

        profileRepository.save(profile);

        return profileMapper.toProfileResponse(profile);
    }
    public ProfileResponse getProfileByUserId(String userId) {

        Profile profile = profileRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Profile not found"));

        return profileMapper.toProfileResponse(profile);
    }

    public ProfileResponse getMyProfile() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        Jwt jwt = (Jwt) authentication.getPrincipal();

        String accountId =
                jwt.getClaimAsString("accountId");

        Profile profile = profileRepository
                .findByUserId(accountId)
                .orElse(null);

        return profileMapper.toProfileResponse(profile);
    }

    public ProfileResponse updateMyProfile(
            ProfileUpdateRequest request) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        Jwt jwt = (Jwt) authentication.getPrincipal();

        String accountId =
                jwt.getClaimAsString("accountId");

        Profile profile = profileRepository
                .findByUserId(accountId)
                .orElseThrow(() ->
                        new RuntimeException("Profile not found"));

        profileMapper.updateProfile(request, profile);

        profileRepository.save(profile);

        return profileMapper.toProfileResponse(profile);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<ProfileResponse> getAllProfile() {

        List<Profile> profiles =
                profileRepository.findAll();

        System.out.println(profiles.size());

        return profiles.stream()
                .map(profileMapper::toProfileResponse)
                .toList();
    }
}