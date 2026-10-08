package enrollment.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseProgressResponse {

    String id;

    String userId;

    String courseId;

    Double progress;

    Boolean completed;

    Set<String> completedLessonIds;

    LocalDateTime updatedAt;
}