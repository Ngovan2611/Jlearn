package exercise.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "exercises")
public class Exercise {

    @Id
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

    List<TestCase> testCases;
}