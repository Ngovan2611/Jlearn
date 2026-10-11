package execution.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RunExerciseResponse {

    String exerciseId;

    String status;

    boolean allPassed;

    int totalTestCases;

    int passedTestCases;

    long executionTimeMs;

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