package enrollment.repository;

import enrollment.entity.Enrollment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository
        extends MongoRepository<Enrollment, String> {

    Optional<Enrollment> findByUserIdAndCourseId(
            String userId,
            String courseId
    );

    List<Enrollment> findByUserId(String userId);

    List<Enrollment> findByCourseId(String courseId);

    boolean existsByUserIdAndCourseId(
            String userId,
            String courseId
    );

    // Đếm enrollment của một khóa học, bỏ qua trạng thái CANCELLED.
    @Query(value = "{ 'courseId': ?0, 'status': { '$ne': 'CANCELLED' } }",
            count = true)
    long countActiveEnrollmentsByCourseId(String courseId);

    // Lấy tất cả enrollment hợp lệ để tổng hợp thống kê.
    @Query(value = "{ 'status': { '$ne': 'CANCELLED' } }")
    List<Enrollment> findAllActiveEnrollments();
}