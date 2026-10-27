
package submission.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionStatisticsResponse {

    long totalSubmissions;

    long pending;
    long grading;
    long completed;
    long failed;

    double averageScore;
}
