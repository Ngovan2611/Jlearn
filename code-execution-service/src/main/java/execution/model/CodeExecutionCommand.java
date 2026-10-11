package execution.model;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CodeExecutionCommand {

    String sourceCode;

    String language;

    String stdin;

    Integer timeoutMs;
}