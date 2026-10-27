import apiClient from "./apiClients";

const courseService = {
    getAllCourses: (params = {}) =>
    apiClient.get("/courses", {
        params: {
            keyword: params.keyword ?? "",
            page: params.page ?? 0,
            size: params.size ?? 8,
        },
    }),

    getCoursesByCategory(categoryId) {
        return apiClient.get(`/course/courses/category/${categoryId}`);
    },

    getCourseById(courseId) {
        return apiClient.get(`/courses/${courseId}`);
    },

    getLessonById(lessonId) {
        return apiClient.get(`/lessons/${lessonId}`);
    },

    getLessonsByCourse(courseId) {
        return apiClient.get(`/lessons/course/${courseId}`);
    },
};

export default courseService;