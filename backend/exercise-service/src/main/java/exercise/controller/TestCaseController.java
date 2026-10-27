package exercise.controller;

import exercise.dto.request.TestCaseRequest;
import exercise.dto.response.TestCaseResponse;
import exercise.service.TestCaseService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exercises/{exerciseId}/test-cases")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TestCaseController {

    TestCaseService testCaseService;

    @GetMapping
    public List<TestCaseResponse> getTestCases(
            @PathVariable String exerciseId
    ) {
        return testCaseService.getTestCases(exerciseId);
    }



    @GetMapping("/{testCaseId}")
    public TestCaseResponse getTestCase(
            @PathVariable String exerciseId,
            @PathVariable String testCaseId
    ) {
        return testCaseService.getTestCase(
                exerciseId,
                testCaseId
        );
    }



    @PostMapping
    public TestCaseResponse addTestCase(
            @PathVariable String exerciseId,
            @RequestBody @Valid TestCaseRequest request
    ) {
        return testCaseService.addTestCase(
                exerciseId,
                request
        );
    }



    @PutMapping("/{testCaseId}")
    public TestCaseResponse updateTestCase(
            @PathVariable String exerciseId,
            @PathVariable String testCaseId,
            @RequestBody @Valid TestCaseRequest request
    ) {
        return testCaseService.updateTestCase(
                exerciseId,
                testCaseId,
                request
        );
    }

    // =========================
    // DELETE TEST CASE
    // =========================

    @DeleteMapping("/{testCaseId}")
    public void deleteTestCase(
            @PathVariable String exerciseId,
            @PathVariable String testCaseId
    ) {
        testCaseService.deleteTestCase(
                exerciseId,
                testCaseId
        );
    }
}