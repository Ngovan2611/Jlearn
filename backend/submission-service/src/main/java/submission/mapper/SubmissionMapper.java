package submission.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import submission.dto.request.SubmissionRequest;
import submission.dto.response.SubmissionResponse;
import submission.entity.Submission;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {

    SubmissionResponse toResponse(Submission submission);

    List<SubmissionResponse> toResponseList(List<Submission> submissions);

    // Map đầy đủ các trường từ Request sang Entity mới
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "gradingStatus", ignore = true)
    @Mapping(target = "score", ignore = true)
    @Mapping(target = "feedback", ignore = true)
    @Mapping(target = "submittedAt", ignore = true)
    @Mapping(target = "gradedAt", ignore = true)
    Submission toEntity(SubmissionRequest request);

    // Map/Update toàn bộ các trường từ Request vào Entity đã tồn tại
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "gradingStatus", ignore = true)
    @Mapping(target = "score", ignore = true)
    @Mapping(target = "feedback", ignore = true)
    @Mapping(target = "submittedAt", ignore = true)
    @Mapping(target = "gradedAt", ignore = true)
    void updateEntityFromRequest(SubmissionRequest request, @MappingTarget Submission submission);
}