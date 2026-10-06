package course.repository;

import course.entity.Lesson;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends MongoRepository<Lesson, String> {

    List<Lesson> findByCourseId(String courseId);

    Lesson findByTitle(String title);

    List<Lesson> findByCourseIdAndPublishedTrue(String courseId);

}
