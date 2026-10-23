package course.service;

import course.dto.request.LessonRequest;
import course.dto.response.LessonResponse;
import course.dto.response.PageResponse;
import course.entity.Lesson;
import course.exception.AppException;
import course.exception.ErrorCode;
import course.mapper.LessonMapper;
import course.repository.LessonRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LessonService {

    LessonRepository lessonRepository;
    LessonMapper lessonMapper;

    public PageResponse<LessonResponse> getAllLessonsPaging(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lessonOrder").ascending());
        String searchKeyword = (keyword != null) ? keyword.trim() : "";

        Page<Lesson> lessonPage = lessonRepository.searchLessons(searchKeyword, pageable);

        List<LessonResponse> content = lessonPage.getContent().stream()
                .map(lessonMapper::toLessonResponse)
                .toList();

        return PageResponse.<LessonResponse>builder()
                .currentPage(page)
                .pageSize(lessonPage.getSize())
                .totalPages(lessonPage.getTotalPages())
                .totalElements(lessonPage.getTotalElements())
                .data(content)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonResponse createLesson(LessonRequest lessonRequest) {
        Lesson lessonExisted = lessonRepository.findByTitle(lessonRequest.getTitle());
        if (lessonExisted != null) {
            throw new AppException(ErrorCode.LESSON_EXISTED);
        }

        Lesson lesson = lessonMapper.toLessonEntity(lessonRequest);
        lesson.setPublished(true);

        return lessonMapper.toLessonResponse(lessonRepository.save(lesson));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonResponse updateLesson(String id, LessonRequest lessonRequest) {
        Lesson lessonExisted = lessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_EXISTED));

        lessonMapper.updateLesson(lessonRequest, lessonExisted);

        return lessonMapper.toLessonResponse(lessonRepository.save(lessonExisted));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteLesson(String id) {
        Lesson lessonExisted = lessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_EXISTED));

        lessonRepository.delete(lessonExisted);
    }

    public List<LessonResponse> getLessonsByCourseId(String courseId) {
        List<Lesson> lessons = lessonRepository.findByCourseId(courseId);
        if (lessons.isEmpty()) {
            throw new AppException(ErrorCode.LESSON_NOT_EXISTED);
        }

        return lessons.stream()
                .map(lessonMapper::toLessonResponse)
                .toList();
    }

    public LessonResponse getLesson(String id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_EXISTED));

        return lessonMapper.toLessonResponse(lesson);
    }

    public List<LessonResponse> getPublishedLessonsByCourseId(String courseId) {
        List<Lesson> lessons = lessonRepository.findByCourseIdAndPublishedTrue(courseId);
        if (lessons.isEmpty()) {
            throw new AppException(ErrorCode.LESSON_NOT_EXISTED);
        }

        return lessons.stream()
                .map(lessonMapper::toLessonResponse)
                .toList();
    }


    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonResponse toggleLessonStatus(String id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_EXISTED));

        lesson.setPublished(!lesson.isPublished());

        return lessonMapper.toLessonResponse(lessonRepository.save(lesson));
    }
}