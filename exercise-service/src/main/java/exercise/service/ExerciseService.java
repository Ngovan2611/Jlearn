package exercise.service;

import exercise.dto.request.ExerciseRequest;
import exercise.dto.response.CourseResponse;
import exercise.dto.response.ExerciseResponse;
import exercise.dto.response.LessonResponse;
import exercise.entity.Exercise;
import exercise.exception.AppException;
import exercise.exception.ErrorCode;
import exercise.mapper.ExerciseMapper;
import exercise.repository.ExerciseRepository;
import exercise.repository.httpClients.CourseClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseService {

    ExerciseRepository exerciseRepository;

    ExerciseMapper exerciseMapper;

    CourseClient courseClient;

    // =========================================================
    // CREATE
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    public ExerciseResponse createExercise(
            ExerciseRequest request
    ) {

        /*
         * Có lessonId
         * -> Đây là bài tập thuộc khóa học
         * -> Kiểm tra Course + Lesson
         *
         * Không có lessonId
         * -> Đây là bài tập tự do
         * -> Không cần gọi Course Service
         */
        validateCourseAndLesson(
                request.getCourseId(),
                request.getLessonId()
        );

        Exercise exercise =
                exerciseMapper.toExercise(request);

        exercise = exerciseRepository.save(exercise);

        return exerciseMapper.toExerciseResponse(
                exercise
        );
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    public ExerciseResponse getExercise(
            String exerciseId
    ) {

        Exercise exercise =
                exerciseRepository.findById(exerciseId)
                        .orElseThrow(() ->
                                new AppException(
                                        ErrorCode.EXERCISE_NOT_EXISTED
                                )
                        );

        return exerciseMapper.toExerciseResponse(
                exercise
        );
    }

    // =========================================================
    // GET EXERCISES BY LESSON
    // =========================================================

    public List<ExerciseResponse> getExercisesByLesson(
            String lessonId
    ) {

        return exerciseRepository
                .findByLessonIdAndPublishedTrue(lessonId)
                .stream()
                .map(exerciseMapper::toExerciseResponse)
                .toList();
    }

    // =========================================================
    // GET EXERCISES BY COURSE
    // =========================================================

    public List<ExerciseResponse> getExercisesByCourse(
            String courseId
    ) {

        return exerciseRepository
                .findByCourseId(courseId)
                .stream()
                .map(exerciseMapper::toExerciseResponse)
                .toList();
    }

    // =========================================================
    // GET FREE PRACTICE
    // =========================================================

    public List<ExerciseResponse> getFreeExercises() {

        return exerciseRepository
                .findByLessonIdIsNull()
                .stream()
                .map(exerciseMapper::toExerciseResponse)
                .toList();
    }

    // =========================================================
    // UPDATE
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    public ExerciseResponse updateExercise(
            String exerciseId,
            ExerciseRequest request
    ) {

        Exercise exercise =
                exerciseRepository.findById(exerciseId)
                        .orElseThrow(() ->
                                new AppException(
                                        ErrorCode.EXERCISE_NOT_EXISTED
                                )
                        );


        validateCourseAndLesson(
                request.getCourseId(),
                request.getLessonId()
        );

        exerciseMapper.updateExercise(
                request,
                exercise
        );

        exercise = exerciseRepository.save(exercise);

        return exerciseMapper.toExerciseResponse(
                exercise
        );
    }

    // =========================================================
    // DELETE
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteExercise(
            String exerciseId
    ) {

        if (!exerciseRepository.existsById(exerciseId)) {
            throw new AppException(
                    ErrorCode.EXERCISE_NOT_EXISTED
            );
        }

        exerciseRepository.deleteById(exerciseId);
    }

    // =========================================================
    // VALIDATE COURSE + LESSON
    // =========================================================

    private void validateCourseAndLesson(
            String courseId,
            String lessonId
    ) {


        if (courseId == null && lessonId == null) {
            return;
        }

        if (lessonId != null) {

            if (courseId == null) {
                throw new AppException(
                        ErrorCode.COURSE_NOT_EXISTED
                );
            }

            CourseResponse course =
                    courseClient.getCourse(courseId);

            if (course == null) {
                throw new AppException(
                        ErrorCode.COURSE_NOT_EXISTED
                );
            }

            LessonResponse lesson =
                    courseClient.getLesson(lessonId);

            if (lesson == null) {
                throw new AppException(
                        ErrorCode.LESSON_NOT_EXISTED
                );
            }

            if (!courseId.equals(lesson.getCourseId())) {
                throw new AppException(
                        ErrorCode.LESSON_NOT_BELONG_TO_THIS_COURSE
                );
            }

            return;
        }

        throw new AppException(
                ErrorCode.LESSON_NOT_EXISTED
        );
    }
}