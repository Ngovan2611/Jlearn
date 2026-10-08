package enrollment.controller;

import enrollment.dto.response.ApiResponse;
import enrollment.dto.response.EnrollmentResponse;
import enrollment.service.EnrollmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/enrollments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EnrollmentController {

    EnrollmentService enrollmentService;

    @PostMapping("/{courseId}")
    public ApiResponse<EnrollmentResponse> enroll(
            @PathVariable String courseId
    ) {

        return ApiResponse.<EnrollmentResponse>builder()
                .code(200)
                .message("Enrollment successful")
                .result(
                        enrollmentService.enroll(courseId)
                )
                .build();
    }

    @GetMapping("/{enrollmentId}")
    public ApiResponse<EnrollmentResponse> getEnrollment(
            @PathVariable String enrollmentId
    ) {

        return ApiResponse.<EnrollmentResponse>builder()
                .code(200)
                .result(
                        enrollmentService
                                .getEnrollment(enrollmentId)
                )
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<List<EnrollmentResponse>> getMyEnrollments() {

        return ApiResponse.<List<EnrollmentResponse>>builder()
                .code(200)
                .result(
                        enrollmentService
                                .getMyEnrollments()
                )
                .build();
    }

    @GetMapping("/course/{courseId}")
    public ApiResponse<List<EnrollmentResponse>> getByCourse(
            @PathVariable String courseId
    ) {

        return ApiResponse.<List<EnrollmentResponse>>builder()
                .code(200)
                .result(
                        enrollmentService
                                .getEnrollmentsByCourse(courseId)
                )
                .build();
    }

    @DeleteMapping("/{enrollmentId}")
    public ApiResponse<Void> cancelEnrollment(
            @PathVariable String enrollmentId
    ) {

        enrollmentService.cancelEnrollment(
                enrollmentId
        );

        return ApiResponse.<Void>builder()
                .code(200)
                .message("Enrollment cancelled")
                .build();
    }
}