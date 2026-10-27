package profile.dto.request;


import lombok.*;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder

public class ProfileCreationRequest {

    String userId;

}

