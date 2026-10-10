package exercise.repository;

import exercise.entity.Exercise;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExerciseRepository
        extends MongoRepository<Exercise, String> {

    List<Exercise> findByLessonIdAndPublishedTrue(
            String lessonId
    );

    List<Exercise> findByCourseId(
            String courseId
    );

    List<Exercise> findByLessonIdIsNull();
}