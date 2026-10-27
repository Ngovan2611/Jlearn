package execution.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RunExerciseRequest {

    @NotBlank
    String exerciseId;

    @NotBlank
    String language;

    @NotBlank
    @Size(max = 100_000)
    String sourceCode;
}