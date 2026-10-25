
package profile.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import profile.dto.request.ProfileCreationRequest;
import profile.dto.request.ProfileUpdateRequest;
import profile.dto.response.ProfileResponse;
import profile.entity.Profile;
import profile.entity.Skill;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ProfileMapper {

    @Mapping(target = "skills", source = "skills", qualifiedByName = "skillsToNames")
    ProfileResponse toProfileResponse(Profile profile);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "skills", ignore = true)
    Profile toUserProfile(ProfileCreationRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "skills", ignore = true)
    void updateProfile(
            ProfileUpdateRequest request,
            @MappingTarget Profile profile
    );

    @Named("skillsToNames")
    default List<String> skillsToNames(List<Skill> skills) {
        if (skills == null) {
            return Collections.emptyList();
        }

        return skills.stream()
                .filter(skill -> skill != null && skill.getName() != null)
                .map(Skill::getName)
                .distinct()
                .toList();
    }
}
