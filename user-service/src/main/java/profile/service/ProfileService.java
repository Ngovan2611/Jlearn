package profile.service;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import profile.dto.request.ProfileCreationRequest;
import profile.dto.request.ProfileUpdateRequest;
import profile.dto.response.ProfileResponse;
import profile.entity.Profile;
import profile.mapper.ProfileMapper;
import profile.repository.ProfileRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileService {

    ProfileRepository profileRepository;
    ProfileMapper profileMapper;


    public ProfileResponse createProfile(ProfileCreationRequest profileCreationRequest) {
        Profile profile = profileMapper.toUserProfile(profileCreationRequest);

        profileRepository.save(profile);

        return profileMapper.toProfileResponse(profile);

    }

    public ProfileResponse getProfile(String id) {

        Profile profile = profileRepository.findById(id).orElse(null);
        return profileMapper.toProfileResponse(profile);
    }

    public ProfileResponse updateProfile(String profileId, ProfileUpdateRequest profileUpdateRequest) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        profileMapper.updateProfile(profileUpdateRequest, profile);
        profileRepository.save(profile);
        return profileMapper.toProfileResponse(profile);

    }

}
