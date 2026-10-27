import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });

    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {

        const originalRequest = error.config;

        console.log(
            "Axios error:",
            error.response?.status,
            originalRequest?.url
        );

        // Không phải 401
        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        // Không retry request đã retry
        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        // Không refresh khi chính request refresh bị 401
        if (originalRequest.url?.includes("/auth/refresh")) {
            return Promise.reject(error);
        }

        // Không refresh login
        if (originalRequest.url?.includes("/auth/login")) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // Nếu request khác đang refresh
        if (isRefreshing) {

            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve,
                    reject,
                });
            }).then(() => {
                return apiClient(originalRequest);
            });
        }

        isRefreshing = true;

        try {

            console.log("Access token hết hạn → gọi refresh");

            await apiClient.post("/auth/refresh");

            console.log("Refresh token thành công");

            processQueue(null);

            // Gửi lại request ban đầu
            return apiClient(originalRequest);

        } catch (refreshError) {

            console.error(
                "Refresh token thất bại:",
                refreshError.response?.data
            );

            processQueue(refreshError);

            return Promise.reject(refreshError);

        } finally {
            isRefreshing = false;
        }
    }
);

export default apiClient;