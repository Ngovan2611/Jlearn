package course.controller;


import course.dto.response.CourseResponse;
import course.dto.response.LessonResponse;
import course.mapper.CourseMapper;
import course.service.CourseService;
import course.service.LessonService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalController {

    CourseService courseService;
    LessonService lessonService;

    @GetMapping("internal/courses/{courseId}")
    public CourseResponse getCourse(
            @PathVariable String courseId){

        return courseService.getCourseById(courseId);
    }

    @GetMapping("internal/lessons/{lessonId}")
    public LessonResponse getLesson(@PathVariable String lessonId){
        return lessonService.getLesson(lessonId);
    }
}
