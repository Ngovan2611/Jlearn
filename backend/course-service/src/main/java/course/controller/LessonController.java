package course.controller;

import course.dto.request.LessonRequest;
import course.dto.response.ApiResponse;
import course.dto.response.LessonResponse;
import course.dto.response.PageResponse;
import course.service.LessonService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/lessons")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LessonController {

    LessonService lessonService;

    @GetMapping
    public ApiResponse<PageResponse<LessonResponse>> getAllLessons(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<LessonResponse>>builder()
                .code(200)
                .result(lessonService.getAllLessonsPaging(keyword, page, size))
                .build();
    }

    @PostMapping
    public ApiResponse<LessonResponse> createLesson(
            @RequestBody @Valid LessonRequest request
    ) {
        return ApiResponse.<LessonResponse>builder()
                .code(200)
                .result(lessonService.createLesson(request))
                .build();
    }

    @PutMapping("/{lessonId}")
    public ApiResponse<LessonResponse> updateLesson(
            @PathVariable String lessonId,
            @RequestBody @Valid LessonRequest request
    ) {
        return ApiResponse.<LessonResponse>builder()
                .code(200)
                .result(lessonService.updateLesson(lessonId, request))
                .build();
    }

    @GetMapping("/{lessonId}")
    public ApiResponse<LessonResponse> getLesson(
            @PathVariable String lessonId
    ) {
        return ApiResponse.<LessonResponse>builder()
                .code(200)
                .result(lessonService.getLesson(lessonId))
                .build();
    }

    @GetMapping("/course/{courseId}")
    public ApiResponse<List<LessonResponse>> getLessonsByCourse(
            @PathVariable String courseId
    ) {
        return ApiResponse.<List<LessonResponse>>builder()
                .code(200)
                .result(lessonService.getLessonsByCourseId(courseId))
                .build();
    }

    @DeleteMapping("/{lessonId}")
    public ApiResponse<Void> deleteLesson(
            @PathVariable String lessonId
    ) {
        lessonService.deleteLesson(lessonId);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("Lesson deleted successfully")
                .build();
    }
    @PatchMapping("/{lessonId}/toggle-status")
    public ApiResponse<LessonResponse> toggleLessonStatus(@PathVariable String lessonId) {
        return ApiResponse.<LessonResponse>builder()
                .code(200)
                .result(lessonService.toggleLessonStatus(lessonId))
                .build();
    }
}