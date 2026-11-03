package execution.service;

import execution.dto.request.VerifyExecutionRequest;
import execution.dto.response.CachedExecution;
import execution.dto.response.ExerciseResponse;
import execution.dto.response.RunExerciseResponse;
import execution.exception.AppException;
import execution.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExecutionVerificationService {

    ExecutionResultCacheService executionResultCacheService;
    ExerciseDataService exerciseDataService;
    ExecutionFingerprintService executionFingerprintService;

    public RunExerciseResponse verify(
            VerifyExecutionRequest request,
            String currentUserId
    ) {

        validateRequest(request, currentUserId);

        // 1. Lấy execution đã lưu
        CachedExecution cached =
                executionResultCacheService.get(request.getExecutionId());

        if (cached == null) {
            throw new AppException(ErrorCode.EXECUTION_EXPIRED_OR_NOT_FOUND);
        }

        // 2. Kiểm tra quyền sở hữu
        if (!Objects.equals(cached.getUserId(), currentUserId)) {
            throw new AppException(ErrorCode.EXECUTION_ACCESS_DENIED);
        }

        // 3. Kiểm tra bài tập
        if (!Objects.equals(cached.getExerciseId(), request.getExerciseId())) {
            throw new AppException(ErrorCode.EXERCISE_ID_MISMATCH);
        }

        // 4. Kiểm tra source code
        String currentSourceHash =
                executionFingerprintService.generateSourceCodeHash(request.getSourceCode());

        if (!Objects.equals(cached.getSourceCodeHash(), currentSourceHash)) {
            throw new AppException(ErrorCode.SOURCE_CODE_CHANGED);
        }

        // 5. Kiểm tra fingerprint đã lưu
        if (cached.getTestcaseFingerprint() == null
                || cached.getTestcaseFingerprint().isBlank()) {
            throw new AppException(ErrorCode.EXECUTION_DATA_INCOMPLETE);
        }

        // 6. Lấy testcase hiện tại
        ExerciseResponse exercise =
                exerciseDataService.getExecutionData(request.getExerciseId());

        if (exercise == null
                || exercise.getTestCases() == null
                || exercise.getTestCases().isEmpty()) {
            throw new AppException(ErrorCode.TEST_CASES_UNAVAILABLE);
        }

        // 7. Tính lại fingerprint và so sánh
        String currentFingerprint =
                executionFingerprintService.generateTestcaseFingerprint(exercise);

        if (!Objects.equals(cached.getTestcaseFingerprint(), currentFingerprint)) {
            throw new AppException(ErrorCode.TEST_CASES_CHANGED);
        }

        // 8. Kiểm tra kết quả cache
        if (cached.getResult() == null) {
            throw new AppException(ErrorCode.CACHED_RESULT_INVALID);
        }

        return cached.getResult();
    }

    private void validateRequest(
            VerifyExecutionRequest request,
            String currentUserId
    ) {

        if (request == null
                || request.getExecutionId() == null
                || request.getExecutionId().isBlank()
                || request.getExerciseId() == null
                || request.getExerciseId().isBlank()
                || request.getSourceCode() == null
                || request.getSourceCode().isBlank()) {
            throw new AppException(ErrorCode.INVALID_VERIFY_REQUEST);
        }

        if (currentUserId == null || currentUserId.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}