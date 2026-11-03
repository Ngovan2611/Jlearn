import apiClient from "./apiClients";

const enrollmentService = {
    enroll(courseId) {
        return apiClient.post(`/enrollments/${courseId}`);
    },

    getMyEnrollments() {
        return apiClient.get("/enrollments/me");
    },

    getEnrollment(enrollmentId) {
        return apiClient.get(`/enrollments/${enrollmentId}`);
    },

    cancelEnrollment(enrollmentId) {
        return apiClient.delete(`/enrollments/${enrollmentId}`);
    },

    getProgress(courseId) {
        return apiClient.get(`/progress/${courseId}`);
    },

    getMyProgress() {
        return apiClient.get("/progress/me");
    },

    updateLessonProgress(courseId, lessonId) {
    return apiClient.put(`/progress/${courseId}`, {
        lessonId,
    });
}
};

export default enrollmentService;