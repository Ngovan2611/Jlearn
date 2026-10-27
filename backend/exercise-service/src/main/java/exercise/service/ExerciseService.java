package exercise.service;

import exercise.dto.request.ExerciseRequest;
import exercise.dto.response.CourseResponse;
import exercise.dto.response.ExerciseResponse;
import exercise.dto.response.LessonResponse;
import exercise.dto.response.PageResponse;
import exercise.entity.Exercise;
import exercise.exception.AppException;
import exercise.exception.ErrorCode;
import exercise.mapper.ExerciseMapper;
import exercise.repository.ExerciseRepository;
import exercise.repository.httpClients.CourseClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.query.Query;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseService {

    ExerciseRepository exerciseRepository;

    ExerciseMapper exerciseMapper;

    CourseClient courseClient;
    MongoTemplate mongoTemplate;

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

    public PageResponse<ExerciseResponse> getFreeExercises(
            String keyword,
            String difficulty,
            int page,
            int size
    ) {
        // Chuẩn hóa tham số phân trang
        page = Math.max(page, 0);
        size = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        // Điều kiện mặc định: chỉ lấy bài tập tự do
        Criteria criteria = Criteria.where("lessonId").is(null);

        // Tìm kiếm theo tiêu đề bài tập, không phân biệt chữ hoa/thường
        if (keyword != null && !keyword.trim().isEmpty()) {
            criteria.and("title").regex(
                    Pattern.quote(keyword.trim()),
                    "i"
            );
        }

        // Lọc theo độ khó nếu người dùng đã chọn
        if (difficulty != null && !difficulty.trim().isEmpty()) {
            criteria.and("difficulty").is(difficulty.trim());
        }

        // Truy vấn dữ liệu của trang hiện tại
        Query query = new Query(criteria).with(pageable);

        List<Exercise> exercises = mongoTemplate.find(
                query,
                Exercise.class
        );

        // Đếm tổng số kết quả với cùng điều kiện lọc
        Query countQuery = new Query(criteria);
        long totalElements = mongoTemplate.count(
                countQuery,
                Exercise.class
        );

        // Tạo Page để lấy thông tin phân trang
        Page<Exercise> exercisePage = new PageImpl<>(
                exercises,
                pageable,
                totalElements
        );

        List<ExerciseResponse> content = exercisePage.getContent()
                .stream()
                .map(exerciseMapper::toExerciseResponse)
                .toList();

        return PageResponse.<ExerciseResponse>builder()
                .currentPage(exercisePage.getNumber())
                .pageSize(exercisePage.getSize())
                .totalPages(exercisePage.getTotalPages())
                .totalElements(exercisePage.getTotalElements())
                .data(content)
                .build();
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
    // =========================================================
    // GET ALL EXERCISES WITH FILTERS & PAGINATION
    // =========================================================

    public PageResponse<ExerciseResponse> getAllExercisesPaging(
            String keyword,
            String lessonId,
            String difficulty,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (keyword != null && !keyword.trim().isEmpty()) {
            criteriaList.add(Criteria.where("title").regex(keyword.trim(), "i"));
        }

        if (lessonId != null && !lessonId.trim().isEmpty()) {
            criteriaList.add(Criteria.where("lessonId").is(lessonId.trim()));
        }

        if (difficulty != null && !difficulty.trim().isEmpty() && !"ALL".equalsIgnoreCase(difficulty)) {
            criteriaList.add(Criteria.where("difficulty").is(difficulty.trim()));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }
        long totalElements = mongoTemplate.count(query, Exercise.class);

        query.with(pageable);
        List<Exercise> exercises = mongoTemplate.find(query, Exercise.class);

        List<ExerciseResponse> content = exercises.stream()
                .map(exerciseMapper::toExerciseResponse)
                .toList();

        int totalPages = (int) Math.ceil((double) totalElements / size);

        return PageResponse.<ExerciseResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(Math.max(1, totalPages))
                .totalElements(totalElements)
                .data(content)
                .build();
    }



}