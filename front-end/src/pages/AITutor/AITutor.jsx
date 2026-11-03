import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
    faBug,
    faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import aiTutorService from "../../services/aiTutorService";
import "./AITutor.css";

const PAGE_SIZE_MESSAGES = 20;
const PAGE_SIZE_CONVERSATIONS = 20;

const suggestions = [
    {
        icon: faBug,
        title: "Phân tích lỗi code",
        description: "Phân tích lỗi biên dịch và runtime trong code Java",
        prompt: "Phân tích lỗi code giúp tôi: hướng dẫn cách xử lý và khắc phục lỗi khi chạy chương trình Java.",
    },
    {
        icon: faCode,
        title: "Spring Boot",
        description: "Giải thích Dependency Injection trong Spring Boot",
        prompt: "Giải thích Dependency Injection trong Spring Boot và cho ví dụ minh họa bằng code Java",
    },
    {
        icon: faBrain,
        title: "Thuật toán",
        description: "Hướng dẫn tư duy giải bài toán và độ phức tạp",
        prompt: "Hướng dẫn các phương pháp tối ưu thuật toán tìm kiếm và sắp xếp phổ biến trong Java",
    },
    {
        icon: faGraduationCap,
        title: "Lộ trình học",
        description: "Lập kế hoạch học Java Backend từ cơ bản đến nâng cao",
        prompt: "Lập lộ trình học Java Backend từ Java Core đến Spring Boot, Microservices và CSDL",
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
        id: item.id ?? item._id ?? `${conversationId}-${index}`,
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

    // Phân trang tin nhắn và hội thoại
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [hasMoreConversations, setHasMoreConversations] = useState(false);
    const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);

    const bottomRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const activeIdRef = useRef(null);
    const loadingRef = useRef(false);
    const historyRequestRef = useRef(0);
    const isPrependingRef = useRef(false);
    const shouldSmoothScrollRef = useRef(false);

    // Luôn luôn tự động focus vào ô nhập chat mỗi khi hỏi xong hoặc khi chuyển cuộc trò chuyện
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [loading, activeId]);

    // Cuộn xuống tin nhắn mới nhất:
    // KHÔNG lướt qua các tin nhắn cũ khi mở cuộc trò chuyện (nhảy tức thì)
    // Chỉ cuộn smooth khi người dùng vừa gửi câu hỏi mới
    useEffect(() => {
        if (isPrependingRef.current) return;

        if (shouldSmoothScrollRef.current) {
            bottomRef.current?.scrollIntoView({
                behavior: "smooth",
            });
            shouldSmoothScrollRef.current = false;
        } else {
            // Nhảy trực tiếp tới tin nhắn mới nhất ngay lập tức, không lướt hoạt họa
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop =
                    chatContainerRef.current.scrollHeight;
            } else {
                bottomRef.current?.scrollIntoView({
                    behavior: "instant",
                });
            }
        }
    }, [messages, loading]);

    // Tải danh sách hội thoại khi component khởi tạo (Chỉ tải batch đầu tiên)
    useEffect(() => {
        let cancelled = false;

        async function fetchConversations() {
            try {
                const data = await aiTutorService.getConversations({
                    limit: PAGE_SIZE_CONVERSATIONS,
                    skip: 0,
                });

                if (!cancelled) {
                    const list = getList(data);
                    setConversations(list);
                    setHasMoreConversations(Boolean(data?.has_more));

                    // Nếu có sẵn hội thoại gần nhất, tự động mở
                    if (list.length > 0 && !activeIdRef.current) {
                        void openConversation(list[0]);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("[AI Tutor] Load conversations:", err);
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

    // Tải thêm các cuộc trò chuyện cũ hơn trong sidebar
    async function loadMoreConversations() {
        if (!hasMoreConversations || loadingMoreConversations) return;

        setLoadingMoreConversations(true);
        try {
            const data = await aiTutorService.getConversations({
                limit: PAGE_SIZE_CONVERSATIONS,
                skip: conversations.length,
            });

            const more = getList(data);
            if (more.length > 0) {
                setConversations((previous) => [...previous, ...more]);
            }
            setHasMoreConversations(Boolean(data?.has_more));
        } catch (err) {
            console.error("[AI Tutor] Load more conversations failed:", err);
        } finally {
            setLoadingMoreConversations(false);
        }
    }

    // Tạo khung chat mới (Reset cục bộ, tạo hội thoại lười khi gửi tin nhắn)
    function createConversation() {
        if (loadingRef.current) return;

        historyRequestRef.current += 1;

        activeIdRef.current = null;
        setActiveId(null);
        setMessages([]);
        setHasMoreMessages(false);
        setQuestion("");
        setError("");
        shouldSmoothScrollRef.current = false;

        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    }

    // Mở hội thoại và tải N tin nhắn gần nhất (không load hết để tiết kiệm tài nguyên)
    async function openConversation(conversation) {
        if (!conversation?.id || loadingRef.current) return;

        const conversationId = conversation.id;
        const requestId = ++historyRequestRef.current;

        activeIdRef.current = conversationId;
        setActiveId(conversationId);
        setMessages([]);
        setHasMoreMessages(false);
        setError("");
        // Không lướt hoạt họa khi mở hội thoại mới
        shouldSmoothScrollRef.current = false;

        try {
            const data = await aiTutorService.getMessages(conversationId, {
                limit: PAGE_SIZE_MESSAGES,
            });

            if (
                requestId !== historyRequestRef.current ||
                activeIdRef.current !== conversationId
            ) {
                return;
            }

            setMessages(normalizeMessages(data, conversationId));
            setHasMoreMessages(Boolean(data?.has_more));

            // Đặt vị trí cuộn ngay lập tức ở cuối, không lướt qua tin nhắn cũ
            requestAnimationFrame(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop =
                        chatContainerRef.current.scrollHeight;
                }
            });
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
        } finally {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 60);
        }
    }

    // Tải thêm các tin nhắn cũ hơn trước đó (Prepend & giữ nguyên vị trí cuộn)
    async function loadOlderMessages() {
        if (
            !hasMoreMessages ||
            loadingOlderMessages ||
            !activeIdRef.current ||
            messages.length === 0
        ) {
            return;
        }

        const oldestMessage = messages[0];
        if (!oldestMessage?.id) return;

        setLoadingOlderMessages(true);
        isPrependingRef.current = true;
        shouldSmoothScrollRef.current = false;

        const container = chatContainerRef.current;
        const prevScrollHeight = container ? container.scrollHeight : 0;
        const prevScrollTop = container ? container.scrollTop : 0;

        try {
            const data = await aiTutorService.getMessages(
                activeIdRef.current,
                {
                    limit: PAGE_SIZE_MESSAGES,
                    before_id: oldestMessage.id,
                }
            );

            const olderMessages = normalizeMessages(
                data,
                activeIdRef.current
            );

            if (olderMessages.length > 0) {
                setMessages((previous) => [
                    ...olderMessages,
                    ...previous,
                ]);
            }

            setHasMoreMessages(Boolean(data?.has_more));

            // Duy trì vị trí thanh cuộn mượt mà
            requestAnimationFrame(() => {
                if (container) {
                    const heightDiff =
                        container.scrollHeight - prevScrollHeight;
                    container.scrollTop = prevScrollTop + heightDiff;
                }
                isPrependingRef.current = false;
            });
        } catch (err) {
            console.error("[AI Tutor] Load older messages failed:", err);
            isPrependingRef.current = false;
        } finally {
            setLoadingOlderMessages(false);
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
        isPrependingRef.current = false;
        shouldSmoothScrollRef.current = true;

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

            // Gửi câu hỏi và nhận câu trả lời.
            const response = await aiTutorService.sendMessage(
                conversationId,
                content
            );

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

            // Cập nhật câu trả lời nếu người dùng vẫn đang ở hội thoại này
            if (activeIdRef.current === conversationId) {
                const assistantMessage = {
                    id:
                        result?.assistant_message?.id ??
                        createMessageId("assistant"),
                    role: "assistant",
                    content: answer,
                };

                shouldSmoothScrollRef.current = true;
                setMessages((previous) => [
                    ...previous,
                    assistantMessage,
                ]);

                // Làm mới danh sách hội thoại để cập nhật thứ tự mới nhất
                try {
                    const conversationData =
                        await aiTutorService.getConversations({
                            limit: PAGE_SIZE_CONVERSATIONS,
                            skip: 0,
                        });
                    setConversations(getList(conversationData));
                    setHasMoreConversations(Boolean(conversationData?.has_more));
                } catch {
                    // Không chặn nếu refresh danh sách thất bại
                }
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
            // Luôn đảm bảo focus lại vào ô nhập sau khi gửi xong
            setTimeout(() => {
                inputRef.current?.focus();
            }, 60);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        void sendMessage();
    }

    // Lấy tiêu đề hội thoại đang mở
    const activeConversation = conversations.find(
        (c) => c.id === activeId
    );

    return (
        <div className="ai-tutor">
            {/* SIDEBAR */}
            <aside
                className={`ai-sidebar ${
                    sidebarOpen ? "" : "collapsed"
                }`}
            >
                <div className="ai-brand">
                    {sidebarOpen ? (
                        <>
                            <div className="ai-brand-icon">
                                <FontAwesomeIcon icon={faBrain} />
                            </div>

                            <div className="ai-brand-info">
                                <strong>JLearn AI</strong>
                                <span>TRỢ LÝ HỌC TẬP</span>
                            </div>
                        </>
                    ) : null}

                    {/* Nút ||| chuyển đổi đóng / mở sidebar luôn hiển thị rõ ràng */}
                    <button
                        type="button"
                        className="sidebar-toggle-btn"
                        onClick={() =>
                            setSidebarOpen((value) => !value)
                        }
                        aria-label={sidebarOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
                        title={sidebarOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                </div>

                <button
                    type="button"
                    className="new-chat-btn"
                    onClick={createConversation}
                    disabled={loading}
                    title="Bắt đầu cuộc trò chuyện mới"
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
                            <span>LỊCH SỬ HỘI THOẠI</span>
                        </div>

                        <div className="conversation-list">
                            {loadingHistory ? (
                                <p className="sidebar-empty">
                                    Đang tải lịch sử...
                                </p>
                            ) : conversations.length === 0 ? (
                                <p className="sidebar-empty">
                                    Chưa có cuộc trò chuyện nào.
                                </p>
                            ) : (
                                <>
                                    {conversations.map((conversation) => (
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
                                    ))}

                                    {hasMoreConversations && (
                                        <button
                                            type="button"
                                            className="sidebar-load-more-btn"
                                            onClick={loadMoreConversations}
                                            disabled={loadingMoreConversations}
                                        >
                                            <FontAwesomeIcon
                                                icon={faRotateRight}
                                                spin={loadingMoreConversations}
                                            />
                                            <span>
                                                {loadingMoreConversations
                                                    ? "Đang tải thêm..."
                                                    : "Xem thêm hội thoại cũ"}
                                            </span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="sidebar-bottom">
                            <div className="sidebar-tip">
                                <FontAwesomeIcon icon={faLightbulb} />
                                <div>
                                    <strong>Mẹo học tập thông minh</strong>
                                    <p>
                                        Dán mã nguồn và lỗi console để AI Tutor
                                        hướng dẫn bạn tự debug theo phương pháp gợi mở.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </aside>

            {/* MAIN CHAT AREA */}
            <main className="ai-main">
                <header className="ai-topbar">
                    <div className="ai-topbar-left">
                        {/* Nút ||| trong topbar luôn sẵn sàng mở/đóng sidebar, đặc biệt khi thu gọn hoặc trên mobile */}
                        <button
                            type="button"
                            className="topbar-sidebar-toggle-btn"
                            onClick={() => setSidebarOpen((value) => !value)}
                            aria-label={sidebarOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
                            title={sidebarOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
                        >
                            <FontAwesomeIcon icon={faBars} />
                        </button>

                        <div className="ai-topbar-title">
                            <span className="breadcrumb">JLearn</span>
                            <span className="breadcrumb-separator">/</span>
                            <strong>
                                {activeConversation?.title || "Trợ lý học tập AI"}
                            </strong>
                        </div>
                    </div>

                    <div className="ai-status">
                        <span className="status-dot" />
                        <span>Trực tuyến</span>
                    </div>
                </header>

                <section className="ai-chat" ref={chatContainerRef}>
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
                                Mình là <strong>AI Tutor của JLearn</strong>. Hãy đặt bất kỳ câu hỏi nào
                                về Java Core, lập trình hướng đối tượng, Spring Boot hoặc yêu cầu
                                phân tích lỗi code. Mình luôn sẵn sàng hỗ trợ!
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
                                                item.prompt ||
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
                            {/* Nút tải thêm tin nhắn trước đó (chỉ tải theo phân trang khi người dùng yêu cầu) */}
                            {hasMoreMessages && (
                                <div className="load-older-container">
                                    <button
                                        type="button"
                                        className="load-older-btn"
                                        onClick={loadOlderMessages}
                                        disabled={loadingOlderMessages}
                                    >
                                        <FontAwesomeIcon
                                            icon={faRotateRight}
                                            spin={loadingOlderMessages}
                                        />
                                        <span>
                                            {loadingOlderMessages
                                                ? "Đang tải tin nhắn cũ..."
                                                : "Tải tin nhắn trước đó"}
                                        </span>
                                    </button>
                                </div>
                            )}

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
                                        <span className="message-author">
                                            {message.role === "user"
                                                ? "Bạn"
                                                : "JLearn AI Tutor"}
                                        </span>

                                        <div className="message-bubble">
                                            {message.role === "assistant" ? (
                                                <div className="ai-markdown-content">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div style={{ whiteSpace: "pre-wrap" }}>
                                                    {message.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}

                            {loading && (
                                <div className="typing-indicator">
                                    <span />
                                    <span />
                                    <span />
                                    <small>
                                        AI Tutor đang phân tích và soạn câu trả lời...
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

                    {/* COMPOSER */}
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
                                placeholder={
                                    loading
                                        ? "AI Tutor đang phân tích và soạn câu trả lời..."
                                        : "Đặt câu hỏi hoặc dán code + lỗi console tại đây..."
                                }
                                rows={2}
                                maxLength={10000}
                                readOnly={loading}
                            />

                            <div className="composer-footer">
                                <span>
                                    <FontAwesomeIcon
                                        icon={faWandMagicSparkles}
                                    />
                                    Enter để gửi · Shift + Enter xuống dòng
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
