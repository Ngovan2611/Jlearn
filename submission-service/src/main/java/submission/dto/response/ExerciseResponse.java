package submission.dto.response;

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
    boolean published;
    Integer timeLimit;
    Integer memoryLimit;
    List<TestCase> testCases;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class TestCase {
        String input;
        String expectedOutput;
        Double points;
        boolean hidden;
    }
}