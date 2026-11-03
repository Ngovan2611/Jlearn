package course.repository;

import course.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CategoryRepository extends MongoRepository<Category,String> {

    Category findByName(String categoryName);
}
