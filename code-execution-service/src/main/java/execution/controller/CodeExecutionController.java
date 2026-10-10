package execution.controller;

import execution.dto.request.CodeExecutionRequest;
import execution.dto.response.CodeExecutionResponse;
import execution.mapper.CodeExecutionMapper;
import execution.model.CodeExecutionCommand;
import execution.model.CodeExecutionResult;
import execution.service.CodeExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/code")
@RequiredArgsConstructor
public class CodeExecutionController {

    private final CodeExecutionService codeExecutionService;

    private final CodeExecutionMapper codeExecutionMapper;

    @PostMapping("/execute")
    public CodeExecutionResponse execute(
            @RequestBody @Valid CodeExecutionRequest request
    ) {

        CodeExecutionCommand command =
                codeExecutionMapper.toCommand(request);

        CodeExecutionResult result =
                codeExecutionService.execute(command);

        return codeExecutionMapper.toResponse(result);
    }
}