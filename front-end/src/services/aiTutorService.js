
import apiClient from "./apiClients";

const BASE_PATH = "/ai-tutor/v1";

function getErrorMessage(error) {
    if (error.response) {
        return (
            error.response.data?.detail ||
            error.response.data?.message ||
            `Lỗi HTTP ${error.response.status}`
        );
    }

    if (error.code === "ECONNABORTED") {
        return "Yêu cầu quá thời gian chờ.";
    }

    if (error.request) {
        return "Không nhận được phản hồi từ máy chủ AI Tutor.";
    }

    return error.message || "Đã xảy ra lỗi không xác định.";
}

const aiTutorService = {
    // Lấy danh sách hội thoại.
    async getConversations() {
        try {
            const response = await apiClient.get(
                `${BASE_PATH}/conversations`
            );

            return response.data;
        } catch (error) {
            console.error(
                "[AI Tutor] getConversations:",
                getErrorMessage(error)
            );
            throw error;
        }
    },

    // Tạo hội thoại với tiêu đề được truyền từ frontend.
    async createConversation(title = "Cuộc trò chuyện mới") {
        const normalizedTitle =
            typeof title === "string" ? title.trim() : "";

        if (!normalizedTitle) {
            throw new Error("Tiêu đề hội thoại không được để trống.");
        }

        try {
            const response = await apiClient.post(
                `${BASE_PATH}/conversations`,
                {
                    title: normalizedTitle,
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                "[AI Tutor] createConversation:",
                getErrorMessage(error)
            );
            throw error;
        }
    },

    // Lấy lịch sử tin nhắn của một hội thoại.
    async getMessages(conversationId) {
        if (!conversationId) {
            throw new Error("conversationId không được để trống.");
        }

        try {
            const response = await apiClient.get(
                `${BASE_PATH}/conversations/${encodeURIComponent(
                    conversationId
                )}/messages`
            );

            return response.data;
        } catch (error) {
            console.error(
                "[AI Tutor] getMessages:",
                getErrorMessage(error)
            );
            throw error;
        }
    },

    // Gửi câu hỏi và lưu cả câu hỏi, câu trả lời vào lịch sử.
    async sendMessage(conversationId, question) {
        const content =
            typeof question === "string" ? question.trim() : "";

        if (!conversationId) {
            throw new Error("Vui lòng chọn hoặc tạo cuộc trò chuyện.");
        }

        if (!content) {
            throw new Error("Vui lòng nhập câu hỏi.");
        }

        try {
            const response = await apiClient.post(
                `${BASE_PATH}/conversations/${encodeURIComponent(
                    conversationId
                )}/messages`,
                {
                    question: content,
                },
                {
                    timeout: 120000,
                }
            );

            console.log(
                "[AI Tutor] Save message response:",
                response.status,
                response.data
            );

            return response.data;
        } catch (error) {
            console.error(
                "[AI Tutor] sendMessage:",
                getErrorMessage(error)
            );
            throw error;
        }
    },
};

export default aiTutorService;
