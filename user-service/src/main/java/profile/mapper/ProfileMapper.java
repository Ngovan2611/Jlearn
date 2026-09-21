package profile.mapper;

import org.mapstruct.Mapper;
import profile.dto.request.ProfileCreationRequest;
import profile.dto.response.ProfileResponse;
import profile.entity.Profile;

@Mapper(componentModel = "spring")
public interface ProfileMapper {

    Profile toUserProfile(ProfileCreationRequest profileCreationRequest);

    ProfileResponse toProfileResponse(Profile profile);

}
