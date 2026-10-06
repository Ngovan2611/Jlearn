package course.repository;

import course.entity.Course;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CourseRepository extends MongoRepository<Course,String> {

    Course findByTitle(String name);

    List<Course> findByCategoryId(String categoryId);



}
