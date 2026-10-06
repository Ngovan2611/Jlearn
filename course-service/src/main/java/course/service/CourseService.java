package course.service;

import course.dto.request.CourseRequest;
import course.dto.response.CourseResponse;
import course.entity.Course;
import course.exception.AppException;
import course.exception.ErrorCode;
import course.mapper.CourseMapper;
import course.repository.CourseRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor

public class CourseService {
    CourseRepository courseRepository;
    CourseMapper courseMapper;


    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse createCourse(CourseRequest courseRequest)
    {
        Course courseExisted = courseRepository.findByTitle(courseRequest.getTitle());
        if(courseExisted != null) {
            throw new AppException(ErrorCode.COURSE_EXISTED);
        }

        Course course = courseMapper.toEntity(courseRequest);

        return  courseMapper.toResponse(courseRepository.save(course));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse updateCourse(String id, CourseRequest courseRequest)
    {
        Course course = courseRepository.findById(id).orElseThrow(
                () -> new AppException(ErrorCode.COURSE_NOT_EXISTED));

        courseMapper.updateEntity(courseRequest, course);
        return  courseMapper.toResponse(courseRepository.save(course));
    }



    public List<CourseResponse> getCoursesByCategoryId(String categoryId)
    {
        List<Course> courses = courseRepository.findByCategoryId(categoryId);
        if(courses.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_NOT_EXISTED);
        }

        return courses.stream()
                .map(courseMapper::toResponse).toList();
    }


    public List<CourseResponse> getAllCourses()
    {
        List<Course> courses = courseRepository.findAll();
        return  courses.stream()
                .map(courseMapper::toResponse).toList();
    }

    public CourseResponse getCourseById(String id) {
        Course course = courseRepository.findById(id).orElseThrow(
                () -> new AppException(ErrorCode.COURSE_NOT_EXISTED));

        return courseMapper.toResponse(course);
    }
}
