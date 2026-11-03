
package submission.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import submission.dto.response.SubmissionActivityResponse;
import submission.dto.response.SubmissionStatisticsResponse;
import submission.entity.Submission;
import submission.enums.GradingStatus;
import submission.repository.SubmissionRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionStatisticsService {

    SubmissionRepository submissionRepository;

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    public SubmissionStatisticsResponse getStatistics() {
        long pending = submissionRepository.countByGradingStatus(
                GradingStatus.PENDING
        );

        long grading = submissionRepository.countByGradingStatus(
                GradingStatus.GRADING
        );

        long completed = submissionRepository.countByGradingStatus(
                GradingStatus.COMPLETED
        );

        long failed = submissionRepository.countByGradingStatus(
                GradingStatus.FAILED
        );

        List<Submission> completedSubmissions =
                submissionRepository.findAll().stream()
                        .filter(s -> s.getGradingStatus()
                                == GradingStatus.COMPLETED)
                        .filter(s -> s.getScore() != null)
                        .toList();

        double averageScore = completedSubmissions.isEmpty()
                ? 0.0
                : completedSubmissions.stream()
                .mapToDouble(Submission::getScore)
                .average()
                .orElse(0.0);

        return SubmissionStatisticsResponse.builder()
                .totalSubmissions(submissionRepository.count())
                .pending(pending)
                .grading(grading)
                .completed(completed)
                .failed(failed)
                .averageScore(Math.round(averageScore * 100.0) / 100.0)
                .build();
    }

    public SubmissionActivityResponse getSubmissionActivity(String period) {
        int days = switch (period) {
            case "7d" -> 7;
            case "30d" -> 30;
            case "90d" -> 90;
            default -> throw new IllegalArgumentException(
                    "Period không hợp lệ. Chỉ chấp nhận 7d, 30d hoặc 90d."
            );
        };

        LocalDate today = LocalDate.now(ZONE);
        LocalDate startDate = today.minusDays(days - 1);

        Instant start = startDate.atStartOfDay(ZONE).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(ZONE).toInstant();

        List<Submission> records =
                submissionRepository.findBySubmittedAtInRange(start, end);

        Map<LocalDate, Long> counts = records.stream()
                .filter(s -> s.getSubmittedAt() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getSubmittedAt()
                                .atZone(ZONE)
                                .toLocalDate(),
                        Collectors.counting()
                ));

        List<String> labels = new ArrayList<>();
        List<Long> submissions = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");

        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);

            labels.add(date.format(formatter));
            submissions.add(counts.getOrDefault(date, 0L));
        }

        return SubmissionActivityResponse.builder()
                .labels(labels)
                .submissions(submissions)
                .build();
    }

}
