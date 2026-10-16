package submission.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import submission.entity.Submission;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends MongoRepository<Submission, String> {

    Optional<Submission> findByUserIdAndExerciseId(String userId, String exerciseId);

    List<Submission> findByUserIdOrderBySubmittedAtDesc(String userId);

    List<Submission> findByUserIdAndExerciseIdOrderBySubmittedAtDesc(String userId, String exerciseId);
}