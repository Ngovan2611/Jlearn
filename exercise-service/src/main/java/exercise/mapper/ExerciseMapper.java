package exercise.mapper;

import exercise.dto.request.ExerciseRequest;
import exercise.dto.response.ExerciseResponse;
import exercise.entity.Exercise;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ExerciseMapper {

    Exercise toExercise(ExerciseRequest request);

    ExerciseResponse toExerciseResponse(
            Exercise exercise
    );

    void updateExercise(
            ExerciseRequest request,
            @MappingTarget Exercise exercise
    );
}