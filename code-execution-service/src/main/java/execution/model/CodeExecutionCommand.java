package execution.model;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeExecutionCommand {

    private String sourceCode;

    private String language;

    private String stdin;

    private Integer timeoutMs;
}