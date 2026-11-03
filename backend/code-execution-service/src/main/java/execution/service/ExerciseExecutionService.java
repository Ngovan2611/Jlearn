package execution.service;

import execution.dto.request.RunExerciseRequest;
import execution.dto.response.CachedExecution;
import execution.dto.response.ExerciseResponse;
import execution.dto.response.RunExerciseResponse;
import execution.exception.AppException;
import execution.exception.ErrorCode;
import execution.model.CodeExecutionCommand;
import execution.model.CodeExecutionResult;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseExecutionService {

    ExecutionResultCacheService executionResultCacheService;
    CodeExecutionService codeExecutionService;
    ExerciseDataService exerciseDataService;
    ExecutionFingerprintService executionFingerprintService;

    public RunExerciseResponse run(RunExerciseRequest request) {

        validateRequest(request);

        String userId = getCurrentUserId();

        ExerciseResponse exercise = exerciseDataService.getExecutionData(request.getExerciseId());

        if (exercise == null || exercise.getTestCases() == null || exercise.getTestCases().isEmpty()) {
            throw new AppException(ErrorCode.EXERCISE_NO_TEST_CASES);
        }

        var testCases = exercise.getTestCases();

        log.info(
                "Running exercise {} in PARALLEL mode, test cases: {}",
                request.getExerciseId(),
                testCases.size()
        );

        int total = testCases.size();

        AtomicInteger passedCounter = new AtomicInteger(0);
        LongAdder totalExecutionTimeAccumulator = new LongAdder();

        // 1. Thực thi các testcase song song
        List<CompletableFuture<RunExerciseResponse.TestCaseResult>> futures =
                IntStream.range(0, total)
                        .mapToObj(i -> {
                            var testCase = testCases.get(i);

                            return CompletableFuture.supplyAsync(() -> {

                                CodeExecutionCommand command = CodeExecutionCommand.builder()
                                        .sourceCode(request.getSourceCode())
                                        .language(request.getLanguage())
                                        .stdin(testCase.getInput())
                                        .timeoutMs(exercise.getTimeLimit())
                                        .build();

                                CodeExecutionResult execution = codeExecutionService.execute(command);

                                totalExecutionTimeAccumulator.add(execution.getExecutionTime());

                                boolean executionSuccessful = "SUCCESS".equalsIgnoreCase(execution.getStatus());

                                boolean testPassed = executionSuccessful
                                        && normalize(execution.getStdout())
                                        .equals(normalize(testCase.getExpectedOutput()));

                                if (testPassed) {
                                    passedCounter.incrementAndGet();
                                }

                                boolean hidden = testCase.isHidden();

                                String testStatus;
                                if (testPassed) {
                                    testStatus = "PASSED";
                                } else if (!executionSuccessful) {
                                    testStatus = execution.getStatus();
                                } else {
                                    testStatus = "WRONG_ANSWER";
                                }

                                return RunExerciseResponse.TestCaseResult.builder()
                                        .testCaseNumber(i + 1)
                                        .status(testStatus)
                                        .hidden(hidden)
                                        .actualOutput(hidden ? null : execution.getStdout())
                                        .build();
                            });
                        })
                        .toList();

        // 2. Chờ toàn bộ testcase hoàn tất
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // 3. Thu thập kết quả theo đúng thứ tự testcase
        List<RunExerciseResponse.TestCaseResult> results =
                futures.stream()
                        .map(CompletableFuture::join)
                        .toList();

        int passed = passedCounter.get();
        boolean allPassed = passed == total;

        log.info(
                "Exercise {} finished: {}/{} passed",
                request.getExerciseId(),
                passed,
                total
        );

        // 4. Tạo execution ID
        String executionId = UUID.randomUUID().toString();

        RunExerciseResponse response = RunExerciseResponse.builder()
                .executionId(executionId)
                .exerciseId(request.getExerciseId())
                .status(allPassed ? "ACCEPTED" : "FAILED")
                .allPassed(allPassed)
                .totalTestCases(total)
                .passedTestCases(passed)
                .executionTimeMs(totalExecutionTimeAccumulator.sum())
                .testCaseResults(results)
                .build();

        // 5. Tính fingerprint dùng chung
        String sourceCodeHash = executionFingerprintService.generateSourceCodeHash(request.getSourceCode());
        String testcaseFingerprint = executionFingerprintService.generateTestcaseFingerprint(exercise);

        // 6. Lưu kết quả vào cache
        CachedExecution cachedExecution = CachedExecution.builder()
                .executionId(executionId)
                .exerciseId(request.getExerciseId())
                .userId(userId)
                .sourceCodeHash(sourceCodeHash)
                .testcaseFingerprint(testcaseFingerprint)
                .result(response)
                .executedAt(Instant.now())
                .build();

        executionResultCacheService.save(cachedExecution);

        log.info(
                "Cached execution successfully: executionId={}, userId={}",
                executionId,
                userId
        );

        return response;
    }

    private void validateRequest(RunExerciseRequest request) {

        if (request == null || request.getExerciseId() == null || request.getExerciseId().isBlank()) {
            throw new AppException(ErrorCode.EXERCISE_ID_REQUIRED);
        }

        if (request.getSourceCode() == null || request.getSourceCode().isBlank()) {
            throw new AppException(ErrorCode.SOURCE_CODE_REQUIRED);
        }

        if (!"JAVA".equalsIgnoreCase(request.getLanguage())) {
            throw new AppException(ErrorCode.UNSUPPORTED_LANGUAGE);
        }
    }

    private String normalize(String output) {
        if (output == null) {
            return "";
        }

        return output
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .strip();
    }

    private String getCurrentUserId() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!(authentication instanceof JwtAuthenticationToken jwtAuth) || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String userId = jwtAuth.getToken().getClaimAsString("accountId");

        if (userId == null || userId.isBlank()) {
            userId = jwtAuth.getToken().getSubject();
        }

        if (userId == null || userId.isBlank()) {
            throw new AppException(ErrorCode.USER_ID_NOT_FOUND_IN_TOKEN);
        }

        return userId;
    }
}