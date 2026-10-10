package execution.model;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeExecutionResult {

    private String status;

    private String stdout;

    private String stderr;

    private long executionTime;

    private Integer exitCode;
}