package course.controller;

import course.dto.request.CourseRequest;
import course.dto.response.ApiResponse;
import course.dto.response.CourseResponse;
import course.dto.response.PageResponse;
import course.service.CourseService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CourseController {

    CourseService courseService;

    @GetMapping
    public ApiResponse<PageResponse<CourseResponse>> getAllCourses(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        PageResponse<CourseResponse> result =
                courseService.getAllCoursesPaging(keyword, page, size);

        return ApiResponse.<PageResponse<CourseResponse>>builder()
                .code(200)
                .result(result)
                .build();
    }

    @PostMapping
    public ApiResponse<CourseResponse> createCourse(
            @RequestBody @Valid CourseRequest request
    ) {
        return ApiResponse.<CourseResponse>builder()
                .code(200)
                .result(courseService.createCourse(request))
                .build();
    }

    @PutMapping("/{courseId}")
    public ApiResponse<CourseResponse> updateCourse(
            @PathVariable String courseId,
            @RequestBody @Valid CourseRequest request
    ) {
        return ApiResponse.<CourseResponse>builder()
                .code(200)
                .result(courseService.updateCourse(courseId, request))
                .build();
    }

    @DeleteMapping("/{courseId}")
    public ApiResponse<Void> deleteCourse(@PathVariable String courseId) {
        courseService.deleteCourse(courseId);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Course deleted successfully")
                .build();
    }

    @GetMapping("/category/{categoryId}")
    public ApiResponse<List<CourseResponse>> getCoursesByCategory(
            @PathVariable String categoryId
    ) {
        return ApiResponse.<List<CourseResponse>>builder()
                .code(200)
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
    @PatchMapping("/{courseId}/toggle-status")
    public ApiResponse<CourseResponse> toggleCourseStatus(@PathVariable String courseId) {
        return ApiResponse.<CourseResponse>builder()
                .code(200)
                .result(courseService.toggleCourseStatus(courseId))
                .build();
    }

    @GetMapping("/statistics")
    public ApiResponse<Long> getStatistics() {
        return ApiResponse.<Long>builder()
                .code(200)
                .result(courseService.getTotalCourses())
                .build();
    }

}