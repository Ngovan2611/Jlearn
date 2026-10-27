import apiClient from "./apiClients";

const profileService = {
    // Profile của tôi
    getMyProfile() {
        return apiClient.get("/profile/users/me");
    },

    updateMyProfile(data) {
        return apiClient.put("/profile/users/me", data);
    },

    // Profile người khác
    getProfileByUserId(userId) {
        return apiClient.get(`/profile/users/${userId}`);
    },
};

export default profileService;