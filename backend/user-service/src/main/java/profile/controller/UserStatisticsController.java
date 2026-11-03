package profile.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import profile.dto.response.UserStatisticsResponse;
import profile.service.UserStatisticsService;

import java.util.Map;

@RestController
@RequestMapping("/users/statistics")
@RequiredArgsConstructor
public class UserStatisticsController {

    private final UserStatisticsService userStatisticsService;


    @GetMapping
    public UserStatisticsResponse getStatistics() {
        return userStatisticsService.getStatistics();
    }

    @GetMapping("/gender")
    public Map<String, Long> getGenderStatistics() {
        return userStatisticsService.getStatistics()
                .getGenderDistribution();
    }
}
