package course.service;


import course.dto.request.LessonRequest;
import course.dto.response.LessonResponse;
import course.entity.Lesson;
import course.exception.AppException;
import course.exception.ErrorCode;
import course.mapper.LessonMapper;
import course.repository.LessonRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class LessonService {
    LessonRepository lessonRepository;
    LessonMapper lessonMapper;

    @PreAuthorize("hasRole('ADMIN')")
    public LessonResponse createLesson(LessonRequest lessonRequest) {

        Lesson lessonExisted = lessonRepository.findByTitle(lessonRequest.getTitle());
        if (lessonExisted != null) {
            throw new AppException(ErrorCode.LESSON_EXISTED);

        }

        Lesson lesson = lessonMapper.toLessonEntity(lessonRequest);
        lessonRepository.save(lesson);
        return lessonMapper.toLessonResponse(lesson);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public LessonResponse updateLesson(String id, LessonRequest lessonRequest) {
        Lesson lessonExisted = lessonRepository.findById(id)
                .orElseThrow(() ->  new AppException(ErrorCode.LESSON_NOT_EXISTED));

        lessonMapper.updateLesson(lessonRequest, lessonExisted);

        return lessonMapper.toLessonResponse(lessonExisted);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteLesson(String id) {
        Lesson lessonExisted = lessonRepository.findById(id)
                .orElseThrow(() ->  new AppException(ErrorCode.LESSON_NOT_EXISTED));
        lessonRepository.deleteById(id);
    }

    public List<LessonResponse> getLessonsByCourseId(String courseId) {

        List<Lesson> lessons = lessonRepository.findByCourseId(courseId);
        if(lessons.isEmpty()){
            throw new AppException(ErrorCode.LESSON_NOT_EXISTED);
        }
        return lessons.stream()
                .map(lessonMapper::toLessonResponse).toList();

    }


    public LessonResponse getLesson(String id) {

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() ->
                        new AppException(ErrorCode.LESSON_NOT_EXISTED)
                );

        return lessonMapper.toLessonResponse(lesson);
    }

    public List<LessonResponse> getPublishedLessonsByCourseId(
            String courseId
    ) {

        List<Lesson> lessons =
                lessonRepository.findByCourseIdAndPublishedTrue(courseId);

        if (lessons.isEmpty()) {
            throw new AppException(ErrorCode.LESSON_NOT_EXISTED);
        }

        return lessons.stream()
                .map(lessonMapper::toLessonResponse)
                .toList();
    }

    public List<LessonResponse> getAllLesson() {
        return lessonRepository.findAll().stream()
                .map(lessonMapper::toLessonResponse).toList();
    }
}
