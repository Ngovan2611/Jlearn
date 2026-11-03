package execution.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CachedExecution {

    String executionId;

    String exerciseId;

    String userId;

    String sourceCodeHash;

    String testcaseFingerprint;

    RunExerciseResponse result;

    Instant executedAt;
}