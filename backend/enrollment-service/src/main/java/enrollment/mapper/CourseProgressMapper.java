package enrollment.mapper;

import enrollment.dto.response.CourseProgressResponse;
import enrollment.entity.CourseProgress;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CourseProgressMapper {

    CourseProgressResponse toResponse(CourseProgress courseProgress);
}