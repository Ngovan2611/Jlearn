import apiClient from "./apiClients";

const authService = {

    login(data) {
        return apiClient.post("/auth/login", data);
    },

    register(data) {
        return apiClient.post("auth/register", data);
    },

    logout() {
        return apiClient.post("/auth/logout");
    },

    refreshToken() {
        return apiClient.post("/auth/refresh");
    },

};

export default authService;