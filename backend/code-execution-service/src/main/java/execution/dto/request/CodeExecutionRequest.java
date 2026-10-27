package execution.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeExecutionRequest {

    @NotBlank
    private String sourceCode;

    @Builder.Default
    private String language = "JAVA";

    private String stdin;

    @Min(1000)
    @Max(30000)
    @Builder.Default
    private Integer timeoutMs = 10000;
}