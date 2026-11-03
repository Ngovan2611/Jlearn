package submission.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiGradingRequest {

    String submissionId;
    String userId;
    String exerciseId;
    String sourceCode;
    String language;
    double maxScore;
}