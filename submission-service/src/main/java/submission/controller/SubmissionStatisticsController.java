
package submission.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import submission.dto.response.SubmissionActivityResponse;
import submission.dto.response.SubmissionStatisticsResponse;
import submission.service.SubmissionStatisticsService;

@RestController
@RequestMapping("/submissions/statistics")
@RequiredArgsConstructor
public class SubmissionStatisticsController {

    private final SubmissionStatisticsService statisticsService;

    @GetMapping
    public SubmissionStatisticsResponse getStatistics() {
        return statisticsService.getStatistics();
    }

    @GetMapping("/activity")
    public SubmissionActivityResponse getSubmissionActivity(
            @RequestParam(defaultValue = "7d") String period
    ) {
        return statisticsService.getSubmissionActivity(period);
    }
}
