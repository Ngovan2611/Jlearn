package enrollment.service;

import enrollment.dto.request.ProgressUpdateRequest;
import enrollment.dto.response.CourseProgressResponse;
import enrollment.dto.response.LessonResponse;
import enrollment.entity.CourseProgress;
import enrollment.entity.Enrollment;
import enrollment.exception.AppException;
import enrollment.exception.ErrorCode;
import enrollment.mapper.CourseProgressMapper;
import enrollment.repository.CourseProgressRepository;
import enrollment.repository.EnrollmentRepository;
import enrollment.repository.httpClient.CourseClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CourseProgressService {

    CourseProgressRepository courseProgressRepository;
    EnrollmentRepository enrollmentRepository;
    CourseClient courseClient;
    CourseProgressMapper courseProgressMapper;

    public CourseProgressResponse getProgress(
            String courseId
    ) {

        String userId = getCurrentUserId();

        CourseProgress progress =
                courseProgressRepository
                        .findByUserIdAndCourseId(
                                userId,
                                courseId
                        )
                        .orElseThrow(() ->
                                new AppException(
                                        ErrorCode.PROGRESS_NOT_FOUND
                                )
                        );

        return courseProgressMapper.toResponse(progress);
    }

    public List<CourseProgressResponse> getMyProgress() {

        String userId = getCurrentUserId();

        return courseProgressRepository
                .findByUserId(userId)
                .stream()
                .map(courseProgressMapper::toResponse)
                .toList();
    }

    public CourseProgressResponse updateProgress(
            String courseId,
            ProgressUpdateRequest request
    ) {

        String userId = getCurrentUserId();

        // 1. Kiểm tra user đã đăng ký khóa học
        Enrollment enrollment =
                enrollmentRepository
                        .findByUserIdAndCourseId(
                                userId,
                                courseId
                        )
                        .orElseThrow(() ->
                                new AppException(
                                        ErrorCode.ENROLLMENT_NOT_FOUND
                                )
                        );

        // 2. Chỉ enrollment ACTIVE mới được cập nhật
        if (!"ACTIVE".equals(enrollment.getStatus())) {
            throw new AppException(
                    ErrorCode.ENROLLMENT_NOT_ACTIVE
            );
        }

        // 3. Lấy danh sách lesson của khóa học
        List<LessonResponse> lessons =
                courseClient.getLessonsByCourse(courseId);

        if (lessons == null || lessons.isEmpty()) {
            throw new AppException(
                    ErrorCode.COURSE_NOT_FOUND
            );
        }

        // 4. Kiểm tra lesson có thuộc course không
        boolean lessonExists =
                lessons.stream()
                        .anyMatch(lesson ->
                                lesson.getId()
                                        .equals(request.getLessonId())
                        );

        if (!lessonExists) {
            throw new AppException(
                    ErrorCode.COURSE_NOT_FOUND
            );
        }

        // 5. Lấy hoặc tạo CourseProgress
        CourseProgress progress =
                courseProgressRepository
                        .findByUserIdAndCourseId(
                                userId,
                                courseId
                        )
                        .orElseGet(() ->
                                CourseProgress.builder()
                                        .userId(userId)
                                        .courseId(courseId)
                                        .progress(0.0)
                                        .completed(false)
                                        .completedLessonIds(
                                                new HashSet<>()
                                        )
                                        .build()
                        );

        // 6. Đảm bảo Set không null
        if (progress.getCompletedLessonIds() == null) {
            progress.setCompletedLessonIds(
                    new HashSet<>()
            );
        }

        // 7. Đánh dấu lesson hoàn thành
        progress.getCompletedLessonIds()
                .add(request.getLessonId());

        // 8. Tính progress
        int totalLessons = lessons.size();

        int completedLessons =
                progress.getCompletedLessonIds().size();

        double percentage =
                ((double) completedLessons / totalLessons) * 100;

        percentage =
                Math.round(percentage * 100.0) / 100.0;

        progress.setProgress(percentage);

        // 9. Kiểm tra hoàn thành khóa học
        boolean completed =
                completedLessons >= totalLessons;

        progress.setCompleted(completed);

        progress.setUpdatedAt(
                LocalDateTime.now()
        );

        // 10. Lưu
        progress =
                courseProgressRepository.save(progress);

        // 11. Hoàn thành toàn bộ khóa học
        if (completed) {

            enrollment.setStatus("COMPLETED");

            enrollmentRepository.save(enrollment);
        }

        return courseProgressMapper.toResponse(progress);
    }

    private String getCurrentUserId() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        Jwt jwt =
                (Jwt) authentication.getPrincipal();

        return jwt.getClaimAsString("accountId");
    }
}