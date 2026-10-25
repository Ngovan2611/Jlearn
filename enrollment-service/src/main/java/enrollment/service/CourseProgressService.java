package enrollment.service;

import enrollment.dto.request.AddSkillsRequest;
import enrollment.dto.request.ProgressUpdateRequest;
import enrollment.dto.response.CourseProgressResponse;
import enrollment.dto.response.CourseResponse;
import enrollment.dto.response.LessonResponse;
import enrollment.entity.CourseProgress;
import enrollment.entity.Enrollment;
import enrollment.exception.AppException;
import enrollment.exception.ErrorCode;
import enrollment.mapper.CourseProgressMapper;
import enrollment.repository.CourseProgressRepository;
import enrollment.repository.EnrollmentRepository;
import enrollment.repository.httpClient.CourseClient;
import enrollment.repository.httpClient.ProfileClient;
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
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CourseProgressService {

    CourseProgressRepository courseProgressRepository;
    EnrollmentRepository enrollmentRepository;
    CourseClient courseClient;
    CourseProgressMapper courseProgressMapper;
    ProfileClient profileClient;

    public CourseProgressResponse getProgress(String courseId) {
        String userId = getCurrentUserId();

        CourseProgress progress = courseProgressRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.PROGRESS_NOT_FOUND)
                );

        return courseProgressMapper.toResponse(progress);
    }

    public List<CourseProgressResponse> getMyProgress() {
        String userId = getCurrentUserId();

        return courseProgressRepository.findByUserId(userId)
                .stream()
                .map(courseProgressMapper::toResponse)
                .toList();
    }

    public CourseProgressResponse updateProgress(
            String courseId,
            ProgressUpdateRequest request
    ) {
        String userId = getCurrentUserId();

        // 1. Kiểm tra đăng ký khóa học
        Enrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.ENROLLMENT_NOT_FOUND)
                );

        // 2. Chỉ enrollment ACTIVE mới được cập nhật
        if (!"ACTIVE".equals(enrollment.getStatus())) {
            throw new AppException(ErrorCode.ENROLLMENT_NOT_ACTIVE);
        }

        // 3. Lấy danh sách bài học của khóa học
        List<LessonResponse> lessons =
                courseClient.getLessonsByCourse(courseId);

        if (lessons == null || lessons.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        // 4. Kiểm tra lesson có thuộc khóa học không
        String lessonId = request.getLessonId();

        boolean lessonExists = lessons.stream()
                .filter(Objects::nonNull)
                .anyMatch(lesson ->
                        Objects.equals(lesson.getId(), lessonId)
                );

        if (!lessonExists) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        // 5. Lấy hoặc tạo tiến độ
        CourseProgress progress = courseProgressRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseGet(() ->
                        CourseProgress.builder()
                                .userId(userId)
                                .courseId(courseId)
                                .progress(0.0)
                                .completed(false)
                                .completedLessonIds(new HashSet<>())
                                .updatedAt(LocalDateTime.now())
                                .build()
                );

        // Lưu trạng thái cũ trước khi thay đổi
        boolean wasCompleted =
                Boolean.TRUE.equals(progress.getCompleted());

        // 6. Đảm bảo danh sách lesson không null
        Set<String> completedLessonIds =
                progress.getCompletedLessonIds();

        if (completedLessonIds == null) {
            completedLessonIds = new HashSet<>();
            progress.setCompletedLessonIds(completedLessonIds);
        }

        // 7. Đánh dấu lesson đã hoàn thành
        completedLessonIds.add(lessonId);

        // 8. Tính tiến độ dựa trên số lesson hợp lệ
        int totalLessons = lessons.size();

        int completedLessons = (int) lessons.stream()
                .filter(Objects::nonNull)
                .map(LessonResponse::getId)
                .filter(completedLessonIds::contains)
                .distinct()
                .count();

        double percentage = Math.round(
                ((double) completedLessons / totalLessons) * 10000.0
        ) / 100.0;

        boolean completed = completedLessons >= totalLessons;

        progress.setProgress(percentage);
        progress.setCompleted(completed);
        progress.setUpdatedAt(LocalDateTime.now());

        // 9. Lưu tiến độ
        progress = courseProgressRepository.save(progress);

        // 10. Khi hoàn thành khóa học, cập nhật enrollment
        if (completed) {
            enrollment.setStatus("COMPLETED");
            enrollmentRepository.save(enrollment);

            // Chỉ đồng bộ kỹ năng khi chuyển từ chưa hoàn thành
            // sang hoàn thành.
            if (!wasCompleted) {
                syncCourseSkillsToProfile(userId, courseId);
            }
        }

        return courseProgressMapper.toResponse(progress);
    }


    private void syncCourseSkillsToProfile(
            String userId,
            String courseId
    ) {
        CourseResponse course = courseClient.getCourse(courseId);

        if (course == null
                || course.getSkills() == null
                || course.getSkills().isEmpty()) {
            return;
        }

        List<String> skills = course.getSkills().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(skill -> !skill.isBlank())
                .distinct()
                .toList();

        if (skills.isEmpty()) {
            return;
        }

        AddSkillsRequest request = AddSkillsRequest.builder()
                .skills(skills)
                .build();

        profileClient.addSkills(userId, request);
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException(
                    "Không thể xác định người dùng từ JWT"
            );
        }

        String userId = jwt.getClaimAsString("accountId");

        if (userId == null || userId.isBlank()) {
            throw new IllegalStateException(
                    "JWT không chứa claim accountId"
            );
        }

        return userId;
    }
}
