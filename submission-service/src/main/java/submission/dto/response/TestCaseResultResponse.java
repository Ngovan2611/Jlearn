package submission.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResultResponse {
    int testCaseNumber;
    boolean passed;
    String actualOutput;
    Long executionTimeMs;
    String errorMessage;
}