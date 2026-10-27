package execution.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeExecutionResponse {

    private String status;

    private String stdout;

    private String stderr;

    private long executionTime;

    private Integer exitCode;
}