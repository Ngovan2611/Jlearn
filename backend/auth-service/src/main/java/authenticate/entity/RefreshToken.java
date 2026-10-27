package authenticate.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefreshToken {

    @Id
    String id; // JTI

    String accountId;

    String sessionId;

    Date expiryDate;

    boolean revoked;

    Date createdAt;

    String replacedBy;
}