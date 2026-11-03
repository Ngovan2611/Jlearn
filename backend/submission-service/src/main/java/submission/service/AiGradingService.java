package submission.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import submission.dto.request.AiGradingRequest;
import submission.dto.response.AiGradingResponse;
import submission.entity.Submission;
import submission.enums.GradingStatus;
import submission.repository.SubmissionRepository;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiGradingService {

    private final SubmissionRepository submissionRepository;
    private final RestClient aiTutorRestClient;

    @Value("${app.ai-tutor.grade-path}")
    private String gradePath;

    @Async("gradingExecutor")
    public void gradeSubmission(String submissionId) {
        Submission submission = submissionRepository
                .findById(submissionId)
                .orElse(null);

        if (submission == null) {
            return;
        }

        try {
            submission.setGradingStatus(GradingStatus.GRADING);
            submissionRepository.save(submission);

            AiGradingRequest request = AiGradingRequest.builder()
                    .submissionId(submission.getId())
                    .userId(submission.getUserId())
                    .exerciseId(submission.getExerciseId())
                    .sourceCode(submission.getSourceCode() != null ? submission.getSourceCode() : "")
                    .language(submission.getLanguage() != null ? submission.getLanguage() : "java")
                    .maxScore(100)
                    .build();

            log.info("Dispatching AI grading request for submission {} to {}", submissionId, gradePath);

            AiGradingResponse result = aiTutorRestClient.post()
                    .uri(gradePath)
                    .body(request)
                    .retrieve()
                    .body(AiGradingResponse.class);

            if (result == null
                    || result.getScore() == null
                    || result.getScore() < 0
                    || result.getScore() > 100
                    || result.getFeedback() == null
                    || result.getSubmissionId() == null
                    || !submissionId.equals(result.getSubmissionId())) {
                throw new IllegalStateException(
                        "AI Tutor returned an invalid grading result: " + result
                );
            }

            submission.setScore(result.getScore());
            submission.setFeedback(result.getFeedback());
            submission.setGradingStatus(GradingStatus.COMPLETED);
            submission.setGradedAt(Instant.now());

            log.info("AI grading completed successfully for submission {}: score={}", submissionId, result.getScore());

        } catch (Exception exception) {
            log.error("AI grading failed for submission {}: {}", submissionId, exception.getMessage(), exception);
            submission.setGradingStatus(GradingStatus.FAILED);
            submission.setScore(null);
            submission.setFeedback(null);
            submission.setGradedAt(null);
        }

        submissionRepository.save(submission);
    }
}
