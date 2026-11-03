import adminApi from "./adminApi";

const adminExerciseService = {
    // =========================================================
    // EXERCISES API (Endpoint: /exercises)
    // Response bọc trong ApiResponse<T>
    // =========================================================

    // CREATE EXERCISE
    createExercise(data) {
        return adminApi.post("/exercises", data);
    },

    // GET EXERCISE BY ID
    getExerciseById(exerciseId) {
        return adminApi.get(`/exercises/${exerciseId}`);
    },

    // GET EXERCISES BY LESSON
    getExercisesByLesson(lessonId) {
        return adminApi.get(`/exercises/lesson/${lessonId}`);
    },

    // GET EXERCISES BY COURSE
    getExercisesByCourse(courseId) {
        return adminApi.get(`/exercises/course/${courseId}`);
    },

    // GET FREE PRACTICE EXERCISES
    getFreeExercises() {
        return adminApi.get("/exercises/practice");
    },

    // UPDATE EXERCISE
    updateExercise(exerciseId, data) {
        return adminApi.put(`/exercises/${exerciseId}`, data);
    },

    // DELETE EXERCISE
    deleteExercise(exerciseId) {
        return adminApi.delete(`/exercises/${exerciseId}`);
    },

    // =========================================================
    // TEST CASES API (Endpoint: /exercises/{exerciseId}/test-cases)
    // Controller trả về DTO trực tiếp (List<TestCaseResponse>)
    // =========================================================

    // GET ALL TEST CASES
    getTestCases(exerciseId) {
        return adminApi.get(`/exercises/${exerciseId}/test-cases`);
    },

    // GET TEST CASE BY ID
    getTestCaseById(exerciseId, testCaseId) {
        return adminApi.get(`/exercises/${exerciseId}/test-cases/${testCaseId}`);
    },

    // CREATE TEST CASE
    addTestCase(exerciseId, data) {
        return adminApi.post(`/exercises/${exerciseId}/test-cases`, data);
    },

    // UPDATE TEST CASE
    updateTestCase(exerciseId, testCaseId, data) {
        return adminApi.put(`/exercises/${exerciseId}/test-cases/${testCaseId}`, data);
    },
    // GET ALL EXERCISES WITH FILTERS & PAGINATION
    getAllExercisesPaging({ keyword = "", lessonId = "", difficulty = "", page = 0, size = 10 }) {
        return adminApi.get("/exercises", {
            params: {
                keyword: keyword || undefined,
                lessonId: lessonId || undefined,
                difficulty: (difficulty && difficulty !== "ALL") ? difficulty : undefined,
                page,
                size
            }
        });
    },

    // DELETE TEST CASE
    deleteTestCase(exerciseId, testCaseId) {
        return adminApi.delete(`/exercises/${exerciseId}/test-cases/${testCaseId}`);
    }
    
};

export default adminExerciseService;