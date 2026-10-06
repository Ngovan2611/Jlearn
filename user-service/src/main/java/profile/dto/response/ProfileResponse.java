package profile.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;


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
}
