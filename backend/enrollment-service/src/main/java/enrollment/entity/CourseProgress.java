package enrollment.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "course_progress")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseProgress {

    @Id
    String id;

    String userId;

    String courseId;

    Double progress;

    Boolean completed;

    Set<String> completedLessonIds = new HashSet<>();

    LocalDateTime updatedAt;
}