package submission.dto.response;

import lombok.*;
import submission.enums.SubmissionStatus;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {

    String id;
    String userId;
    String exerciseId;
    String language;

    SubmissionStatus status;

    double score;
    int passedTestCases;
    int totalTestCases;

    Long executionTimeMs;
    Long memoryUsedKb;

    String compileOutput;
    String errorMessage;

    List<TestCaseResultResponse> testCaseResults;

    Instant submittedAt;
    Instant completedAt;


}