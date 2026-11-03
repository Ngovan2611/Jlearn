package submission.controller;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import submission.dto.request.SubmissionRequest;
import submission.dto.response.ApiResponse;
import submission.dto.response.SubmissionResponse;
import submission.service.SubmissionService;

import java.util.List;

@RestController
@RequestMapping("/submissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionController {

    SubmissionService submissionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SubmissionResponse> submit(
            @Valid @RequestBody SubmissionRequest request) {

        return ApiResponse.<SubmissionResponse>builder()
                .code(200)
                .message("Submission processed successfully")
                .result(submissionService.submit(request))
                .build();
    }

    @GetMapping("/exercises/{exerciseId}/latest")
    public ApiResponse<SubmissionResponse> getMySubmissionByExercise(
            @PathVariable String exerciseId) {

        return ApiResponse.<SubmissionResponse>builder()
                .code(200)
                .result(submissionService.getMySubmissionByExercise(exerciseId))
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<List<SubmissionResponse>> getMySubmissions() {
        return ApiResponse.<List<SubmissionResponse>>builder()
                .code(200)
                .result(submissionService.getMySubmissions())
                .build();
    }

    @GetMapping("/me/exercises/{exerciseId}")
    public ApiResponse<List<SubmissionResponse>> getMyExerciseSubmissions(
            @PathVariable String exerciseId) {

        return ApiResponse.<List<SubmissionResponse>>builder()
                .code(200)
                .result(submissionService.getMyExerciseSubmissions(exerciseId))
                .build();
    }

    @GetMapping("/{submissionId}")
    public ApiResponse<SubmissionResponse> getSubmission(
            @PathVariable String submissionId) {

        return ApiResponse.<SubmissionResponse>builder()
                .code(200)
                .result(submissionService.getSubmission(submissionId))
                .build();
    }
}