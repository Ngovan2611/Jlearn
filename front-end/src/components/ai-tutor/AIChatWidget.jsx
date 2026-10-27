
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faPaperPlane,
    faRobot,
    faUser,
    faComments,
    faMinus,
} from "@fortawesome/free-solid-svg-icons";

import aiTutorService from "../../services/aiTutorService";
import "./AIChatWidget.css";

function createMessageId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}

function getConversation(data) {
    return data?.result ?? data;
}

function getErrorMessage(error) {
    return (
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Đã xảy ra lỗi. Vui lòng thử lại."
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

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const loadingRef = useRef(false);
    const conversationIdRef = useRef(null);

    // Ẩn widget trên trang AI Tutor đầy đủ.
    const hiddenPaths = ["/ai-tutor"];

    const shouldHide = hiddenPaths.some(
        (path) =>
            location.pathname === path ||
            location.pathname.startsWith(`${path}/`)
    );

    // Cuộn xuống tin nhắn mới nhất.
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({
                behavior: "smooth",
            });
        }
    }, [messages, loading, isOpen]);

    // Tự focus ô nhập khi mở popup.
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    function toggleChat() {
        setIsOpen((previous) => !previous);
        setError("");
    }

    // Bắt đầu hội thoại mới, chỉ tạo trên backend khi gửi câu hỏi.
    function startNewChat() {
        if (loadingRef.current) return;

        conversationIdRef.current = null;

        setMessages([]);
        setQuestion("");
        setError("");

        inputRef.current?.focus();
    }

    async function sendMessage(text = question) {
        const content =
            typeof text === "string" ? text.trim() : "";

        if (!content || loadingRef.current) return;

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
            let currentConversationId =
                conversationIdRef.current;

            // Tạo hội thoại khi gửi câu hỏi đầu tiên.
            if (!currentConversationId) {
                const title = generateConversationTitle(content);

                const data =
                    await aiTutorService.createConversation(title);

                const conversation = getConversation(data);
                currentConversationId = conversation?.id;

                if (!currentConversationId) {
                    throw new Error(
                        "API không trả về ID hội thoại."
                    );
                }

                conversationIdRef.current =
                    currentConversationId;
            }

            // Gửi câu hỏi và lưu lịch sử qua backend.
            const response = await aiTutorService.sendMessage(
                currentConversationId,
                content
            );

            const result = getConversation(response);

            const answer =
                result?.assistant_message?.content ??
                result?.answer ??
                result?.content;

            if (
                typeof answer !== "string" ||
                !answer.trim()
            ) {
                throw new Error(
                    "AI chưa trả về câu trả lời hợp lệ."
                );
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
                    <header className="ai-widget-header">
                        <div className="ai-widget-brand">
                            <div className="ai-widget-brand-icon">
                                <FontAwesomeIcon icon={faRobot} />
                            </div>

                            <div className="ai-widget-brand-info">
                                <strong>JLearn AI</strong>
                                <span>
                                    <i />
                                    Trợ lý học tập trực tuyến
                                </span>
                            </div>
                        </div>

                        <div className="ai-widget-header-actions">
                            <button
                                type="button"
                                title="Cuộc trò chuyện mới"
                                aria-label="Cuộc trò chuyện mới"
                                onClick={startNewChat}
                                disabled={loading}
                            >
                                <FontAwesomeIcon icon={faComments} />
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

                    <div className="ai-widget-messages">
                        {messages.length === 0 && (
                            <div className="ai-widget-welcome">
                                <div className="ai-widget-welcome-icon">
                                    <FontAwesomeIcon icon={faRobot} />
                                </div>

                                <h3>Xin chào! 👋</h3>

                                <p>
                                    Mình là AI Tutor của JLearn.
                                    Bạn cần hỗ trợ gì về Java,
                                    Spring Boot hay lập trình?
                                </p>

                                <div className="ai-widget-suggestions">
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            void sendMessage(
                                                "Giải thích Dependency Injection trong Spring Boot"
                                            )
                                        }
                                    >
                                        Dependency Injection là gì?
                                    </button>

                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            void sendMessage(
                                                "Hướng dẫn học Java Backend cho người mới bắt đầu"
                                            )
                                        }
                                    >
                                        Lộ trình học Java Backend
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
                                    <span>
                                        {message.role === "user"
                                            ? "Bạn"
                                            : "JLearn AI"}
                                    </span>

                                    <p>{message.content}</p>
                                </div>
                            </article>
                        ))}

                        {loading && (
                            <div className="ai-widget-typing">
                                <span />
                                <span />
                                <span />
                                <small>AI đang trả lời...</small>
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
                            placeholder="Nhập câu hỏi của bạn..."
                            rows={2}
                            maxLength={10000}
                            disabled={loading}
                        />

                        <div className="ai-widget-composer-footer">
                            <span>
                                Enter để gửi · Shift + Enter xuống dòng
                            </span>

                            <button
                                type="submit"
                                aria-label="Gửi tin nhắn"
                                disabled={!question.trim() || loading}
                            >
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                        </div>
                    </form>
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
