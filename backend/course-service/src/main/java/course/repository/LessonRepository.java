package course.repository;

import course.entity.Lesson;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends MongoRepository<Lesson, String> {

    List<Lesson> findByCourseId(String courseId);

    Lesson findByTitle(String title);

    List<Lesson> findByCourseIdAndPublishedTrue(String courseId);
    @Query("{ '$or': [ " +
            "  { 'title': { '$regex': ?0, '$options': 'i' } }, " +
            "  { 'description': { '$regex': ?0, '$options': 'i' } } " +
            "] }")
    Page<Lesson> searchLessons(String keyword, Pageable pageable);
}
