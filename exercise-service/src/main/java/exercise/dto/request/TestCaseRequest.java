package exercise.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TestCaseRequest {

    String id;

    @NotBlank(message = "Input is required")
    String input;

    @NotBlank(message = "Expected output is required")
    String expectedOutput;

    boolean hidden;

    @NotNull(message = "Points is required")
    Integer points;
}