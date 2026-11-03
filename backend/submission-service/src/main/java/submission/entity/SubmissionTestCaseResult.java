package submission.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionTestCaseResult {

    Integer testCaseNumber;

    String status;

    Boolean hidden;

    // Hidden testcase không lưu actualOutput nếu không cần thiết.
    String actualOutput;
}