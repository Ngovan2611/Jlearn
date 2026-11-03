
import adminApi from "./adminApi";

const adminDashboardService = {


    getCourseStatistics() {
        return adminApi.get("/courses/statistics");
    },

    getExerciseStatistics() {
        return adminApi.get("/exercises/statistics");
    },

    getSubmissionStatistics() {
        return adminApi.get("/submissions/statistics");
    },

    getSubmissionActivity(period = "7d") {
        return adminApi.get("/submissions/statistics/activity", {
            params: { period },
        });
    },

    getUserStatistics() {
        return adminApi.get("/profile/users/statistics");
    },

    getGenderStatistics() {
        return adminApi.get("/profile/users/statistics/gender");
    },
    getCourseEnrollmentStatistics() {
    return adminApi.get("/enrollments/statistics/courses");
},
    getEnrollmentStatistics: () =>
        adminApi.get("/enrollments/statistics"),
    getOverviewStatistics() {
        return Promise.allSettled([
            this.getUserStatistics(),
            this.getCourseStatistics(),
            this.getExerciseStatistics(),
            this.getSubmissionStatistics(),
        ]);
    },
};

export default adminDashboardService;
