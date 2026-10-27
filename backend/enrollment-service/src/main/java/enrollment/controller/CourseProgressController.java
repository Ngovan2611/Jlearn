package enrollment.controller;

import enrollment.dto.request.ProgressUpdateRequest;
import enrollment.dto.response.ApiResponse;
import enrollment.dto.response.CourseProgressResponse;
import enrollment.service.CourseProgressService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CourseProgressController {

    CourseProgressService courseProgressService;

    @GetMapping("/{courseId}")
    public ApiResponse<CourseProgressResponse> getProgress(
            @PathVariable String courseId
    ) {

        return ApiResponse.<CourseProgressResponse>builder()
                .code(200)
                .result(
                        courseProgressService
                                .getProgress(courseId)
                )
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<List<CourseProgressResponse>> getMyProgress() {

        return ApiResponse.<List<CourseProgressResponse>>builder()
                .code(200)
                .result(
                        courseProgressService
                                .getMyProgress()
                )
                .build();
    }

    @PutMapping("/{courseId}")
    public ApiResponse<CourseProgressResponse> updateProgress(
            @PathVariable String courseId,
            @RequestBody @Valid ProgressUpdateRequest request
    ) {

        return ApiResponse.<CourseProgressResponse>builder()
                .code(200)
                .message("Progress updated")
                .result(
                        courseProgressService.updateProgress(
                                courseId,
                                request
                        )
                )
                .build();
    }
}