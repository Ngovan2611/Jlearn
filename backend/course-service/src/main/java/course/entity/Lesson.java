package course.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "lessons")
public class Lesson {

    @Id
    String id;

    String courseId;

    String title;

    String description;

    String content;

    String videoUrl;

    Integer lessonOrder;

    boolean published;

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}