package enrollment.repository;

import enrollment.entity.CourseProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseProgressRepository
        extends MongoRepository<CourseProgress, String> {

    Optional<CourseProgress> findByUserIdAndCourseId(
            String userId,
            String courseId
    );

    List<CourseProgress> findByUserId(String userId);

    List<CourseProgress> findByCourseId(String courseId);
}