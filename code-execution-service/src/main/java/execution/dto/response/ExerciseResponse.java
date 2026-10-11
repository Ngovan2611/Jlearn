package execution.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("id")
    String exerciseId;

    String title;

    String language;

    Integer timeLimit;

    Integer memoryLimit;

    List<TestCaseData> testCases;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class TestCaseData {

        @JsonProperty("id")
        String testCaseId;

        String input;

        String expectedOutput;

        boolean hidden;
    }
}