package submission.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import submission.enums.GradingStatus;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "submissions")
@CompoundIndex(
        name = "user_exercise_idx",
        def = "{'userId': 1, 'exerciseId': 1}",
        unique = true
)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Submission {

    @Id
    String id;

    String userId;

    String exerciseId;

    String sourceCode;

    String language;

    // ID kết quả Run đã được Execution Service xác minh.
    String executionId;

    // Kết quả thực thi
    Boolean allPassed;

    Integer totalTestCases;

    Integer passedTestCases;

    Long executionTimeMs;

    List<SubmissionTestCaseResult> testCaseResults;

    // Trạng thái chấm điểm AI
    @Builder.Default
    GradingStatus gradingStatus = GradingStatus.PENDING;

    // Điểm AI trả về, tối đa 100.
    Double score;

    // Nhận xét tổng quan từ AI.
    String feedback;

    // Thời điểm nộp bài đầu tiên.
    Instant submittedAt;

    // Thời điểm nộp bài gần nhất.
    Instant lastSubmittedAt;

    // Thời điểm AI hoàn thành chấm bài gần nhất.
    Instant gradedAt;
}