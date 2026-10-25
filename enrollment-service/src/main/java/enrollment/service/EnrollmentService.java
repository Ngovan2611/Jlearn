package enrollment.service;

import enrollment.dto.response.*;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    public EnrollmentStatisticsResponse getStatistics() {
        List<Enrollment> enrollments = enrollmentRepository.findAll();

        long total = enrollments.size();

        long completed = enrollments.stream()
                .filter(enrollment ->
                        "COMPLETED".equalsIgnoreCase(
                                enrollment.getStatus()
                        ))
                .count();

        double completionRate = total == 0
                ? 0.0
                : Math.round((double) completed / total * 10000.0)
                / 100.0;

        return EnrollmentStatisticsResponse.builder()
                .totalEnrollments(total)
                .completedEnrollments(completed)
                .completionRate(completionRate)
                .build();
    }

    public CourseEnrollmentOverviewResponse getCourseEnrollmentStatistics() {

        // Lấy tất cả khóa học, bao gồm khóa học chưa có người đăng ký.
        List<CourseResponse> allCourses = courseClient.getAllCourses();

        // Lấy các lượt đăng ký, sau đó loại bỏ những lượt đã hủy.
        List<Enrollment> enrollments =
                enrollmentRepository.findAllActiveEnrollments();

        Map<String, Long> enrollmentCounts = new LinkedHashMap<>();
        Map<String, Long> completedCounts = new LinkedHashMap<>();

        for (Enrollment enrollment : enrollments) {
            String courseId = enrollment.getCourseId();

            if (courseId == null || courseId.isBlank()) {
                continue;
            }

            // Tổng lượt đăng ký hợp lệ.
            enrollmentCounts.merge(courseId, 1L, Long::sum);

            // Đếm lượt đăng ký đã hoàn thành.
            if ("COMPLETED".equalsIgnoreCase(
                    String.valueOf(enrollment.getStatus()))) {
                completedCounts.merge(courseId, 1L, Long::sum);
            }
        }

        // Tổng lượt đăng ký hợp lệ trên toàn hệ thống.
        long totalEnrollments = enrollmentCounts.values()
                .stream()
                .mapToLong(Long::longValue)
                .sum();

        List<CourseEnrollmentStatisticsResponse> courses = allCourses
                .stream()
                .filter(course -> course.getId() != null)
                .map(course -> {
                    String courseId = course.getId();

                    // Khóa học chưa có lượt đăng ký sẽ nhận giá trị 0.
                    long enrollmentCount =
                            enrollmentCounts.getOrDefault(courseId, 0L);

                    long completedCount =
                            completedCounts.getOrDefault(courseId, 0L);

                    // Tỷ trọng lượt đăng ký của khóa học.
                    double enrollmentShare = totalEnrollments == 0
                            ? 0.0
                            : Math.round(
                            enrollmentCount * 10000.0
                                    / totalEnrollments
                    ) / 100.0;

                    // Tỷ lệ hoàn thành của khóa học.
                    double completionRate = enrollmentCount == 0
                            ? 0.0
                            : Math.round(
                            completedCount * 10000.0
                                    / enrollmentCount
                    ) / 100.0;

                    return CourseEnrollmentStatisticsResponse.builder()
                            .courseId(courseId)
                            .courseTitle(course.getTitle())
                            .enrollmentCount(enrollmentCount)
                            .totalEnrollments(totalEnrollments)
                            .enrollmentShare(enrollmentShare)
                            .completedCount(completedCount)
                            .completionRate(completionRate)
                            .build();
                })
                .sorted(
                        Comparator.comparingLong(
                                        CourseEnrollmentStatisticsResponse
                                                ::getEnrollmentCount
                                ).reversed()
                                .thenComparing(
                                        CourseEnrollmentStatisticsResponse
                                                ::getCourseTitle,
                                        Comparator.nullsLast(
                                                String.CASE_INSENSITIVE_ORDER
                                        )
                                )
                )
                .toList();

        long coursesWithEnrollments = courses.stream()
                .filter(course -> course.getEnrollmentCount() > 0)
                .count();

        return CourseEnrollmentOverviewResponse.builder()
                .totalEnrollments(totalEnrollments)
                .totalCoursesWithEnrollments(coursesWithEnrollments)
                .courses(courses)
                .build();
    }

}