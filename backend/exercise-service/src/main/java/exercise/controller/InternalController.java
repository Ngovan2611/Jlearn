package exercise.controller;

import exercise.dto.response.ApiResponse;
import exercise.dto.response.ExerciseResponse;
import exercise.service.ExerciseService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalController {

    ExerciseService exerciseService;

    @GetMapping("/internal/exercises/{exerciseId}/execution-data")
    public ApiResponse<ExerciseResponse> getData(@PathVariable("exerciseId")
                                                     String exerciseId) {

        return ApiResponse.<ExerciseResponse>builder()
                .code(200)
                .result(exerciseService.getExercise(exerciseId))
                .build();
    }
}
