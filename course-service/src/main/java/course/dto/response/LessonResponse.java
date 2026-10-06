package course.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class LessonResponse {
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
