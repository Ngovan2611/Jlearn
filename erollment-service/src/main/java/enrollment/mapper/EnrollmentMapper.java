package enrollment.mapper;

import enrollment.dto.response.EnrollmentResponse;
import enrollment.entity.Enrollment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EnrollmentMapper {

    @Mapping(target = "courseTitle", source = "courseTitle")
    EnrollmentResponse toResponse(
            Enrollment enrollment,
            String courseTitle
    );
}