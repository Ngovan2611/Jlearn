package course.controller;

import course.dto.request.LessonRequest;
import course.dto.response.ApiResponse;
import course.dto.response.LessonResponse;
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
    public ApiResponse<List<LessonResponse>> getAllLessons() {
        return ApiResponse.<List<LessonResponse>>builder()
                .code(200)
                .result(lessonService.getAllLesson())
                .build();
    }
    // =========================
    // CREATE
    // =========================
    @PostMapping
    public ApiResponse<LessonResponse> createLesson(
            @RequestBody @Valid LessonRequest request
    ) {
        return ApiResponse.<LessonResponse>builder()
                .result(lessonService.createLesson(request))
                .build();
    }

    // =========================
    // UPDATE
    // =========================
    @PutMapping("/{lessonId}")
    public ApiResponse<LessonResponse> updateLesson(
            @PathVariable String lessonId,
            @RequestBody @Valid LessonRequest request
    ) {
        return ApiResponse.<LessonResponse>builder()
                .result(lessonService.updateLesson(lessonId, request))
                .build();
    }

    // =========================
    // GET BY ID
    // =========================
    @GetMapping("/{lessonId}")
    public ApiResponse<LessonResponse> getLesson(
            @PathVariable String lessonId
    ) {
        return ApiResponse.<LessonResponse>builder()
                .result(lessonService.getLesson(lessonId))
                .build();
    }

    // =========================
    // GET BY COURSE
    // =========================
    @GetMapping("/course/{courseId}")
    public ApiResponse<List<LessonResponse>> getLessonsByCourse(
            @PathVariable String courseId
    ) {
        return ApiResponse.<List<LessonResponse>>builder()
                .result(lessonService.getLessonsByCourseId(courseId))
                .build();
    }

    // =========================
    // DELETE
    // =========================
    @DeleteMapping("/{lessonId}")
    public ApiResponse<Void> deleteLesson(
            @PathVariable String lessonId
    ) {
        lessonService.deleteLesson(lessonId);

        return ApiResponse.<Void>builder()
                .message("Lesson deleted successfully")
                .build();
    }
}