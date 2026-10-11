package enrollment.repository.httpClient;

import enrollment.dto.response.CourseResponse;
import enrollment.dto.response.LessonResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(
        name = "course-service",
        url = "${course-service.url}"
)
public interface CourseClient {

    @GetMapping("/internal/courses/{courseId}")
    CourseResponse getCourse(
            @PathVariable("courseId") String courseId
    );

    @GetMapping("/internal/lessons/course/{courseId}")
    List<LessonResponse> getLessonsByCourse(
            @PathVariable("courseId") String courseId
    );
}