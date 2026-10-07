package exercise.controller;

import exercise.dto.request.ExerciseRequest;
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
    public ExerciseResponse createExercise(
            @RequestBody @Valid ExerciseRequest request
    ) {
        return exerciseService.createExercise(request);
    }

    // =========================
    // GET BY ID
    // =========================

    @GetMapping("/{exerciseId}")
    public ExerciseResponse getExercise(
            @PathVariable String exerciseId
    ) {
        return exerciseService.getExercise(exerciseId);
    }

    // =========================
    // GET BY LESSON
    // =========================

    @GetMapping("/lesson/{lessonId}")
    public List<ExerciseResponse> getExercisesByLesson(
            @PathVariable String lessonId
    ) {
        return exerciseService.getExercisesByLesson(lessonId);
    }

    // =========================
    // GET BY COURSE
    // =========================

    @GetMapping("/course/{courseId}")
    public List<ExerciseResponse> getExercisesByCourse(
            @PathVariable String courseId
    ) {
        return exerciseService.getExercisesByCourse(courseId);
    }

    // =========================
    // UPDATE
    // =========================

    @PutMapping("/{exerciseId}")
    public ExerciseResponse updateExercise(
            @PathVariable String exerciseId,
            @RequestBody @Valid ExerciseRequest request
    ) {
        return exerciseService.updateExercise(
                exerciseId,
                request
        );
    }

    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/{exerciseId}")
    public void deleteExercise(
            @PathVariable String exerciseId
    ) {
        exerciseService.deleteExercise(exerciseId);
    }
}