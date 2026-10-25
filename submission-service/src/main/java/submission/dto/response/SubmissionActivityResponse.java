package submission.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SubmissionActivityResponse {

    private List<String> labels;

    private List<Long> submissions;
}