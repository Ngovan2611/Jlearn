package exercise.service;

import exercise.dto.request.TestCaseRequest;
import exercise.dto.response.TestCaseResponse;
import exercise.entity.Exercise;
import exercise.entity.TestCase;
import exercise.exception.AppException;
import exercise.exception.ErrorCode;
import exercise.mapper.TestCaseMapper;
import exercise.repository.ExerciseRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TestCaseService {

    ExerciseRepository exerciseRepository;

    TestCaseMapper testCaseMapper;

    public List<TestCaseResponse> getTestCases(
            String exerciseId
    ) {

        Exercise exercise = getExercise(exerciseId);

        return testCaseMapper.toTestCaseResponses(
                exercise.getTestCases()
        );
    }

    public TestCaseResponse getTestCase(
            String exerciseId,
            String testCaseId
    ) {

        Exercise exercise = getExercise(exerciseId);

        TestCase testCase =
                findTestCase(exercise, testCaseId);

        return testCaseMapper.toTestCaseResponse(
                testCase
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    public TestCaseResponse addTestCase(
            String exerciseId,
            TestCaseRequest request
    ) {

        Exercise exercise = getExercise(exerciseId);

        TestCase testCase =
                testCaseMapper.toTestCase(request);

        testCase.setId(
                UUID.randomUUID().toString()
        );

        if (exercise.getTestCases() == null) {
            exercise.setTestCases(
                    new ArrayList<>()
            );
        }

        exercise.getTestCases().add(testCase);

        exerciseRepository.save(exercise);

        return testCaseMapper.toTestCaseResponse(
                testCase
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    public TestCaseResponse updateTestCase(
            String exerciseId,
            String testCaseId,
            TestCaseRequest request
    ) {

        Exercise exercise = getExercise(exerciseId);

        TestCase testCase =
                findTestCase(exercise, testCaseId);

        testCaseMapper.updateTestCase(
                request,
                testCase
        );

        exerciseRepository.save(exercise);

        return testCaseMapper.toTestCaseResponse(
                testCase
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteTestCase(
            String exerciseId,
            String testCaseId
    ) {

        Exercise exercise = getExercise(exerciseId);

        TestCase testCase =
                findTestCase(exercise, testCaseId);

        exercise.getTestCases().remove(testCase);

        exerciseRepository.save(exercise);
    }

    private Exercise getExercise(
            String exerciseId
    ) {

        return exerciseRepository
                .findById(exerciseId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.EXERCISE_NOT_EXISTED)
                );
    }

    private TestCase findTestCase(
            Exercise exercise,
            String testCaseId
    ) {

        if (exercise.getTestCases() == null) {
            throw new AppException(ErrorCode.TESTCASE_NOT_EXISTED);
        }

        return exercise.getTestCases()
                .stream()
                .filter(testCase ->
                        testCase.getId()
                                .equals(testCaseId)
                )
                .findFirst()
                .orElseThrow(() ->
                        new AppException(ErrorCode.TESTCASE_NOT_EXISTED)
                );
    }
}