
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faSpinner,
    faCircleExclamation,
    faPlay,
    faArrowRight,
    faBookOpen,
} from "@fortawesome/free-solid-svg-icons";

import courseService from "../../services/courseService";
import "./CourseDetail.css";

/**
 * Lấy dữ liệu result từ cấu trúc response API.
 * Hỗ trợ:
 * - { data: { result: [...] } }
 * - { data: { result: { data: [...] } } }
 * - { data: [...] }
 */
function extractArray(response) {
    const payload = response?.data ?? response;
    const result = payload?.result ?? payload;

    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result?.content)) {
        return result.content;
    }

    return [];
}

/**
 * Chuyển ID về chuỗi để tránh lỗi so sánh number với string.
 */
function normalizeId(value) {
    return value == null ? "" : String(value);
}

function CourseDetail() {
    const { id } = useParams();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        let ignore = false;

        const loadCourseDetail = async () => {
            try {
                const [courseResponse, lessonResponse] = await Promise.all([
                    courseService.getAllCourses(),
                    courseService.getLessonsByCourse(id),
                ]);

                if (ignore) return;

                const courses = extractArray(courseResponse);

                const currentCourse = courses.find(
                    (item) => normalizeId(item.id) === normalizeId(id)
                );

                const lessonData = extractArray(lessonResponse);

                const sortedLessons = [...lessonData].sort(
                    (a, b) =>
                        (Number(a.lessonOrder) || 0) -
                        (Number(b.lessonOrder) || 0)
                );

                setCourse(currentCourse || null);
                setLessons(sortedLessons);

                if (!currentCourse) {
                    setError("Không tìm thấy khóa học.");
                } else {
                    setError("");
                }
            } catch (err) {
                if (ignore) return;

                console.error("Get course detail failed:", err);

                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.result?.message ||
                    "Không thể tải thông tin khóa học."
                );
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        // Kiểm tra id trước khi gọi API
        if (id) {
            loadCourseDetail();
        }

        return () => {
            ignore = true;
        };
    }, [id]);


    // LOADING
    if (loading) {
        return (
            <div className="course-detail-page">
                <div className="course-detail-state">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Đang tải khóa học...</span>
                </div>
            </div>
        );
    }

    // ERROR
    if (error) {
        return (
            <div className="course-detail-page">
                <div className="course-detail-container">
                    <Link to="/courses" className="course-detail-back">
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Quay lại khóa học</span>
                    </Link>

                    <div className="course-detail-error">
                        <FontAwesomeIcon icon={faCircleExclamation} />
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    // COURSE NOT FOUND
    if (!course) {
        return (
            <div className="course-detail-page">
                <div className="course-detail-container">
                    <Link to="/courses" className="course-detail-back">
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Quay lại khóa học</span>
                    </Link>

                    <div className="course-detail-error">
                        <FontAwesomeIcon icon={faCircleExclamation} />
                        <span>Không tìm thấy khóa học.</span>
                    </div>
                </div>
            </div>
        );
    }

    const price =
        course.price == null || Number(course.price) === 0
            ? "Miễn phí"
            : `${Number(course.price).toLocaleString("vi-VN")} đ`;

    return (
        <div className="course-detail-page">
            <div className="course-detail-container">
                {/* BACK */}
                <Link to="/courses" className="course-detail-back">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Quay lại khóa học</span>
                </Link>

                {/* COURSE INFORMATION */}
                <section className="course-detail-card">
                    <div className="course-detail-thumbnail">
                        {course.thumbnail ? (
                            <img
                                src={course.thumbnail}
                                alt={course.title || "Khóa học"}
                            />
                        ) : (
                            <div className="course-detail-placeholder">
                                <FontAwesomeIcon icon={faBookOpen} />
                                <span>JLearn</span>
                            </div>
                        )}
                    </div>

                    <div className="course-detail-info">
                        <span className="course-detail-level">
                            {course.level || "Beginner"}
                        </span>

                        <h1>{course.title || "Khóa học"}</h1>

                        <p>
                            {course.description || "Chưa có mô tả."}
                        </p>

                        <div className="course-detail-meta">
                            <div>
                                <span>Giảng viên</span>
                                <strong>
                                    {course.instructorName ||
                                        course.instructorId ||
                                        "JLearn"}
                                </strong>
                            </div>

                            <div>
                                <span>Số bài học</span>
                                <strong>{lessons.length}</strong>
                            </div>

                            <div>
                                <span>Giá</span>
                                <strong>{price}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LESSONS */}
                <section className="course-lessons">
                    <div className="course-lessons-header">
                        <div>
                            <span>COURSE CONTENT</span>
                            <h2>Nội dung khóa học</h2>
                        </div>

                        <div className="lesson-count">
                            {lessons.length} bài học
                        </div>
                    </div>

                    {lessons.length === 0 ? (
                        <div className="course-detail-state">
                            <FontAwesomeIcon
                                icon={faCircleExclamation}
                            />
                            <span>Khóa học chưa có bài học.</span>
                        </div>
                    ) : (
                        <div className="lessons-list">
                            {lessons.map((lesson, index) => (
                                <LessonItem
                                    key={lesson.id ?? lesson.lessonId ?? index}
                                    lesson={lesson}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function LessonItem({ lesson, index }) {
    const lessonId = lesson.id ?? lesson.lessonId;
    const lessonOrder = lesson.lessonOrder || index + 1;

    return (
        <Link
            to={`/lessons/${lessonId}`}
            className="lesson-item"
        >
            <div className="lesson-number">{lessonOrder}</div>

            <div className="lesson-play">
                <FontAwesomeIcon icon={faPlay} />
            </div>

            <div className="lesson-info">
                <h3>{lesson.title || `Bài học ${lessonOrder}`}</h3>
                <p>
                    {lesson.description || "Xem nội dung bài học."}
                </p>
            </div>

            

            <span className="lesson-arrow">
                <FontAwesomeIcon icon={faArrowRight} />
            </span>
        </Link>
    );
}

export default CourseDetail;
