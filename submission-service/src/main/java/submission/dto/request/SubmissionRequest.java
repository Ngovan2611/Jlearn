package submission.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionRequest {

    @NotBlank(message = "EXERCISE_ID_REQUIRED")
    String exerciseId;

    @NotBlank(message = "SOURCE_CODE_REQUIRED")
    @Size(max = 100000, message = "SOURCE_CODE_TOO_LARGE")
    String sourceCode;

    @NotBlank(message = "LANGUAGE_REQUIRED")
    String language;
}