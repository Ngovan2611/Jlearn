package enrollment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentStatisticsResponse {

    private String courseId;
    private String courseTitle;
    private String thumbnail;

    // Thống kê lượt đăng ký
    private long enrollmentCount;
    private long totalEnrollments;
    private double enrollmentShare;

    // Thống kê hoàn thành khóa học
    private long completedCount;
    private double completionRate;
}
