package execution.model;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CodeExecutionResult {

    String status;

    String stdout;

    String stderr;

    long executionTime;

    Integer exitCode;
}