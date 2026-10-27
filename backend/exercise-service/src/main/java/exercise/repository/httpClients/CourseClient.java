package exercise.repository.httpClients;

import exercise.dto.response.CourseResponse;
import exercise.dto.response.LessonResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "course-service",
        url = "${course-service.url}"
)
public interface CourseClient {

    @GetMapping("internal/courses/{courseId}")
    CourseResponse getCourse(
            @PathVariable String courseId
    );

    @GetMapping("internal/lessons/{lessonId}")
    LessonResponse getLesson(
            @PathVariable String lessonId
    );
}