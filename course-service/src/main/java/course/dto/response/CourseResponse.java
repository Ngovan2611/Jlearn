package course.dto.response;

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
public class CourseResponse {

    String id;

    String categoryId;

    String title;

    String description;

    String thumbnail;

    String level;

    String instructorId;

    Double price;

    boolean published;

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}