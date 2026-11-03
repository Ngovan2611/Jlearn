package profile.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class UserStatisticsResponse {

    long totalProfiles;

    long profilesWithEmail;

    long profilesWithPhone;

    long profilesWithAvatar;

    long completedProfiles;

    private Map<String, Long> genderDistribution;
}