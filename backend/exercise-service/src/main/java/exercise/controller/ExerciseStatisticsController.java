
package exercise.controller;

import exercise.service.ExerciseStatisticsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/exercises/statistics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseStatisticsController {

    ExerciseStatisticsService statisticsService;

    @GetMapping
    public Object getStatistics() {
        return statisticsService.getStatistics();
    }
}
