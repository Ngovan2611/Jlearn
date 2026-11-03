package execution.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RunExerciseResponse {

    String executionId;

    String exerciseId;

    String sourceCodeHash;

    String testcaseVersion;

    String status;

    boolean allPassed;

    int totalTestCases;

    int passedTestCases;

    long executionTimeMs;


    Instant executedAt;

    Instant expiresAt;

    List<TestCaseResult> testCaseResults;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class TestCaseResult {

        int testCaseNumber;

        String status;

        boolean hidden;

        String actualOutput;
    }
}