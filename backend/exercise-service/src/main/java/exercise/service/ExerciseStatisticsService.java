
package exercise.service;

import exercise.dto.response.ExerciseStatisticsResponse;
import exercise.repository.ExerciseRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseStatisticsService {

    ExerciseRepository exerciseRepository;

    public ExerciseStatisticsResponse getStatistics() {
        return ExerciseStatisticsResponse.builder()
                .totalExercises(exerciseRepository.count())
                .publishedExercises(
                        exerciseRepository.countByPublishedTrue()
                )
                .unpublishedExercises(
                        exerciseRepository.countByPublishedFalse()
                )
                .easy(countDifficulty("EASY"))
                .medium(countDifficulty("MEDIUM"))
                .hard(countDifficulty("HARD"))
                .build();
    }

    private long countDifficulty(String difficulty) {
        return exerciseRepository
                .countByPublishedTrueAndDifficultyIgnoreCase(
                        difficulty
                );
    }
}
