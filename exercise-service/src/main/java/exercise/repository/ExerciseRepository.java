package exercise.repository;

import exercise.entity.Exercise;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExerciseRepository
        extends MongoRepository<Exercise, String> {

    List<Exercise> findByCourseId(String courseId);

    List<Exercise> findByLessonId(String lessonId);

    List<Exercise> findByPublishedTrue();

    List<Exercise> findByLessonIdAndPublishedTrue(String lessonId);
}