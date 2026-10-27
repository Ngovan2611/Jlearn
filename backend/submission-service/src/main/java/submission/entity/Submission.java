package submission.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import submission.enums.GradingStatus;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "submissions")
@CompoundIndex(name = "user_exercise_idx", def = "{'userId': 1, 'exerciseId': 1}", unique = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Submission {

    @Id
    String id;

    String userId;

    String exerciseId;

    String sourceCode;

    String language;

    @Builder.Default
    GradingStatus gradingStatus = GradingStatus.PENDING;

    // Điểm do AI Tutor trả về, tối đa 100.
    Double score;

    // Nhận xét tổng quan từ AI.
    String feedback;

    // Thời điểm nộp bài đầu tiên.
    Instant submittedAt;

    // Thời điểm AI hoàn thành chấm bài mới nhất.
    Instant gradedAt;
}