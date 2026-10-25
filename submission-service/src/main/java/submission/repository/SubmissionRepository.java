
package submission.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import submission.entity.Submission;
import submission.enums.GradingStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository
        extends MongoRepository<Submission, String> {

    Optional<Submission> findByUserIdAndExerciseId(
            String userId,
            String exerciseId
    );

    List<Submission> findByUserIdOrderBySubmittedAtDesc(
            String userId
    );

    List<Submission> findByUserIdAndExerciseIdOrderBySubmittedAtDesc(
            String userId,
            String exerciseId
    );

    long countByGradingStatus(GradingStatus gradingStatus);

    long countBySubmittedAtGreaterThanEqualAndSubmittedAtLessThan(
            Instant start,
            Instant end
    );

    long countByGradingStatusAndScoreIsNotNull(
            GradingStatus gradingStatus
    );

    @Query("{ 'submittedAt': { '$gte': ?0, '$lt': ?1 } }")
    List<Submission> findBySubmittedAtInRange(
            Instant start,
            Instant end
    );
}
