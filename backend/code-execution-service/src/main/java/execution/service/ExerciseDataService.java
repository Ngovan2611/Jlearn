
package execution.service;

import execution.dto.response.ApiResponse;
import execution.dto.response.ExerciseResponse;
import execution.httpClient.ExerciseClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseDataService {

    ExerciseClient exerciseClient;

    @Cacheable(
            cacheNames = "exerciseExecutionData",
            key = "#exerciseId",
            sync = true
    )
    public ExerciseResponse getExecutionData(String exerciseId) {

        ApiResponse<ExerciseResponse> response =
                exerciseClient.getExecutionData(exerciseId);

        if (response == null || response.getResult() == null) {
            throw new IllegalStateException(
                    "Exercise Service returned no data for exerciseId: "
                            + exerciseId
            );
        }

        ExerciseResponse data = response.getResult();

        if (data.getTestCases() == null || data.getTestCases().isEmpty()) {
            throw new IllegalStateException(
                    "Exercise has no test cases. exerciseId: " + exerciseId
            );
        }

        return data;
    }

    @CacheEvict(
            cacheNames = "exerciseExecutionData",
            key = "#exerciseId"
    )
    public void evictExercise(String exerciseId) {
        // Gọi khi bài tập hoặc test case được cập nhật.
    }
}
