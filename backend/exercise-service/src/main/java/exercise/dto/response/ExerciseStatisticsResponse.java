
package exercise.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExerciseStatisticsResponse {

    long totalExercises;
    long publishedExercises;
    long unpublishedExercises;

    long easy;
    long medium;
    long hard;
}
