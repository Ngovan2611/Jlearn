package exercise.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TestCase {

    String id;

    String input;

    String expectedOutput;

    boolean hidden;

    Integer points;
}