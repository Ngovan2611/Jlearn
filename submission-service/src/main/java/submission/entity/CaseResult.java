package submission.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CaseResult {
    Integer testCaseNumber;
    Boolean passed;
    String actualOutput;
    String expectedOutput;
    Long executionTimeMs;
    String errorMessage;
}