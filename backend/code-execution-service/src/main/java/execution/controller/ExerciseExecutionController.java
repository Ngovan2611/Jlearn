package execution.controller;

import execution.dto.request.RunExerciseRequest;
import execution.dto.response.RunExerciseResponse;
import execution.service.ExerciseExecutionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/executions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseExecutionController {

    ExerciseExecutionService exerciseExecutionService;

    @PostMapping("/run")
    public RunExerciseResponse run(
            @Valid @RequestBody RunExerciseRequest request
    ) {
        return exerciseExecutionService.run(request);
    }
}