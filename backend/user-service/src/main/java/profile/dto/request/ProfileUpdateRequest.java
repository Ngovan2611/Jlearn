package profile.dto.request;


import lombok.*;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ProfileUpdateRequest {
    String firstName;
    String lastName;
    String email;
    LocalDate dob;
    String gender;
    String url;
}
