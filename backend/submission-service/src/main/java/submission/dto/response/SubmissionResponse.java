package submission.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import submission.enums.GradingStatus;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionResponse {

    String id;
    String userId;
    String exerciseId;
    String sourceCode;
    String language;

    GradingStatus gradingStatus;

    Double score;
    String feedback;

    Instant submittedAt;
    Instant gradedAt;
}