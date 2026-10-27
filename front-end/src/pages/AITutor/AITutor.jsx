
import { useEffect, useRef, useState } from "react";
import {
    faBars,
    faBrain,
    faChevronDown,
    faCode,
    faGraduationCap,
    faHistory,
    faLightbulb,
    faMessage,
    faPaperPlane,
    faPlus,
    faRobot,
    faUser,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import aiTutorService from "../../services/aiTutorService";
import "./AITutor.css";

const suggestions = [
    {
        icon: faCode,
        title: "Spring Boot",
        description: "Giải thích Dependency Injection trong Spring",
    },
    {
        icon: faBrain,
        title: "Thuật toán",
        description: "Hướng dẫn cách giải bài toán bằng Java",
    },
    {
        icon: faGraduationCap,
        title: "Lộ trình học",
        description: "Lập kế hoạch học Java Backend",
    },
];

function createMessageId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
}

function getConversation(data) {
    return data?.result ?? data;
}

function getErrorMessage(error, fallback) {
    return (
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        fallback
    );
}

// Sinh tiêu đề từ câu hỏi đầu tiên.
function generateConversationTitle(question) {
    const normalized = question.replace(/\s+/g, " ").trim();
    const maxLength = 50;

    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function normalizeMessages(data, conversationId) {
    return getList(data).map((item, index) => ({
        id: item.id ?? `${conversationId}-${index}`,
        role: item.role,
        content: item.content,
    }));
}

function AITutor() {
    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [error, setError] = useState("");

    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const activeIdRef = useRef(null);
    const loadingRef = useRef(false);
    const historyRequestRef = useRef(0);

    // Cuộn xuống tin nhắn mới nhất.
    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    // Tải danh sách hội thoại khi component khởi tạo.
    useEffect(() => {
        let cancelled = false;

        async function fetchConversations() {
            try {
                const data = await aiTutorService.getConversations();

                if (!cancelled) {
                    setConversations(getList(data));
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "[AI Tutor] Load conversations:",
                        err
                    );

                    setError(
                        getErrorMessage(
                            err,
                            "Không thể tải danh sách hội thoại."
                        )
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingHistory(false);
                }
            }
        }

        void fetchConversations();

        return () => {
            cancelled = true;
        };
    }, []);

    // Tạo khung chat mới.
    // Chưa gọi API tạo hội thoại cho đến khi gửi câu hỏi đầu tiên.
    function createConversation() {
        if (loadingRef.current) return;

        historyRequestRef.current += 1;

        activeIdRef.current = null;
        setActiveId(null);
        setMessages([]);
        setQuestion("");
        setError("");

        inputRef.current?.focus();
    }

    // Mở hội thoại và tải lịch sử tin nhắn.
    async function openConversation(conversation) {
        if (!conversation?.id || loadingRef.current) return;

        const conversationId = conversation.id;
        const requestId = ++historyRequestRef.current;

        activeIdRef.current = conversationId;
        setActiveId(conversationId);
        setMessages([]);
        setError("");

        try {
            const data =
                await aiTutorService.getMessages(conversationId);

            // Bỏ qua kết quả cũ nếu người dùng đã chuyển hội thoại.
            if (
                requestId !== historyRequestRef.current ||
                activeIdRef.current !== conversationId
            ) {
                return;
            }

            setMessages(normalizeMessages(data, conversationId));
        } catch (err) {
            if (requestId === historyRequestRef.current) {
                console.error("[AI Tutor] Load messages:", err);

                setError(
                    getErrorMessage(
                        err,
                        "Không thể tải lịch sử tin nhắn."
                    )
                );
            }
        }
    }

    // Gửi câu hỏi tới AI Tutor.
    async function sendMessage(text = question) {
        const content =
            typeof text === "string" ? text.trim() : "";

        if (!content || loadingRef.current) return;

        setError("");

        loadingRef.current = true;
        setLoading(true);
        setQuestion("");

        const userMessageId = createMessageId("user");
        let conversationId = activeIdRef.current;

        // Hiển thị câu hỏi ngay lập tức.
        setMessages((previous) => [
            ...previous,
            {
                id: userMessageId,
                role: "user",
                content,
            },
        ]);

        try {
            // Nếu chưa có hội thoại, tạo với tiêu đề từ câu hỏi đầu tiên.
            if (!conversationId) {
                const title = generateConversationTitle(content);

                const data =
                    await aiTutorService.createConversation(title);

                const conversation = getConversation(data);
                conversationId = conversation?.id;

                if (!conversationId) {
                    throw new Error(
                        "API không trả về ID hội thoại."
                    );
                }

                activeIdRef.current = conversationId;
                setActiveId(conversationId);

                setConversations((previous) => [
                    conversation,
                    ...previous.filter(
                        (item) => item.id !== conversationId
                    ),
                ]);
            }

            console.log("[AI Tutor] Sending:", {
                conversation_id: conversationId,
                question: content,
            });

            // Endpoint này lưu cả câu hỏi và câu trả lời vào lịch sử.
            const response = await aiTutorService.sendMessage(
                conversationId,
                content
            );

            console.log("[AI Tutor] Response:", response);

            const result = getConversation(response);

            const answer =
                result?.assistant_message?.content ??
                result?.answer ??
                result?.content;

            if (typeof answer !== "string" || !answer.trim()) {
                throw new Error(
                    "API không trả về câu trả lời hợp lệ."
                );
            }

            // Chỉ cập nhật giao diện nếu vẫn đang mở hội thoại này.
            if (activeIdRef.current === conversationId) {
                const assistantMessage = {
                    id:
                        result?.assistant_message?.id ??
                        createMessageId("assistant"),
                    role: "assistant",
                    content: answer,
                };

                setMessages((previous) => [
                    ...previous,
                    assistantMessage,
                ]);

                // Đồng bộ lịch sử từ backend.
                try {
                    const historyData =
                        await aiTutorService.getMessages(
                            conversationId
                        );

                    if (
                        activeIdRef.current === conversationId
                    ) {
                        const history = normalizeMessages(
                            historyData,
                            conversationId
                        );

                        if (history.length > 0) {
                            setMessages(history);
                        }
                    }
                } catch (historyError) {
                    console.error(
                        "[AI Tutor] Refresh history:",
                        historyError
                    );
                }
            }

            // Cập nhật danh sách hội thoại.
            try {
                const conversationData =
                    await aiTutorService.getConversations();

                setConversations(getList(conversationData));
            } catch (refreshError) {
                console.error(
                    "[AI Tutor] Refresh conversations:",
                    refreshError
                );
            }
        } catch (err) {
            console.error(
                "[AI Tutor] Send message failed:",
                err
            );

            setError(
                getErrorMessage(err, "Không thể gửi câu hỏi.")
            );
        } finally {
            loadingRef.current = false;
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        void sendMessage();
    }

    return (
        <div className="ai-tutor">
            <aside
                className={`ai-sidebar ${
                    sidebarOpen ? "" : "collapsed"
                }`}
            >
                <div className="ai-brand">
                    <div className="ai-brand-icon">
                        <FontAwesomeIcon icon={faBrain} />
                    </div>

                    {sidebarOpen && (
                        <div>
                            <strong>JLearn</strong>
                            <span>AI TUTOR</span>
                        </div>
                    )}

                    <button
                        type="button"
                        className="neu-icon-btn sidebar-toggle"
                        onClick={() =>
                            setSidebarOpen((value) => !value)
                        }
                        aria-label="Thu gọn sidebar"
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                </div>

                <button
                    type="button"
                    className="new-chat-btn"
                    onClick={createConversation}
                    disabled={loading}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    {sidebarOpen && (
                        <span>Cuộc trò chuyện mới</span>
                    )}
                </button>

                {sidebarOpen && (
                    <>
                        <div className="sidebar-section-title">
                            <FontAwesomeIcon icon={faHistory} />
                            <span>LỊCH SỬ GẦN ĐÂY</span>
                        </div>

                        <div className="conversation-list">
                            {loadingHistory ? (
                                <p className="sidebar-empty">
                                    Đang tải...
                                </p>
                            ) : conversations.length === 0 ? (
                                <p className="sidebar-empty">
                                    Chưa có hội thoại nào.
                                </p>
                            ) : (
                                conversations.map((conversation) => (
                                    <button
                                        type="button"
                                        key={conversation.id}
                                        className={`conversation-item ${
                                            activeId === conversation.id
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            void openConversation(
                                                conversation
                                            )
                                        }
                                        title={conversation.title}
                                    >
                                        <FontAwesomeIcon
                                            icon={faMessage}
                                        />
                                        <span>
                                            {conversation.title}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="sidebar-bottom">
                            <div className="sidebar-tip">
                                <FontAwesomeIcon icon={faLightbulb} />
                                <div>
                                    <strong>Mẹo học tập</strong>
                                    <p>
                                        Hãy hỏi AI giải thích từng bước
                                        để hiểu sâu hơn.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </aside>

            <main className="ai-main">
                <header className="ai-topbar">
                    <div>
                        <span className="breadcrumb">JLearn</span>
                        <span className="breadcrumb-separator">
                            /
                        </span>
                        <strong>AI Tutor</strong>
                    </div>

                    <div className="ai-status">
                        <span className="status-dot" />
                        Trợ lý học tập
                        <FontAwesomeIcon icon={faChevronDown} />
                    </div>
                </header>

                <section className="ai-chat">
                    {messages.length === 0 ? (
                        <div className="ai-welcome">
                            <div className="welcome-orb">
                                <FontAwesomeIcon
                                    icon={faWandMagicSparkles}
                                />
                            </div>

                            <span className="welcome-eyebrow">
                                YOUR PERSONAL AI MENTOR
                            </span>

                            <h1>
                                Xin chào, bạn muốn
                                <br />
                                <span>học gì hôm nay?</span>
                            </h1>

                            <p className="welcome-description">
                                Mình là AI Tutor của JLearn. Hãy hỏi
                                bất cứ điều gì về Java, Spring Boot
                                hoặc lập trình. Mình sẽ đồng hành
                                cùng bạn.
                            </p>

                            <div className="suggestion-grid">
                                {suggestions.map((item) => (
                                    <button
                                        type="button"
                                        className="suggestion-card"
                                        key={item.title}
                                        disabled={loading}
                                        onClick={() =>
                                            void sendMessage(
                                                item.description
                                            )
                                        }
                                    >
                                        <div className="suggestion-icon">
                                            <FontAwesomeIcon
                                                icon={item.icon}
                                            />
                                        </div>
                                        <strong>{item.title}</strong>
                                        <p>{item.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="message-list">
                            {messages.map((message) => (
                                <article
                                    className={`message-row ${
                                        message.role === "user"
                                            ? "user-message"
                                            : "assistant-message"
                                    }`}
                                    key={message.id}
                                >
                                    <div className="message-avatar">
                                        <FontAwesomeIcon
                                            icon={
                                                message.role === "user"
                                                    ? faUser
                                                    : faRobot
                                            }
                                        />
                                    </div>

                                    <div className="message-content">
                                        <strong>
                                            {message.role === "user"
                                                ? "Bạn"
                                                : "JLearn AI"}
                                        </strong>
                                        <p>{message.content}</p>
                                    </div>
                                </article>
                            ))}

                            {loading && (
                                <div className="typing-indicator">
                                    <span />
                                    <span />
                                    <span />
                                    <small>
                                        AI Tutor đang suy nghĩ...
                                    </small>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>
                    )}

                    {error && (
                        <div className="ai-error" role="alert">
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={() => setError("")}
                                aria-label="Đóng thông báo lỗi"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                    )}

                    <div className="composer-area">
                        <form
                            className="chat-composer"
                            onSubmit={handleSubmit}
                        >
                            <textarea
                                ref={inputRef}
                                value={question}
                                onChange={(event) =>
                                    setQuestion(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" &&
                                        !event.shiftKey
                                    ) {
                                        event.preventDefault();

                                        if (!loadingRef.current) {
                                            void sendMessage();
                                        }
                                    }
                                }}
                                placeholder="Đặt câu hỏi cho AI Tutor..."
                                rows={2}
                                maxLength={10000}
                                disabled={loading}
                            />

                            <div className="composer-footer">
                                <span>
                                    <FontAwesomeIcon
                                        icon={faWandMagicSparkles}
                                    />
                                    AI có thể mắc lỗi. Hãy kiểm tra
                                    thông tin.
                                </span>

                                <button
                                    className="send-btn"
                                    type="submit"
                                    disabled={
                                        !question.trim() || loading
                                    }
                                    aria-label="Gửi câu hỏi"
                                >
                                    <FontAwesomeIcon
                                        icon={faPaperPlane}
                                    />
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AITutor;
