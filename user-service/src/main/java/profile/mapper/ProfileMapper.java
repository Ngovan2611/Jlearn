package profile.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import profile.dto.request.ProfileCreationRequest;
import profile.dto.request.ProfileUpdateRequest;
import profile.dto.response.ProfileResponse;
import profile.entity.Profile;

@Mapper(componentModel = "spring")
public interface ProfileMapper {

    Profile toUserProfile(ProfileCreationRequest profileCreationRequest);

    ProfileResponse toProfileResponse(Profile profile);

    void updateProfile(ProfileUpdateRequest profileUpdateRequest,
                       @MappingTarget Profile profile);
}
