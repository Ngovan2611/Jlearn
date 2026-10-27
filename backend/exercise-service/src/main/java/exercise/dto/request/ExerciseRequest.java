package exercise.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExerciseRequest {

    String courseId;

    String lessonId;

    @NotBlank(message = "Title is required")
    String title;

    String description;

    @NotBlank(message = "Difficulty is required")
    String difficulty;

    @Builder.Default
    String language = "JAVA";

    Integer timeLimit;

    Integer memoryLimit;

    boolean published;

    @Valid
    List<TestCaseRequest> testCases;
}