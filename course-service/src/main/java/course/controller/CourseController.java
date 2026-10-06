package course.controller;

import course.dto.request.CourseRequest;
import course.dto.response.ApiResponse;
import course.dto.response.CourseResponse;
import course.service.CourseService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CourseController {

    CourseService courseService;

    @PostMapping
    public ApiResponse<CourseResponse> createCourse(
            @RequestBody @Valid CourseRequest request
    ) {
        return ApiResponse.<CourseResponse>builder()
                .result(courseService.createCourse(request))
                .build();
    }

    @PutMapping("/{courseId}")
    public ApiResponse<CourseResponse> updateCourse(
            @PathVariable String courseId,
            @RequestBody @Valid CourseRequest request
    ) {
        return ApiResponse.<CourseResponse>builder()
                .result(courseService.updateCourse(courseId, request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<CourseResponse>> getAllCourses() {
        return ApiResponse.<List<CourseResponse>>builder()
                .result(courseService.getAllCourses())
                .build();
    }

    @GetMapping("/category/{categoryId}")
    public ApiResponse<List<CourseResponse>> getCoursesByCategory(
            @PathVariable String categoryId
    ) {
        return ApiResponse.<List<CourseResponse>>builder()
                .result(courseService.getCoursesByCategoryId(categoryId))
                .build();
    }

    @GetMapping("/{courseId}")
    public ApiResponse<CourseResponse> getCourseById(@PathVariable String courseId) {
        return ApiResponse.<CourseResponse>builder()
                .code(200)
                .result(courseService.getCourseById(courseId))
                .build();
    }
}