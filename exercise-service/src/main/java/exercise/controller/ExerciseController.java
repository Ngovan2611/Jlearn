package exercise.controller;

import exercise.dto.request.ExerciseRequest;
import exercise.dto.response.ApiResponse;
import exercise.dto.response.ExerciseResponse;
import exercise.service.ExerciseService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exercises")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseController {

    ExerciseService exerciseService;

    // =========================
    // CREATE
    // =========================

    @PostMapping
    public ApiResponse<ExerciseResponse> createExercise(
            @RequestBody @Valid ExerciseRequest request
    ) {
        return ApiResponse.<ExerciseResponse>builder()
                .code(200)
                .result(exerciseService.createExercise(request))
                .build();
    }

    // =========================
    // GET BY ID
    // =========================

    @GetMapping("/{exerciseId}")
    public ApiResponse<ExerciseResponse> getExercise(
            @PathVariable String exerciseId
    ) {
        return ApiResponse.<ExerciseResponse>builder()
                .code(200)
                .result(exerciseService.getExercise(exerciseId))
                .build();
    }

    // =========================
    // GET BY LESSON
    // =========================

    @GetMapping("/lesson/{lessonId}")
    public ApiResponse<List<ExerciseResponse>> getExercisesByLesson(
            @PathVariable String lessonId
    ) {
        return ApiResponse.<List<ExerciseResponse>>builder()
                .code(200)
                .result(exerciseService.getExercisesByLesson(lessonId))
                .build();
    }

    // =========================
    // GET BY COURSE
    // =========================

    @GetMapping("/course/{courseId}")
    public ApiResponse<List<ExerciseResponse>> getExercisesByCourse(
            @PathVariable String courseId
    ) {
        return ApiResponse.<List<ExerciseResponse>>builder()
                .code(200)
                .result(exerciseService.getExercisesByCourse(courseId))
                .build();
    }

    // =========================
    // GET FREE PRACTICE
    // =========================

    @GetMapping("/practice")
    public ApiResponse<List<ExerciseResponse>> getFreeExercises() {
        return ApiResponse.<List<ExerciseResponse>>builder()
                .code(200)
                .result(exerciseService.getFreeExercises())
                .build();
    }

    // =========================
    // UPDATE
    // =========================

    @PutMapping("/{exerciseId}")
    public ApiResponse<ExerciseResponse> updateExercise(
            @PathVariable String exerciseId,
            @RequestBody @Valid ExerciseRequest request
    ) {
        return ApiResponse.<ExerciseResponse>builder()
                .code(200)
                .result(
                        exerciseService.updateExercise(
                                exerciseId,
                                request
                        )
                )
                .build();
    }

    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/{exerciseId}")
    public ApiResponse<Void> deleteExercise(
            @PathVariable String exerciseId
    ) {
        exerciseService.deleteExercise(exerciseId);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("Exercise deleted successfully")
                .build();
    }
}