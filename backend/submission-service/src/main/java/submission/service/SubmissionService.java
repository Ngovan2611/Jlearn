package submission.service;

import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import submission.dto.request.SubmissionRequest;
import submission.dto.request.ExecutionVerificationRequest;
import submission.dto.response.ApiResponse;
import submission.dto.response.SubmissionResponse;
import submission.dto.response.RunExerciseResponse;
import submission.entity.Submission;
import submission.entity.SubmissionTestCaseResult;
import submission.enums.GradingStatus;
import submission.exception.AppException;
import submission.exception.ErrorCode;
import submission.mapper.SubmissionMapper;
import submission.repository.SubmissionRepository;
import submission.repository.httpClient.ExecutionClient;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionService {

    ExecutionClient executionClient;
    SubmissionRepository submissionRepository;
    SubmissionMapper submissionMapper;
    AiGradingService aiGradingService;

    private String getCurrentUserId() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        Jwt jwt = jwtAuth.getToken();

        String userId = jwt.getClaimAsString("accountId");

        if (!StringUtils.hasText(userId)) {
            userId = jwt.getSubject();
        }

        if (!StringUtils.hasText(userId)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return userId;
    }

    /**
     * Nộp bài:
     * 1. Xác minh kết quả Run đã thực hiện.
     * 2. Lưu kết quả thực thi.
     * 3. Đưa bài nộp vào hàng đợi chấm AI.
     */
    @Transactional
    public SubmissionResponse submit(SubmissionRequest request) {

        String userId = getCurrentUserId();

        // Kiểm tra dữ liệu đầu vào
        if (!StringUtils.hasText(request.getExecutionId())) {
            throw new AppException(ErrorCode.EXECUTION_NOT_FOUND);
        }

        // Bước 1: Xác minh kết quả Run từ Execution Service
        ExecutionVerificationRequest verificationRequest =
                ExecutionVerificationRequest.builder()
                        .executionId(request.getExecutionId())
                        .exerciseId(request.getExerciseId())
                        .sourceCode(request.getSourceCode())
                        .build();

        ApiResponse<RunExerciseResponse> verificationResponse;

        try {
            verificationResponse = executionClient.verifyExecution(verificationRequest);
        } catch (FeignException e) {
            log.error("Error occurred while verifying execution: status={}, message={}", e.status(), e.getMessage());
            if (e.status() == 404) {
                throw new AppException(ErrorCode.EXECUTION_NOT_FOUND);
            }
            throw new AppException(ErrorCode.EXECUTION_VERIFICATION_FAILED);
        }

        if (verificationResponse == null || verificationResponse.getResult() == null) {
            throw new AppException(ErrorCode.EXECUTION_NOT_FOUND);
        }

        RunExerciseResponse runResult = verificationResponse.getResult();

        // Bước 2: Kiểm tra kết quả trả về
        if (runResult.getTestCaseResults() == null) {
            throw new AppException(ErrorCode.EXECUTION_VERIFICATION_FAILED);
        }

        Instant now = Instant.now();

        // Bước 3: Tìm submission hiện tại của user
        Optional<Submission> existingSubmission =
                submissionRepository.findByUserIdAndExerciseId(
                        userId,
                        request.getExerciseId()
                );

        Submission submission;

        if (existingSubmission.isPresent()) {

            // Cập nhật bài nộp cũ
            submission = existingSubmission.get();

            submissionMapper.updateEntityFromRequest(request, submission);

            submission.setExecutionId(request.getExecutionId());

            // Giữ nguyên thời điểm nộp đầu tiên
            if (submission.getSubmittedAt() == null) {
                submission.setSubmittedAt(now);
            }

        } else {

            // Tạo bài nộp mới
            submission = submissionMapper.toEntity(request);

            submission.setUserId(userId);
            submission.setSubmittedAt(now);
        }

        // Bước 4: Lưu kết quả thực thi
        submission.setAllPassed(runResult.isAllPassed());
        submission.setTotalTestCases(runResult.getTotalTestCases());
        submission.setPassedTestCases(runResult.getPassedTestCases());
        submission.setExecutionTimeMs(runResult.getExecutionTimeMs());

        List<SubmissionTestCaseResult> testCaseResults =
                runResult.getTestCaseResults()
                        .stream()
                        .map(testCase -> SubmissionTestCaseResult.builder()
                                .testCaseNumber(testCase.getTestCaseNumber())
                                .status(testCase.getStatus())
                                .hidden(testCase.isHidden())
                                .actualOutput(
                                        testCase.isHidden()
                                                ? null
                                                : testCase.getActualOutput()
                                )
                                .build())
                        .toList();

        submission.setTestCaseResults(testCaseResults);

        // Bước 5: Reset kết quả AI cũ vì source code đã thay đổi
        submission.setGradingStatus(GradingStatus.PENDING);
        submission.setScore(null);
        submission.setFeedback(null);
        submission.setGradedAt(null);

        submission.setLastSubmittedAt(now);

        // Bước 6: Lưu MongoDB
        Submission saved = submissionRepository.save(submission);

        // Bước 7: Kích hoạt chấm điểm tự động qua AI Tutor
        try {
            aiGradingService.gradeSubmission(saved.getId());
        } catch (Exception e) {
            log.warn("Could not dispatch async grading for submission {}: {}", saved.getId(), e.getMessage());
        }

        return submissionMapper.toResponse(saved);
    }

    /**
     * Lấy bài nộp hiện tại của user cho một bài tập.
     */
    public SubmissionResponse getMySubmissionByExercise(String exerciseId) {

        String userId = getCurrentUserId();

        Submission submission = submissionRepository
                .findByUserIdAndExerciseId(userId, exerciseId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        return submissionMapper.toResponse(submission);
    }


    public SubmissionResponse getSubmission(String submissionId) {

        String userId = getCurrentUserId();

        Submission submission = submissionRepository
                .findById(submissionId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        checkOwner(submission, userId);

        return submissionMapper.toResponse(submission);
    }


    public List<SubmissionResponse> getMySubmissions() {

        String userId = getCurrentUserId();

        List<Submission> submissions =
                submissionRepository.findByUserIdOrderBySubmittedAtDesc(userId);

        return submissionMapper.toResponseList(submissions);
    }


    public List<SubmissionResponse> getMyExerciseSubmissions(String exerciseId) {

        String userId = getCurrentUserId();

        List<Submission> submissions =
                submissionRepository
                        .findByUserIdAndExerciseIdOrderBySubmittedAtDesc(
                                userId,
                                exerciseId
                        );

        return submissionMapper.toResponseList(submissions);
    }


    private void checkOwner(Submission submission, String userId) {

        if (!userId.equals(submission.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }
}