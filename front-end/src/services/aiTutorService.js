
import apiClient from "./apiClients";

const BASE_PATH = "/ai-tutor/v1";

function getErrorMessage(error) {
    if (!error.response || error.code === "ERR_NETWORK") {
        return "Không thể kết nối tới máy chủ.";
    }

    if (error.response?.status === 503 || error.response?.status === 502) {
        return "Không thể kết nối tới máy chủ.";
    }

    return (
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Không thể xử lý yêu cầu, vui lòng thử lại."
    );
}

const aiTutorService = {
    // Lấy danh sách hội thoại có phân trang (mặc định 20 cuộc trò chuyện gần nhất).
    async getConversations(options = {}) {
        const { limit = 20, skip = 0 } = options;
        try {
            const response = await apiClient.get(
                `${BASE_PATH}/conversations`,
                {
                    params: { limit, skip },
                }
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

    // Lấy lịch sử tin nhắn của một hội thoại theo phân trang con trỏ (mặc định 20 tin nhắn gần nhất).
    async getMessages(conversationId, options = {}) {
        if (!conversationId) {
            throw new Error("conversationId không được để trống.");
        }

        const { limit = 20, before_id = null } = options;
        const params = { limit };
        if (before_id) {
            params.before_id = before_id;
        }

        try {
            const response = await apiClient.get(
                `${BASE_PATH}/conversations/${encodeURIComponent(
                    conversationId
                )}/messages`,
                { params }
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

    // Phân tích lỗi code từ console (Use Case b)
    async analyzeError(sourceCode, errorMessage, language = "java") {
        const code = typeof sourceCode === "string" ? sourceCode.trim() : "";
        const error = typeof errorMessage === "string" ? errorMessage.trim() : "";

        if (!code || !error) {
            throw new Error("Vui lòng nhập câu hỏi.");
        }

        try {
            const response = await apiClient.post(
                `${BASE_PATH}/tutor/analyze-error`,
                {
                    source_code: code,
                    error_message: error,
                    language: language,
                },
                {
                    timeout: 60000,
                }
            );
            return response.data;
        } catch (err) {
            console.error(
                "[AI Tutor] analyzeError:",
                getErrorMessage(err)
            );
            throw err;
        }
    },
};

export default aiTutorService;
