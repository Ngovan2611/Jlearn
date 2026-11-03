package profile.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import profile.entity.Skill;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;


@FieldDefaults (level =AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ProfileResponse {
    String id;
    String firstName;
    String lastName;
    String email;
    LocalDate dob;
    String gender;
    String url;
    List<String> skills;

}
