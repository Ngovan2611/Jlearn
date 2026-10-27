import adminApi from "./adminApi";

const adminCourseService = {
    // COURSES
    getAllCourses({ page = 0, size = 10, keyword = "" } = {}) {
        return adminApi.get("/courses", { params: { page, size, keyword } });
    },
    getCourseById(courseId) {
        return adminApi.get(`/courses/${courseId}`);
    },
    createCourse(data) {
        return adminApi.post("/courses", data);
    },
    updateCourse(courseId, data) {
        return adminApi.put(`/courses/${courseId}`, data);
    },
    deleteCourse(courseId) {
        return adminApi.delete(`/courses/${courseId}`);
    },
    toggleCourseStatus(courseId) {
        return adminApi.patch(`/courses/${courseId}/toggle-status`);
    },

    getAllLessonsPaging({ keyword = "", page = 0, size = 10 }) {
        return adminApi.get("/lessons", {
            params: { keyword, page, size }
        });
    },
    getLessonsByCourseId(courseId) {
        return adminApi.get(`/lessons/course/${courseId}`);
    },
    createLesson(data) {
        return adminApi.post("/lessons", data);
    },
    updateLesson(lessonId, data) {
        return adminApi.put(`/lessons/${lessonId}`, data);
    },
    deleteLesson(lessonId) {
        return adminApi.delete(`/lessons/${lessonId}`);
    },
    toggleLessonStatus(lessonId) {
        return adminApi.patch(`/lessons/${lessonId}/toggle-status`);
    }
};

export default adminCourseService;