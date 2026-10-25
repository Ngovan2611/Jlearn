package submission.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import submission.dto.request.SubmissionRequest;
import submission.dto.response.SubmissionResponse;
import submission.entity.Submission;
import submission.enums.GradingStatus;
import submission.exception.AppException;
import submission.exception.ErrorCode;
import submission.mapper.SubmissionMapper;
import submission.repository.SubmissionRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionService {

    SubmissionRepository submissionRepository;
    SubmissionMapper submissionMapper;
    // AiGradingService aiGradingService;

    private String getCurrentUserId() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        Jwt jwt = jwtAuth.getToken();

        // Lấy ID tài khoản từ claim accountId, fallback về sub nếu trống
        String userId = jwt.getClaimAsString("accountId");

        if (userId == null || userId.isBlank()) {
            userId = jwt.getSubject();
        }

        if (userId == null || userId.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return userId;
    }

    /**
     * Nộp bài tập (Ghi đè bài cũ nếu đã từng nộp).
     * Tạm thời gán điểm trực tiếp = 9.
     */
    public SubmissionResponse submit(SubmissionRequest request) {
        String userId = getCurrentUserId();

        Optional<Submission> existingSubmission = submissionRepository
                .findByUserIdAndExerciseId(userId, request.getExerciseId());

        Submission submission;
        Instant now = Instant.now();

        if (existingSubmission.isPresent()) {
            submission = existingSubmission.get();
            submissionMapper.updateEntityFromRequest(request, submission);

            submission.setGradingStatus(GradingStatus.COMPLETED);
            submission.setScore(9.0);
            submission.setFeedback("Bài làm tốt! (Điểm giả lập tạm thời)");
            submission.setSubmittedAt(now);
            submission.setGradedAt(now);
        } else {
            // TẠO MỚI: Map toàn bộ request sang entity mới
            submission = submissionMapper.toEntity(request);

            submission.setUserId(userId);
            submission.setGradingStatus(GradingStatus.COMPLETED);
            submission.setScore(9.0);
            submission.setFeedback("Bài làm tốt! (Điểm giả lập tạm thời)");
            submission.setSubmittedAt(now);
            submission.setGradedAt(now);
        }

        Submission saved = submissionRepository.save(submission);

        return submissionMapper.toResponse(saved);
    }

    /**
     * Lấy bài nộp mới nhất / hiện tại của user cho 1 bài tập cụ thể.
     */
    public SubmissionResponse getMySubmissionByExercise(String exerciseId) {
        String userId = getCurrentUserId();

        Submission submission = submissionRepository
                .findByUserIdAndExerciseId(userId, exerciseId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        return submissionMapper.toResponse(submission);
    }

    /**
     * Xem chi tiết bài nộp theo ID.
     */
    public SubmissionResponse getSubmission(String submissionId) {
        String userId = getCurrentUserId();

        Submission submission = submissionRepository
                .findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        checkOwner(submission, userId);

        return submissionMapper.toResponse(submission);
    }

    /**
     * Lấy danh sách bài nộp của người dùng hiện tại.
     */
    public List<SubmissionResponse> getMySubmissions() {
        String userId = getCurrentUserId();

        List<Submission> submissions = submissionRepository
                .findByUserIdOrderBySubmittedAtDesc(userId);

        return submissionMapper.toResponseList(submissions);
    }

    /**
     * Lấy danh sách bài nộp của người dùng hiện tại theo bài tập.
     */
    public List<SubmissionResponse> getMyExerciseSubmissions(String exerciseId) {
        String userId = getCurrentUserId();

        List<Submission> submissions = submissionRepository
                .findByUserIdAndExerciseIdOrderBySubmittedAtDesc(userId, exerciseId);

        return submissionMapper.toResponseList(submissions);
    }


    private void checkOwner(Submission submission, String userId) {
        if (!userId.equals(submission.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

}