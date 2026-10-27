
import adminApi from "./adminApi";

const adminStatService = {
    getOverview() {
        return adminApi.get("/api/admin/statistics/overview");
    },
};

export default adminStatService;
