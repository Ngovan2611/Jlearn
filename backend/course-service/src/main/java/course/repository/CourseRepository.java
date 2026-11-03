package course.repository;

import course.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface CourseRepository extends MongoRepository<Course,String> {

    Course findByTitle(String name);

    List<Course> findByCategoryId(String categoryId);

    List<Course> findByPublishedTrue();

    @Query("{ '$or': [ " +
            "  { 'title': { '$regex': ?0, '$options': 'i' } }, " +
            "  { 'categoryId': { '$regex': ?0, '$options': 'i' } } " +
            "] }")
    Page<Course> searchCourses(String keyword, Pageable pageable);
}
