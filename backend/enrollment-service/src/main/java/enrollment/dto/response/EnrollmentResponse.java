package enrollment.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EnrollmentResponse {

    String id;

    String userId;

    String courseId;

    String courseTitle;

    LocalDateTime enrolledAt;

    String status;
}