package course.controller;

import course.dto.response.CourseResponse;
import course.dto.response.LessonResponse;
import course.service.CourseService;
import course.service.LessonService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalController {

    CourseService courseService;
    LessonService lessonService;

    @GetMapping("/internal/courses/{courseId}")
    public CourseResponse getCourse(
            @PathVariable("courseId") String courseId
    ) {
        return courseService.getCourseById(courseId);
    }

    @GetMapping("/internal/lessons/course/{courseId}")
    public List<LessonResponse> getLessonsByCourse(
            @PathVariable("courseId") String courseId
    ) {
        return lessonService.getLessonsByCourseId(courseId);
    }
}