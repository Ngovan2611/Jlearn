package exercise.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExerciseResponse {

    String id;

    String courseId;

    String lessonId;

    String title;

    String description;

    String difficulty;

    String language;

    Integer timeLimit;

    Integer memoryLimit;

    boolean published;

    List<TestCaseResponse> testCases;
}