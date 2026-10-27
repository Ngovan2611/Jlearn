package course.service;

import course.dto.request.CourseRequest;
import course.dto.response.CourseResponse;
import course.dto.response.PageResponse;
import course.entity.Course;
import course.exception.AppException;
import course.exception.ErrorCode;
import course.mapper.CourseMapper;
import course.repository.CourseRepository;
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
public class CourseService {

    CourseRepository courseRepository;
    CourseMapper courseMapper;

    // Phân trang & Tìm kiếm khóa học
    public PageResponse<CourseResponse> getAllCoursesPaging(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String searchKeyword = (keyword != null) ? keyword.trim() : "";

        Page<Course> coursePage = courseRepository.searchCourses(searchKeyword, pageable);

        List<CourseResponse> content = coursePage.getContent().stream()
                .map(courseMapper::toResponse)
                .toList();

        return PageResponse.<CourseResponse>builder()
                .currentPage(page)
                .pageSize(coursePage.getSize())
                .totalPages(coursePage.getTotalPages())
                .totalElements(coursePage.getTotalElements())
                .data(content)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CourseResponse createCourse(CourseRequest courseRequest) {
        Course courseExisted = courseRepository.findByTitle(courseRequest.getTitle());
        if (courseExisted != null) {
            throw new AppException(ErrorCode.COURSE_EXISTED);
        }

        Course course = courseMapper.toEntity(courseRequest);
        course.setPublished(true);

        return courseMapper.toResponse(courseRepository.save(course));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CourseResponse updateCourse(String id, CourseRequest courseRequest) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_EXISTED));

        courseMapper.updateEntity(courseRequest, course);

        return courseMapper.toResponse(courseRepository.save(course));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteCourse(String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_EXISTED));

        courseRepository.delete(course);
    }

    public List<CourseResponse> getCoursesByCategoryId(String categoryId) {
        List<Course> courses = courseRepository.findByCategoryId(categoryId);
        if (courses.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_NOT_EXISTED);
        }

        return courses.stream()
                .map(courseMapper::toResponse)
                .toList();
    }

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(courseMapper::toResponse)
                .toList();
    }

    public CourseResponse getCourseById(String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_EXISTED));

        return courseMapper.toResponse(course);
    }

    public List<CourseResponse> getAllCoursesPublished() {
        return courseRepository.findByPublishedTrue().stream()
                .map(courseMapper::toResponse)
                .toList();
    }
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CourseResponse toggleCourseStatus(String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_EXISTED));

        // Đảo ngược trạng thái published
        course.setPublished(!course.isPublished());

        return courseMapper.toResponse(courseRepository.save(course));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public long getTotalCourses() {
        return courseRepository.count();
    }

}