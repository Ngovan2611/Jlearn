package submission.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import submission.enums.SubmissionStatus;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "submissions")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Submission {

    @Id
    String id;

    @Indexed
    String userId;

    @Indexed
    String exerciseId;

    String sourceCode;

    @Builder.Default
    String language = "JAVA";

    SubmissionStatus status;

    Double score;

    Integer passedTestCases;

    Integer totalTestCases;

    Long executionTimeMs;

    Long memoryUsedKb;

    String compileOutput;

    String errorMessage;

    @Builder.Default
    List<CaseResult> testCaseResults = new ArrayList<>();

    Instant submittedAt;

    Instant completedAt;


}
