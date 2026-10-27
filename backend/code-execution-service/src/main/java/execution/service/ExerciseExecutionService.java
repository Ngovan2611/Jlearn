package execution.service;

import execution.dto.request.RunExerciseRequest;
import execution.dto.response.ExerciseResponse;
import execution.dto.response.RunExerciseResponse;
import execution.model.CodeExecutionCommand;
import execution.model.CodeExecutionResult;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseExecutionService {

    CodeExecutionService codeExecutionService;
    ExerciseDataService exerciseDataService;

    public RunExerciseResponse run(RunExerciseRequest request) {

        if (request == null
                || request.getExerciseId() == null
                || request.getExerciseId().isBlank()) {
            throw new IllegalArgumentException("Exercise ID is required.");
        }

        if (request.getSourceCode() == null
                || request.getSourceCode().isBlank()) {
            throw new IllegalArgumentException("Source code is required.");
        }

        if (!"JAVA".equalsIgnoreCase(request.getLanguage())) {
            throw new IllegalArgumentException(
                    "Currently only JAVA is supported."
            );
        }

        ExerciseResponse exercise =
                exerciseDataService.getExecutionData(
                        request.getExerciseId()
                );

        var testCases = exercise.getTestCases();

        if (testCases == null || testCases.isEmpty()) {
            throw new IllegalStateException(
                    "Exercise has no test cases."
            );
        }

        log.info(
                "Running exercise {} in PARALLEL mode, test cases: {}",
                request.getExerciseId(),
                testCases.size()
        );

        int total = testCases.size();
        AtomicInteger passedCounter = new AtomicInteger(0);
        LongAdder totalExecutionTimeAccumulator = new LongAdder();

        // 1. Tạo danh sách các CompletableFuture để chạy tất cả test cases cùng lúc
        List<CompletableFuture<RunExerciseResponse.TestCaseResult>> futures =
                IntStream.range(0, total)
                        .mapToObj(i -> {
                            var testCase = testCases.get(i);

                            return CompletableFuture.supplyAsync(() -> {
                                CodeExecutionCommand command =
                                        CodeExecutionCommand.builder()
                                                .sourceCode(request.getSourceCode())
                                                .language(request.getLanguage())
                                                .stdin(testCase.getInput())
                                                .timeoutMs(exercise.getTimeLimit())
                                                .build();

                                CodeExecutionResult execution =
                                        codeExecutionService.execute(command);

                                totalExecutionTimeAccumulator.add(execution.getExecutionTime());

                                boolean executionSuccessful =
                                        "SUCCESS".equalsIgnoreCase(execution.getStatus());

                                boolean testPassed =
                                        executionSuccessful
                                                && normalize(execution.getStdout())
                                                .equals(normalize(
                                                        testCase.getExpectedOutput()
                                                ));

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
                                        .actualOutput(
                                                hidden
                                                        ? null
                                                        : execution.getStdout()
                                        )
                                        .build();
                            });
                        })
                        .toList();

        // 2. Chờ tất cả các test cases thực thi xong
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // 3. Thu thập kết quả theo đúng thứ tự ban đầu
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

        return RunExerciseResponse.builder()
                .exerciseId(request.getExerciseId())
                .status(allPassed ? "ACCEPTED" : "FAILED")
                .allPassed(allPassed)
                .totalTestCases(total)
                .passedTestCases(passed)
                .executionTimeMs(totalExecutionTimeAccumulator.sum())
                .testCaseResults(results)
                .build();
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
}