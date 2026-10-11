
package execution.httpClient;

import execution.dto.response.ApiResponse;
import execution.dto.response.ExerciseResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "exercise-service",
        url = "${services.exercise.url:http://localhost:8084}"
)
public interface ExerciseClient {

    @GetMapping("/internal/exercises/{exerciseId}/execution-data")
    ApiResponse<ExerciseResponse> getExecutionData(
            @PathVariable("exerciseId") String exerciseId
    );
}
