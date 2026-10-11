package enrollment.service;

import enrollment.dto.response.CourseResponse;
import enrollment.dto.response.EnrollmentResponse;
import enrollment.entity.CourseProgress;
import enrollment.entity.Enrollment;
import enrollment.exception.AppException;
import enrollment.exception.ErrorCode;
import enrollment.mapper.EnrollmentMapper;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EnrollmentService {

    EnrollmentRepository enrollmentRepository;
    CourseProgressRepository courseProgressRepository;
    CourseClient courseClient;
    EnrollmentMapper enrollmentMapper;

    public EnrollmentResponse enroll(String courseId) {

        String userId = getCurrentUserId();

        // Kiểm tra khóa học
        CourseResponse course =
                courseClient.getCourse(courseId);

        if (course == null) {
            throw new AppException(
                    ErrorCode.COURSE_NOT_FOUND
            );
        }

        // Kiểm tra đã đăng ký
        if (enrollmentRepository
                .existsByUserIdAndCourseId(
                        userId,
                        courseId
                )) {

            throw new AppException(
                    ErrorCode.ALREADY_ENROLLED
            );
        }

        // Tạo enrollment
        Enrollment enrollment =
                Enrollment.builder()
                        .userId(userId)
                        .courseId(courseId)
                        .enrolledAt(LocalDateTime.now())
                        .status("ACTIVE")
                        .build();

        enrollment =
                enrollmentRepository.save(enrollment);

        // Tạo progress ban đầu
        CourseProgress progress =
                CourseProgress.builder()
                        .userId(userId)
                        .courseId(courseId)
                        .progress(0.0)
                        .completed(false)
                        .completedLessonIds(new java.util.HashSet<>())
                        .updatedAt(LocalDateTime.now())
                        .build();

        courseProgressRepository.save(progress);

        return enrollmentMapper.toResponse(
                enrollment,
                course.getTitle()
        );
    }

    public EnrollmentResponse getEnrollment(
            String enrollmentId
    ) {

        String userId = getCurrentUserId();

        Enrollment enrollment =
                enrollmentRepository
                        .findById(enrollmentId)
                        .orElseThrow(() ->
                                new AppException(
                                        ErrorCode.ENROLLMENT_NOT_FOUND
                                )
                        );

        // User chỉ được xem enrollment của chính mình
        if (!enrollment.getUserId().equals(userId)) {
            throw new AppException(
                    ErrorCode.ENROLLMENT_NOT_FOUND
            );
        }

        String courseTitle =
                getCourseTitle(
                        enrollment.getCourseId()
                );

        return enrollmentMapper.toResponse(
                enrollment,
                courseTitle
        );
    }

    public List<EnrollmentResponse> getMyEnrollments() {

        String userId = getCurrentUserId();

        return enrollmentRepository
                .findByUserId(userId)
                .stream()
                .map(enrollment ->
                        enrollmentMapper.toResponse(
                                enrollment,
                                getCourseTitle(
                                        enrollment.getCourseId()
                                )
                        )
                )
                .toList();
    }

    public List<EnrollmentResponse> getEnrollmentsByCourse(
            String courseId
    ) {

        return enrollmentRepository
                .findByCourseId(courseId)
                .stream()
                .map(enrollment ->
                        enrollmentMapper.toResponse(
                                enrollment,
                                getCourseTitle(courseId)
                        )
                )
                .toList();
    }

    public void cancelEnrollment(
            String enrollmentId
    ) {

        String userId = getCurrentUserId();

        Enrollment enrollment =
                enrollmentRepository
                        .findById(enrollmentId)
                        .orElseThrow(() ->
                                new AppException(
                                        ErrorCode.ENROLLMENT_NOT_FOUND
                                )
                        );

        if (!enrollment.getUserId().equals(userId)) {
            throw new AppException(
                    ErrorCode.ENROLLMENT_NOT_FOUND
            );
        }

        enrollment.setStatus("CANCELLED");

        enrollmentRepository.save(enrollment);
    }

    private String getCourseTitle(
            String courseId
    ) {

        CourseResponse course =
                courseClient.getCourse(courseId);

        if (course == null) {
            return null;
        }

        return course.getTitle();
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