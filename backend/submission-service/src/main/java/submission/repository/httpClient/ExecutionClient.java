package submission.repository.httpClient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import submission.config.ExecutionFeignConfig;
import submission.dto.request.ExecutionVerificationRequest;
import submission.dto.response.ApiResponse;
import submission.dto.response.RunExerciseResponse;

@FeignClient(
        name = "execution-service",
        url = "${services.execution.url:http://localhost:8087}",
        configuration = ExecutionFeignConfig.class
)
public interface ExecutionClient {

    @PostMapping("/internal/executions/verify")
    ApiResponse<RunExerciseResponse> verifyExecution(
            @RequestBody ExecutionVerificationRequest request
    );
}