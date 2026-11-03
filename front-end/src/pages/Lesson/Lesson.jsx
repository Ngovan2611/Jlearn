import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faBookOpen,
    faCircleCheck,
    faCircleExclamation,
    faCode,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// Thư viện Render Markdown & Code Highlighting
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import courseService from "../../services/courseService";
import enrollmentService from "../../services/enrollmentService";
import "./Lesson.css";

const Lesson = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [progress, setProgress] = useState(0);
    const [lessonCompleted, setLessonCompleted] = useState(false);

    const [loading, setLoading] = useState(true);
    const [updatingProgress, setUpdatingProgress] = useState(false);

    const [error, setError] = useState("");
    const [progressError, setProgressError] = useState("");

    /**
     * Helper chuyển đổi các dạng URL YouTube sang dạng Embed URL chuẩn
     */
    const getEmbedVideoUrl = (url) => {
        if (!url) return null;

        if (url.includes("youtube.com/embed/")) {
            return url;
        }

        // Match dạng https://www.youtube.com/watch?v=VIDEO_ID
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch && watchMatch[1]) {
            return `https://www.youtube.com/embed/${watchMatch[1]}`;
        }

        // Match dạng https://youtu.be/VIDEO_ID
        const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
        if (shortMatch && shortMatch[1]) {
            return `https://www.youtube.com/embed/${shortMatch[1]}`;
        }

        return url;
    };

    /* =========================================
     * 1. Load Thông Tin Bài Học
     * ========================================= */
    useEffect(() => {
        const loadLesson = async () => {
            if (!lessonId) {
                setError("Không tìm thấy thông tin bài học.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await courseService.getLessonById(lessonId);
                const data = response.data?.result ?? response.data;

                setLesson(data);
            } catch (err) {
                console.error("Load lesson failed:", err);
                setError(
                    err.response?.data?.message || "Không thể tải bài học."
                );
            } finally {
                setLoading(false);
            }
        };

        loadLesson();
    }, [lessonId]);

    /* =========================================
     * 2. Load Tiến Độ Khóa Học
     * ========================================= */
    useEffect(() => {
        const loadProgress = async () => {
            if (!lesson?.courseId || !lesson?.id) return;

            try {
                setProgressError("");
                const response = await enrollmentService.getProgress(lesson.courseId);
                const data = response.data?.result;

                if (data) {
                    setProgress(Number(data.progress ?? 0));
                    const isCompleted =
                        Array.isArray(data.completedLessonIds) &&
                        data.completedLessonIds.includes(lesson.id);

                    setLessonCompleted(isCompleted);
                } else {
                    setProgress(0);
                    setLessonCompleted(false);
                }
            } catch (err) {
                console.error("Load course progress failed:", err);
                setProgressError(
                    err.response?.data?.message || "Không thể tải tiến độ khóa học."
                );
                setProgress(0);
                setLessonCompleted(false);
            }
        };

        loadProgress();
    }, [lesson]);

    /* =========================================
     * 3. Đánh Dấu Hoàn Thành Bài Học
     * ========================================= */
    const handleComplete = async () => {
        if (!lesson?.courseId || !lesson?.id || updatingProgress || lessonCompleted) {
            return;
        }

        try {
            setUpdatingProgress(true);
            setProgressError("");

            const response = await enrollmentService.updateLessonProgress(
                lesson.courseId,
                lesson.id
            );

            const data = response.data?.result;
            setProgress(Number(data?.progress ?? 0));
            setLessonCompleted(true);
        } catch (err) {
            console.error("Update lesson progress failed:", err);
            setProgressError(
                err.response?.data?.message || "Không thể cập nhật tiến độ."
            );
        } finally {
            setUpdatingProgress(false);
        }
    };

    /* =========================================
     * 4. Chuyển Hướng Sang Trang Bài Tập
     * ========================================= */
    const handleExercises = () => {
        if (!lesson?.id) return;
        navigate(`/lessons/${lesson.id}/exercises`);
    };

    /* =========================================
     * Render Giao Diện Loading & Error
     * ========================================= */
    if (loading) {
        return (
            <div className="lesson-loading">
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Đang tải bài học...</span>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="lesson-error">
                <FontAwesomeIcon icon={faCircleExclamation} />
                <p>{error || "Không tìm thấy bài học."}</p>
                <Link to="/courses" className="lesson-back-button">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Quay lại khóa học</span>
                </Link>
            </div>
        );
    }

    const safeProgress = Math.min(Math.max(Number(progress) || 0, 0), 100);
    const embedVideoUrl = getEmbedVideoUrl(lesson.videoUrl);
    const isYoutube = embedVideoUrl && embedVideoUrl.includes("youtube.com/embed/");

    return (
        <div className="lesson-page">
            {/* HEADER */}
            <header className="lesson-header">
                <Link to={`/courses/${lesson.courseId}`} className="lesson-back-link">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Quay lại khóa học</span>
                </Link>

                <div className="lesson-header-title">
                    <FontAwesomeIcon icon={faBookOpen} />
                    <span>{lesson.title}</span>
                </div>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main className="lesson-container">
                <div className="lesson-main">
                    {/* Title & Description */}
                    <section className="lesson-title-section">
                        <span className="lesson-label">BÀI HỌC</span>
                        <h1>{lesson.title}</h1>
                        {lesson.description && <p>{lesson.description}</p>}
                    </section>

                    {/* Video Player */}
                    {lesson.videoUrl && (
                        <div className="lesson-video-wrapper">
                            {isYoutube ? (
                                <iframe
                                    className="lesson-video-iframe"
                                    src={embedVideoUrl}
                                    title={lesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <video className="lesson-video" controls src={lesson.videoUrl}>
                                    Trình duyệt của bạn không hỗ trợ phát video.
                                </video>
                            )}
                        </div>
                    )}

                    {/* Markdown Document Content */}
                    {lesson.content && (
                        <article className="lesson-content markdown-body">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={match[1]}
                                                PreTag="div"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {lesson.content}
                            </ReactMarkdown>
                        </article>
                    )}

                    {/* Progress Error Notification */}
                    {progressError && (
                        <div className="lesson-progress-error">
                            <FontAwesomeIcon icon={faCircleExclamation} />
                            <span>{progressError}</span>
                        </div>
                    )}

                    {/* Complete Action Button */}
                    <div className="lesson-complete-section">
                        <button
                            type="button"
                            className="lesson-complete-button"
                            onClick={handleComplete}
                            disabled={lessonCompleted || updatingProgress}
                        >
                            {lessonCompleted ? (
                                <>
                                    <FontAwesomeIcon icon={faCircleCheck} />
                                    <span>Đã hoàn thành</span>
                                </>
                            ) : updatingProgress ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    <span>Đang cập nhật...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faCircleCheck} />
                                    <span>Đánh dấu đã hoàn thành</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Exercises Action Button */}
                    <div className="lesson-exercise-section">
                        <button
                            type="button"
                            className="lesson-exercise-button"
                            onClick={handleExercises}
                        >
                            <FontAwesomeIcon icon={faCode} />
                            <span>Làm bài tập</span>
                        </button>
                    </div>
                </div>

                {/* SIDEBAR */}
                <aside className="lesson-sidebar">
                    <div className="lesson-progress-card">
                        <div className="lesson-progress-header">
                            <span>Tiến độ khóa học</span>
                            <strong>{safeProgress}%</strong>
                        </div>
                        <div className="lesson-progress-bar">
                            <div
                                className="lesson-progress-fill"
                                style={{ width: `${safeProgress}%` }}
                            />
                        </div>
                    </div>

                    <div className="lesson-sidebar-card">
                        <div className="lesson-sidebar-icon">
                            <FontAwesomeIcon icon={faBookOpen} />
                        </div>
                        <div>
                            <strong>Bài học hiện tại</strong>
                            <p>{lesson.title}</p>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default Lesson;