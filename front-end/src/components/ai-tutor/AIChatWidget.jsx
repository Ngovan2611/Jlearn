import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faPaperPlane,
    faRobot,
    faUser,
    faComments,
    faMinus,
    faBug,
    faRotateRight,
    faChartLine,
} from "@fortawesome/free-solid-svg-icons";

import aiTutorService from "../../services/aiTutorService";
import "./AIChatWidget.css";

const CONVERSATION_STORAGE_KEY = "jlearn_active_conversation_id";

function createMessageId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}

function getConversation(data) {
    return data?.result ?? data;
}

function getErrorMessage(error) {
    if (!error?.response || error?.code === "ERR_NETWORK") {
        return "Không thể kết nối tới máy chủ.";
    }

    if (error?.response?.status === 503 || error?.response?.status === 502) {
        return "Không thể kết nối tới máy chủ.";
    }

    return (
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xử lý yêu cầu, vui lòng thử lại."
    );
}

function generateConversationTitle(question) {
    const normalized = question.replace(/\s+/g, " ").trim();
    const maxLength = 50;

    return normalized.length <= maxLength
        ? normalized
        : `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function AIChatWidget() {
    const location = useLocation();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Chế độ Phân tích lỗi (Use Case b)
    const [isErrorMode, setIsErrorMode] = useState(false);
    const [sourceCode, setSourceCode] = useState("");
    const [consoleError, setConsoleError] = useState("");

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const codeInputRef = useRef(null);
    const loadingRef = useRef(false);
    const conversationIdRef = useRef(null);
    const historyLoadedRef = useRef(false);

    // Ẩn widget trên trang AI Tutor đầy đủ
    const hiddenPaths = ["/ai-tutor"];

    const shouldHide = hiddenPaths.some(
        (path) =>
            location.pathname === path ||
            location.pathname.startsWith(`${path}/`)
    );

    // Hàm lấy ID hội thoại hiện có hoặc tạo mới nếu chưa có bất kỳ cuộc trò chuyện nào
    // (Khắc phục triệt để việc mỗi lần hỏi lỗi lại tạo conversation mới gây tốn tài nguyên)
    const getOrCreateConversationId = useCallback(async (fallbackTitle = "Cuộc trò chuyện mới") => {
        // 1. Nếu đã có trong ref đang chạy
        if (conversationIdRef.current) {
            return conversationIdRef.current;
        }

        // 2. Nếu đã lưu trong sessionStorage của phiên học
        const storedId = sessionStorage.getItem(CONVERSATION_STORAGE_KEY);
        if (storedId) {
            conversationIdRef.current = storedId;
            return storedId;
        }

        // 3. Kiểm tra danh sách hội thoại gần nhất trên backend
        try {
            const response = await aiTutorService.getConversations();
            const list = Array.isArray(response?.result)
                ? response.result
                : Array.isArray(response)
                ? response
                : [];

            if (list.length > 0) {
                const latest = list[0];
                const latestId = latest?.id || latest?._id;
                if (latestId) {
                    conversationIdRef.current = latestId;
                    sessionStorage.setItem(CONVERSATION_STORAGE_KEY, latestId);
                    return latestId;
                }
            }
        } catch (err) {
            console.warn("[AI Chat Widget] Không thể lấy hội thoại cũ:", err);
        }

        // 4. Chỉ khi tài khoản hoàn toàn chưa có cuộc trò chuyện nào mới tạo mới
        const title = generateConversationTitle(fallbackTitle);
        const data = await aiTutorService.createConversation(title);
        const conversation = getConversation(data);
        const newId = conversation?.id || conversation?._id;

        if (newId) {
            conversationIdRef.current = newId;
            sessionStorage.setItem(CONVERSATION_STORAGE_KEY, newId);
            return newId;
        }

        return null;
    }, []);

    // Tự động tải cuộc trò chuyện đang có khi mở widget lần đầu
    useEffect(() => {
        let isCancelled = false;

        async function restoreActiveConversation() {
            if (!isOpen || historyLoadedRef.current || loadingRef.current) return;

            try {
                let activeId =
                    conversationIdRef.current ||
                    sessionStorage.getItem(CONVERSATION_STORAGE_KEY);

                // Nếu chưa có trong session, kiểm tra danh sách trên server
                if (!activeId) {
                    const response = await aiTutorService.getConversations();
                    const list = Array.isArray(response?.result)
                        ? response.result
                        : Array.isArray(response)
                        ? response
                        : [];

                    if (list.length > 0) {
                        activeId = list[0]?.id || list[0]?._id;
                    }
                }

                if (!activeId || isCancelled) return;

                conversationIdRef.current = activeId;
                sessionStorage.setItem(CONVERSATION_STORAGE_KEY, activeId);

                const msgResponse = await aiTutorService.getMessages(activeId);
                const msgList = Array.isArray(msgResponse?.result)
                    ? msgResponse.result
                    : Array.isArray(msgResponse)
                    ? msgResponse
                    : [];

                if (!isCancelled && msgList.length > 0) {
                    setMessages(
                        msgList.map((m, index) => ({
                            id: m.id || m._id || `restored-${index}`,
                            role: m.role || "assistant",
                            content: m.content || "",
                        }))
                    );
                }

                historyLoadedRef.current = true;
            } catch (err) {
                console.warn("[AI Chat Widget] Không thể khôi phục lịch sử chat:", err);
            }
        }

        void restoreActiveConversation();

        return () => {
            isCancelled = true;
        };
    }, [isOpen]);

    // Lắng nghe sự kiện từ trang Thực hành code
    useEffect(() => {
        function handleOpenErrorAnalysis(event) {
            const { sourceCode: incomingCode, errorMessage: incomingError } =
                event.detail || {};
            setIsOpen(true);
            setIsErrorMode(true);
            if (incomingCode) setSourceCode(incomingCode);
            if (incomingError) setConsoleError(incomingError);
            setError("");
        }

        window.addEventListener(
            "jlearn:open-error-analysis",
            handleOpenErrorAnalysis
        );

        return () => {
            window.removeEventListener(
                "jlearn:open-error-analysis",
                handleOpenErrorAnalysis
            );
        };
    }, []);

    // Cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        if (isOpen && !isErrorMode) {
            messagesEndRef.current?.scrollIntoView({
                behavior: "smooth",
            });
        }
    }, [messages, loading, isOpen, isErrorMode]);

    // Tự focus ô nhập khi mở popup hoặc đổi tab
    useEffect(() => {
        if (isOpen) {
            if (isErrorMode) {
                codeInputRef.current?.focus();
            } else {
                inputRef.current?.focus();
            }
        }
    }, [isOpen, isErrorMode]);

    function toggleChat() {
        setIsOpen((previous) => !previous);
        setError("");
    }

    // Bắt đầu hội thoại mới (Chỉ reset cục bộ, không spam API tạo mới cho đến khi gửi câu hỏi)
    function startNewChat() {
        if (loadingRef.current) return;

        conversationIdRef.current = null;
        sessionStorage.removeItem(CONVERSATION_STORAGE_KEY);
        historyLoadedRef.current = true;
        setMessages([]);
        setQuestion("");
        setError("");
        setIsErrorMode(false);
        inputRef.current?.focus();
    }

    // Gửi câu hỏi chat thông thường (Flow a)
    async function sendMessage(text = question) {
        const content = typeof text === "string" ? text.trim() : "";

        if (!content) {
            setError("Vui lòng nhập câu hỏi.");
            return;
        }

        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setQuestion("");
        setError("");

        setMessages((previous) => [
            ...previous,
            {
                id: createMessageId("user"),
                role: "user",
                content,
            },
        ]);

        try {
            // Tái sử dụng cuộc trò chuyện hiện tại, tránh tạo mới liên tục
            const currentConversationId = await getOrCreateConversationId(content);

            if (!currentConversationId) {
                throw new Error("Không thể kết nối tới máy chủ.");
            }

            const response = await aiTutorService.sendMessage(
                currentConversationId,
                content
            );

            const result = getConversation(response);
            const answer =
                result?.assistant_message?.content ??
                result?.answer ??
                result?.content;

            if (typeof answer !== "string" || !answer.trim()) {
                throw new Error("Không thể xử lý yêu cầu, vui lòng thử lại.");
            }

            setMessages((previous) => [
                ...previous,
                {
                    id:
                        result?.assistant_message?.id ??
                        createMessageId("assistant"),
                    role: "assistant",
                    content: answer,
                },
            ]);
        } catch (err) {
            console.error("[AI Chat Widget]", err);
            setError(getErrorMessage(err));
        } finally {
            loadingRef.current = false;
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    // Xử lý gửi phân tích lỗi code (Flow b)
    // TÁI SỬ DỤNG HỘI THOẠI ĐANG CHẠY (Không tạo mới lãng phí tài nguyên)
    async function handleAnalyzeError(e) {
        if (e) e.preventDefault();

        const code = sourceCode.trim();
        const errConsole = consoleError.trim();

        // Luồng rẽ nhánh 1: Nếu gửi nội dung rỗng
        if (!code || !errConsole) {
            setError("Vui lòng nhập câu hỏi.");
            return;
        }

        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError("");

        // Chuyển về khung chat để người dùng theo dõi quá trình phân tích
        setIsErrorMode(false);

        const promptText = `[Yêu cầu phân tích lỗi]\n\nMã nguồn:\n\`\`\`java\n${code}\n\`\`\`\n\nThông báo lỗi console:\n\`\`\`\n${errConsole}\n\`\`\``;

        setMessages((previous) => [
            ...previous,
            {
                id: createMessageId("user"),
                role: "user",
                content: promptText,
            },
        ]);

        try {
            // Tái sử dụng cuộc trò chuyện đang có (tiết kiệm tài nguyên server/DB)
            let currentConversationId = await getOrCreateConversationId("Phân tích lỗi code");
            let answer = "";

            if (currentConversationId) {
                const response = await aiTutorService.sendMessage(
                    currentConversationId,
                    promptText
                );

                const result = getConversation(response);
                answer =
                    result?.assistant_message?.content ??
                    result?.answer ??
                    result?.content;
            } else {
                // Fallback trực tiếp phân tích lỗi nếu khách chưa đăng nhập
                const result = await aiTutorService.analyzeError(code, errConsole, "java");
                answer = result?.analysis;
            }

            if (typeof answer !== "string" || !answer.trim()) {
                throw new Error("Không thể xử lý yêu cầu, vui lòng thử lại.");
            }

            setMessages((previous) => [
                ...previous,
                {
                    id: createMessageId("assistant"),
                    role: "assistant",
                    content: answer,
                },
            ]);

            // Dọn form sau khi phân tích thành công
            setSourceCode("");
            setConsoleError("");
        } catch (err) {
            console.error("[AI Chat Widget Error Analysis]", err);
            setError(getErrorMessage(err));
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        void sendMessage();
    }

    if (shouldHide) return null;

    return (
        <div className="ai-widget">
            {isOpen && (
                <section
                    className="ai-widget-window"
                    aria-label="Trò chuyện với AI Tutor"
                >
                    {/* Header */}
                    <header className="ai-widget-header">
                        <div className="ai-widget-brand">
                            <div className="ai-widget-brand-icon">
                                <FontAwesomeIcon icon={faRobot} />
                            </div>

                            <div className="ai-widget-brand-info">
                                <strong>JLearn AI Tutor</strong>
                                <span>
                                    <i />
                                    Trợ lý học tập thông minh
                                </span>
                            </div>
                        </div>

                        <div className="ai-widget-header-actions">
                            <button
                                type="button"
                                title="Cuộc trò chuyện mới"
                                aria-label="Bắt đầu cuộc trò chuyện mới"
                                onClick={startNewChat}
                                disabled={loading}
                            >
                                <FontAwesomeIcon icon={faRotateRight} />
                            </button>

                            <button
                                type="button"
                                title="Thu nhỏ"
                                aria-label="Thu nhỏ cửa sổ chat"
                                onClick={toggleChat}
                            >
                                <FontAwesomeIcon icon={faMinus} />
                            </button>

                            <button
                                type="button"
                                title="Đóng"
                                aria-label="Đóng cửa sổ chat"
                                onClick={toggleChat}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                    </header>

                    {/* Thanh điều hướng Tab trực quan */}
                    <nav className="ai-widget-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={!isErrorMode}
                            className={`ai-widget-tab ${!isErrorMode ? "is-active" : ""}`}
                            onClick={() => {
                                setIsErrorMode(false);
                                setError("");
                            }}
                        >
                            <FontAwesomeIcon icon={faComments} />
                            <span>Trò chuyện</span>
                        </button>

                        <button
                            type="button"
                            role="tab"
                            aria-selected={isErrorMode}
                            className={`ai-widget-tab ${isErrorMode ? "is-active" : ""}`}
                            onClick={() => {
                                setIsErrorMode(true);
                                setError("");
                            }}
                        >
                            <FontAwesomeIcon icon={faBug} />
                            <span>Phân tích lỗi code</span>
                        </button>
                    </nav>

                    {isErrorMode ? (
                        /* Giao diện Phân tích lỗi (Use Case b) */
                        <form
                            className="ai-widget-error-panel"
                            onSubmit={handleAnalyzeError}
                        >
                            <div className="ai-widget-error-intro">
                                <div className="ai-widget-error-intro-badge">
                                    <FontAwesomeIcon icon={faBug} />
                                    <span>Hỗ trợ sửa lỗi thông minh</span>
                                </div>
                                <p>
                                    Dán mã nguồn và thông báo lỗi từ console.
                                    AI Tutor sẽ phân tích nguyên nhân và đưa ra câu hỏi gợi mở
                                    giúp bạn tự tìm ra giải pháp.
                                </p>
                            </div>

                            <label className="ai-widget-field-label">
                                Mã nguồn Java:
                            </label>
                            <textarea
                                ref={codeInputRef}
                                className="ai-widget-code-textarea"
                                value={sourceCode}
                                onChange={(e) => setSourceCode(e.target.value)}
                                placeholder="Paste mã nguồn Java cần phân tích..."
                                rows={6}
                                disabled={loading}
                                spellCheck={false}
                            />

                            <label className="ai-widget-field-label">
                                Thông báo lỗi console (Exception, vị trí dòng...):
                            </label>
                            <textarea
                                className="ai-widget-error-textarea"
                                value={consoleError}
                                onChange={(e) => setConsoleError(e.target.value)}
                                placeholder="Paste thông báo lỗi từ console (Exception, line number...)"
                                rows={3}
                                disabled={loading}
                                spellCheck={false}
                            />

                            {error && (
                                <div className="ai-widget-error" role="alert">
                                    <span>{error}</span>
                                    <button
                                        type="button"
                                        onClick={() => setError("")}
                                        aria-label="Đóng lỗi"
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            )}

                            <div className="ai-widget-error-btns">
                                <button
                                    type="button"
                                    className="ai-widget-btn-back"
                                    onClick={() => {
                                        setIsErrorMode(false);
                                        setError("");
                                    }}
                                    disabled={loading}
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    className="ai-widget-btn-analyze"
                                    disabled={loading}
                                >
                                    {loading ? "Đang phân tích..." : "Phân tích lỗi ngay"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Giao diện Trò chuyện thông thường (Use Case a) */
                        <>
                            <div className="ai-widget-messages">
                                {messages.length === 0 && (
                                    <div className="ai-widget-welcome">
                                        <div className="ai-widget-welcome-icon">
                                            <FontAwesomeIcon icon={faRobot} />
                                        </div>

                                        <h3>Xin chào bạn! 👋</h3>

                                        <p>
                                            Mình là <strong>JLearn AI Tutor</strong>.
                                            Bạn cần trợ giúp gì về kiến thức Java,
                                            giải bài tập hay phân tích lỗi code?
                                        </p>

                                        <div className="ai-widget-suggestions">
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={() => setIsErrorMode(true)}
                                            >
                                                <FontAwesomeIcon icon={faBug} />
                                                <span>Phân tích lỗi trong code</span>
                                            </button>

                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={() =>
                                                    void sendMessage(
                                                        "Tiến độ học tập của tôi hiện tại như thế nào?"
                                                    )
                                                }
                                            >
                                                <FontAwesomeIcon icon={faChartLine} />
                                                <span>Kiểm tra tiến độ học tập</span>
                                            </button>

                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={() =>
                                                    void sendMessage(
                                                        "Giải thích Dependency Injection trong Spring Boot kèm ví dụ"
                                                    )
                                                }
                                            >
                                                <FontAwesomeIcon icon={faComments} />
                                                <span>Dependency Injection là gì?</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {messages.map((message) => (
                                    <article
                                        key={message.id}
                                        className={`ai-widget-message ${
                                            message.role === "user"
                                                ? "is-user"
                                                : "is-assistant"
                                        }`}
                                    >
                                        <div className="ai-widget-message-avatar">
                                            <FontAwesomeIcon
                                                icon={
                                                    message.role === "user"
                                                        ? faUser
                                                        : faRobot
                                                }
                                            />
                                        </div>

                                        <div className="ai-widget-message-content">
                                            <span className="ai-widget-message-author">
                                                {message.role === "user"
                                                    ? "Bạn"
                                                    : "JLearn AI"}
                                            </span>

                                            <div className="ai-widget-message-body">
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
                                    <div className="ai-widget-typing">
                                        <span />
                                        <span />
                                        <span />
                                        <small>AI đang phân tích và soạn câu trả lời...</small>
                                    </div>
                                )}

                                {error && (
                                    <div
                                        className="ai-widget-error"
                                        role="alert"
                                    >
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

                                <div ref={messagesEndRef} />
                            </div>

                            <form
                                className="ai-widget-composer"
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
                                    placeholder="Nhập câu hỏi của bạn tại đây..."
                                    rows={2}
                                    maxLength={10000}
                                    disabled={loading}
                                />

                                <div className="ai-widget-composer-footer">
                                    <button
                                        type="button"
                                        className="ai-widget-composer-pill"
                                        onClick={() => {
                                            setIsErrorMode(true);
                                            setError("");
                                        }}
                                        disabled={loading}
                                        title="Chuyển sang chế độ Phân tích lỗi trong code"
                                    >
                                        <FontAwesomeIcon icon={faBug} />
                                        <span>Phân tích lỗi</span>
                                    </button>

                                    <div className="ai-widget-composer-submit-group">
                                        <span className="ai-widget-composer-hint">
                                            Enter để gửi
                                        </span>

                                        <button
                                            type="submit"
                                            aria-label="Gửi tin nhắn"
                                            disabled={!question.trim() || loading}
                                        >
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            )}

            <button
                type="button"
                className={`ai-widget-launcher ${
                    isOpen ? "is-open" : ""
                }`}
                onClick={toggleChat}
                aria-label={
                    isOpen ? "Đóng AI Chat" : "Mở AI Chat"
                }
                aria-expanded={isOpen}
            >
                <FontAwesomeIcon
                    icon={isOpen ? faXmark : faComments}
                />

                {!isOpen && (
                    <span className="ai-widget-badge">1</span>
                )}
            </button>
        </div>
    );
}

export default AIChatWidget;
