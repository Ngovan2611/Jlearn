package authenticate.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {
    String id;
    String username;
    Set<RoleResponse> roles;
}
