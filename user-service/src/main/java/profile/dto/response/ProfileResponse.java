package profile.dto.response;

import lombok.*;

import java.time.LocalDate;

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
