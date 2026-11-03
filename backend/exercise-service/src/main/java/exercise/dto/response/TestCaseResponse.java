package exercise.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TestCaseResponse {

    String id;

    String input;

    String expectedOutput;

    boolean hidden;

    Integer points;
}