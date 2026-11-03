package execution.mapper;

import execution.dto.request.CodeExecutionRequest;
import execution.dto.response.CodeExecutionResponse;
import execution.model.CodeExecutionCommand;
import execution.model.CodeExecutionResult;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CodeExecutionMapper {

    CodeExecutionCommand toCommand(
            CodeExecutionRequest request
    );

    CodeExecutionResponse toResponse(
            CodeExecutionResult result
    );
}