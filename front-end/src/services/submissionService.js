import axiosClient from "./apiClients"; // Sử dụng axiosClient đã cấu hình sẵn Bearer Token

const submissionService = {
    submit: (data) => {
        // payload: { exerciseId, sourceCode, language }
        return axiosClient.post("/submissions", data);
    },

    getSubmissionById: (submissionId) => {
        return axiosClient.get(`/submissions/${submissionId}`);
    },

    getMySubmissions: () => {
        return axiosClient.get("/submissions/me");
    },

    getMyExerciseSubmissions: (exerciseId) => {
        return axiosClient.get(`/submissions/me/exercises/${exerciseId}`);
    },
    getMySubmissionByExercise: (exerciseId) => {
        return axiosClient.get(`/submissions/exercises/${exerciseId}/latest`);
    }
};

export default submissionService;