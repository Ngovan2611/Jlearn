import apiClient from "./apiClients";

const exerciseService = {
    getExercisesByLesson(lessonId) {
        return apiClient.get(`/exercises/lesson/${lessonId}`);
    },

    getExerciseById(exerciseId) {
        return apiClient.get(`/exercises/${exerciseId}`);
    },

    getExercisesByCourse(courseId) {
        return apiClient.get(`/exercises/course/${courseId}`);
    },

    getTestCases(exerciseId) {
        return apiClient.get(
            `/exercises/${exerciseId}/test-cases`
        );
    },
    getFreeExercises: (params = {}) =>
    apiClient.get("/exercises/practice", { params }),
};

export default exerciseService;