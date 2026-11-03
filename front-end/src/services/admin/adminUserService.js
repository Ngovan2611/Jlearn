import adminApi from "./adminApi";

const adminUserService = {
    getAllBasic(params = {}) {
        const query = new URLSearchParams();
        if (params.keyword) query.set("keyword", params.keyword.trim());
        if (params.page !== undefined) query.set("page", params.page);
        if (params.size !== undefined) query.set("size", params.size);

        const queryString = query.toString() ? `?${query.toString()}` : "";
        return adminApi.get(`/admin/users${queryString}`);
    },

    updateStatus(accountId, status) {
        return adminApi.patch(`/admin/users/${accountId}/status`, { status });
    },

    getProfileByUserId(userId) {
        return adminApi.get(`/profile/users/${userId}`);
    }
};

export default adminUserService;