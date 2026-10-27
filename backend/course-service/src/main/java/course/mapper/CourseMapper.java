package course.mapper;


import course.dto.request.CourseRequest;
import course.dto.response.CourseResponse;
import course.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    Course toEntity(CourseRequest courseRequest);
    CourseResponse toResponse(Course course);

    void updateEntity(CourseRequest course, @MappingTarget Course updatedCourse);

}
