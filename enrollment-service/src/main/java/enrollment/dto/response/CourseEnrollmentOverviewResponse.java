package enrollment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentOverviewResponse {

    private long totalEnrollments;
    private long totalCoursesWithEnrollments;
    private List<CourseEnrollmentStatisticsResponse> courses;
}