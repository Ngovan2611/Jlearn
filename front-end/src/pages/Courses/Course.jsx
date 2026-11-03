
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faGraduationCap,
    faMagnifyingGlass,
    faArrowRight,
    faCheck,
    faSpinner,
    faCircleExclamation,
    faClock,
    faLayerGroup,
    faCode,
    faChevronLeft,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import Navbar from "../../components/layout/Navbar/Navbar";
import courseService from "../../services/courseService";
import enrollmentService from "../../services/enrollmentService";

import "./Course.css";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 350;

const DEFAULT_PAGE_INFO = {
    currentPage: 0,
    pageSize: PAGE_SIZE,
    totalPages: 0,
    totalElements: 0,
};

function normalizeId(value) {
    return value == null ? "" : String(value);
}

function extractResult(response) {
    return response?.data?.result ?? response?.data ?? response;
}

function extractArray(response) {
    const result = extractResult(response);

    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.content)) return result.content;

    return [];
}

function isActiveEnrollment(enrollment) {
    return enrollment?.status?.toUpperCase() !== "CANCELLED";
}

function Courses() {
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [enrollmentLoading, setEnrollmentLoading] = useState(true);
    const [enrollingCourseId, setEnrollingCourseId] = useState(null);

    const [error, setError] = useState("");
    const [enrollmentError, setEnrollmentError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageInfo, setPageInfo] = useState(DEFAULT_PAGE_INFO);
    const [reloadKey, setReloadKey] = useState(0);

    const searchTimeoutRef = useRef(null);
    const requestIdRef = useRef(0);
    const enrollingRef = useRef(false);

    const navigate = useNavigate();

    // Hủy timer khi rời trang.
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Tải danh sách khóa học theo trang và từ khóa.
    useEffect(() => {
        let cancelled = false;
        const requestId = ++requestIdRef.current;

        async function loadCourses() {
            try {
                const response = await courseService.getAllCourses({
                    keyword,
                    page: currentPage,
                    size: PAGE_SIZE,
                });

                if (cancelled || requestId !== requestIdRef.current) {
                    return;
                }

                const result = extractResult(response);
                const data = extractArray(response);

                setCourses(data);
                setPageInfo({
                    currentPage: result?.currentPage ?? currentPage,
                    pageSize: result?.pageSize ?? PAGE_SIZE,
                    totalPages: result?.totalPages ?? 0,
                    totalElements: result?.totalElements ?? data.length,
                });

                setError("");
            } catch (err) {
                if (cancelled || requestId !== requestIdRef.current) {
                    return;
                }

                console.error("Get courses failed:", err);

                setCourses([]);
                setPageInfo(DEFAULT_PAGE_INFO);
                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.result?.message ||
                    "Không thể tải danh sách khóa học."
                );
            } finally {
                if (!cancelled && requestId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        }

        loadCourses();

        return () => {
            cancelled = true;
        };
    }, [keyword, currentPage, reloadKey]);

    // Tải trạng thái đăng ký của người dùng.
    useEffect(() => {
        let cancelled = false;

        async function loadEnrollments() {
            try {
                const response = await enrollmentService.getMyEnrollments();

                if (cancelled) return;

                setEnrollments(extractArray(response));
            } catch (err) {
                if (cancelled) return;

                console.error("Get enrollments failed:", err);
                setEnrollmentError(
                    "Không thể tải trạng thái đăng ký. Vui lòng tải lại trang."
                );
            } finally {
                if (!cancelled) {
                    setEnrollmentLoading(false);
                }
            }
        }

        loadEnrollments();

        return () => {
            cancelled = true;
        };
    }, []);

    // Kiểm tra người dùng đã đăng ký khóa học chưa.
    const isEnrolled = useCallback(
        (courseId) =>
            enrollments.some(
                (item) =>
                    normalizeId(item.courseId) === normalizeId(courseId) &&
                    isActiveEnrollment(item)
            ),
        [enrollments]
    );

    // Tìm kiếm có debounce.
    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchInput(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const nextKeyword = value.trim();

            setKeyword((previous) =>
                previous === nextKeyword ? previous : nextKeyword
            );

            setCurrentPage(0);
        }, SEARCH_DEBOUNCE_MS);
    };

    const handleClearSearch = () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        setSearchInput("");
        setKeyword("");
        setCurrentPage(0);
    };

    const handlePageChange = (page) => {
        if (
            loading ||
            page < 0 ||
            page >= pageInfo.totalPages ||
            page === currentPage
        ) {
            return;
        }

        setLoading(true);
        setCurrentPage(page);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleRetry = () => {
        setLoading(true);
        setReloadKey((previous) => previous + 1);
    };

    // Đăng ký khóa học; không điều hướng khi đăng ký thành công.
    const handleEnroll = async (courseId) => {
        if (enrollingRef.current || isEnrolled(courseId)) {
            return;
        }

        enrollingRef.current = true;
        setEnrollingCourseId(courseId);
        setEnrollmentError("");

        try {
            const response = await enrollmentService.enroll(courseId);
            const result = extractResult(response);

            const newEnrollment = {
                ...(result && !Array.isArray(result) ? result : {}),
                courseId: result?.courseId ?? courseId,
                status: result?.status ?? "ACTIVE",
            };

            // Cập nhật state để nút đổi thành "Vào học".
            setEnrollments((previous) => {
                const filtered = previous.filter(
                    (item) =>
                        normalizeId(item.courseId) !== normalizeId(courseId)
                );

                return [...filtered, newEnrollment];
            });
        } catch (err) {
            console.error("Enroll course failed:", err);

            const message =
                err?.response?.data?.message ||
                err?.response?.data?.result?.message ||
                "Không thể đăng ký khóa học.";

            setEnrollmentError(message);
            window.alert(message);
        } finally {
            enrollingRef.current = false;
            setEnrollingCourseId(null);
        }
    };

    const renderPagination = () => {
        const { totalPages } = pageInfo;

        if (totalPages <= 1) return null;

        const startPage = Math.max(0, currentPage - 2);
        const endPage = Math.min(totalPages - 1, currentPage + 2);
        const pages = Array.from(
            { length: endPage - startPage + 1 },
            (_, index) => startPage + index
        );

        return (
            <nav
                className="courses-pagination"
                aria-label="Phân trang khóa học"
            >
                <button
                    type="button"
                    className="courses-page-arrow"
                    disabled={currentPage === 0 || loading}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label="Trang trước"
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                {startPage > 0 && (
                    <>
                        <button
                            type="button"
                            className="courses-page-button"
                            disabled={loading}
                            onClick={() => handlePageChange(0)}
                        >
                            1
                        </button>

                        {startPage > 1 && (
                            <span className="courses-page-ellipsis">…</span>
                        )}
                    </>
                )}

                {pages.map((page) => (
                    <button
                        type="button"
                        key={page}
                        className={`courses-page-button ${
                            page === currentPage ? "is-active" : ""
                        }`}
                        aria-current={
                            page === currentPage ? "page" : undefined
                        }
                        disabled={loading}
                        onClick={() => handlePageChange(page)}
                    >
                        {page + 1}
                    </button>
                ))}

                {endPage < totalPages - 1 && (
                    <>
                        {endPage < totalPages - 2 && (
                            <span className="courses-page-ellipsis">…</span>
                        )}

                        <button
                            type="button"
                            className="courses-page-button"
                            disabled={loading}
                            onClick={() => handlePageChange(totalPages - 1)}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    type="button"
                    className="courses-page-arrow"
                    disabled={currentPage >= totalPages - 1 || loading}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label="Trang sau"
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            </nav>
        );
    };

    return (
        <div className="courses-page">
            <Navbar />

            <main className="courses-container">
                <section className="courses-hero">
                    <div className="courses-hero-content">
                        <span className="courses-label">
                            <FontAwesomeIcon icon={faGraduationCap} />
                            <span>JLEARN ACADEMY</span>
                        </span>

                        <h1>
                            Khám phá khóa học,
                            <br />
                            <span>làm chủ Java.</span>
                        </h1>

                        <p>
                            Xây dựng nền tảng lập trình vững chắc với các
                            khóa học từ cơ bản đến nâng cao. Học theo lộ
                            trình và phát triển kỹ năng từng ngày.
                        </p>

                        <div className="courses-hero-stats">
                            <div className="courses-stat-icon">
                                <FontAwesomeIcon icon={faBookOpen} />
                            </div>
                            

                            <div className="courses-stat-divider" />

                            <div className="courses-stat-icon">
                                <FontAwesomeIcon icon={faCode} />
                            </div>
                            
                        </div>
                    </div>

                    <div className="courses-hero-art" aria-hidden="true">
                        <div className="courses-art-circle">
                            <FontAwesomeIcon icon={faGraduationCap} />
                        </div>

                        <div className="courses-art-card courses-art-card-top">
                            <FontAwesomeIcon icon={faCheck} />
                            <span>Học theo lộ trình</span>
                        </div>

                        <div className="courses-art-card courses-art-card-bottom">
                            <FontAwesomeIcon icon={faCode} />
                            <span>Thực hành mỗi ngày</span>
                        </div>
                    </div>
                </section>

                <section className="courses-catalog">
                    <div className="courses-header">
                        <div>
                            <span className="courses-section-label">
                                LEARNING PATH
                            </span>
                            <h2>Danh sách khóa học</h2>
                            <p>
                                Chọn khóa học phù hợp với mục tiêu của bạn.
                            </p>
                        </div>

                        <div className="courses-count">
                            <FontAwesomeIcon icon={faLayerGroup} />
                            <span>{pageInfo.totalElements} khóa học</span>
                        </div>
                    </div>

                    <div className="courses-toolbar">
                        <div className="courses-search">
                            <FontAwesomeIcon icon={faMagnifyingGlass} />

                            <input
                                type="search"
                                value={searchInput}
                                onChange={handleSearchChange}
                                placeholder="Tìm khóa học, chủ đề..."
                                aria-label="Tìm khóa học"
                            />

                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    aria-label="Xóa tìm kiếm"
                                >
                                    
                                </button>   
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="courses-message courses-error">
                            <FontAwesomeIcon icon={faCircleExclamation} />
                            <span>{error}</span>
                            <button type="button" onClick={handleRetry}>
                                Thử lại
                            </button>
                        </div>
                    )}

                    {enrollmentError && (
                        <div className="courses-message courses-error">
                            <FontAwesomeIcon icon={faCircleExclamation} />
                            <span>{enrollmentError}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="courses-loading">
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                className="courses-spinner"
                            />
                            <h3>Đang tải khóa học</h3>
                            <p>Vui lòng chờ trong giây lát...</p>
                        </div>
                    ) : !error && courses.length === 0 ? (
                        <div className="courses-empty">
                            <div className="courses-empty-icon">
                                <FontAwesomeIcon icon={faBookOpen} />
                            </div>
                            <h3>Không tìm thấy khóa học</h3>
                            <p>
                                Thử từ khóa khác hoặc quay lại sau nhé.
                            </p>

                            {keyword && (
                                <button
                                    type="button"
                                    className="courses-reset-button"
                                    onClick={handleClearSearch}
                                >
                                    Xóa tìm kiếm
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="courses-grid">
                                {courses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        enrolled={isEnrolled(course.id)}
                                        enrolling={
                                            normalizeId(enrollingCourseId) ===
                                            normalizeId(course.id)
                                        }
                                        enrollmentLoading={enrollmentLoading}
                                        onEnroll={handleEnroll}
                                        onLearn={() =>
                                            navigate(`/courses/${course.id}`)
                                        }
                                    />
                                ))}
                            </div>

                            <div className="courses-pagination-summary">
                                Trang {currentPage + 1}
                                {pageInfo.totalPages > 0
                                    ? ` / ${pageInfo.totalPages}`
                                    : ""}
                                {" · "}
                                {pageInfo.totalElements} khóa học
                            </div>

                            {renderPagination()}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}

function CourseCard({
    course,
    enrolled,
    enrolling,
    enrollmentLoading,
    onEnroll,
    onLearn,
}) {
    const price =
        course.price == null || Number(course.price) === 0
            ? "Miễn phí"
            : `${Number(course.price).toLocaleString("vi-VN")} đ`;

    return (
        <article className="catalog-course-card">
            <div className="catalog-course-thumbnail">
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title || "Khóa học"}
                    />
                ) : (
                    <div className="catalog-course-placeholder">
                        <FontAwesomeIcon icon={faGraduationCap} />
                    </div>
                )}

                <span className="catalog-course-level">
                    {course.level || "Beginner"}
                </span>
            </div>

            <div className="catalog-course-body">
                <div className="catalog-course-category">
                    <FontAwesomeIcon icon={faCode} />
                    <span>JAVA PROGRAMMING</span>
                </div>

                <h3>{course.title || "Khóa học Java"}</h3>

                

                <div className="catalog-course-info">
                    <span>
                        <FontAwesomeIcon icon={faLayerGroup} />
                        {course.level || "Chưa xác định"}
                    </span>

                    <span>
                        <FontAwesomeIcon icon={faClock} />
                        Học trực tuyến
                    </span>
                </div>

                <div className="catalog-course-footer">
                    <div className="catalog-course-price">{price}</div>

                    <div className="catalog-course-actions">
                        {enrolled ? (
                            <button
                                type="button"
                                className="catalog-button catalog-button-enrolled"
                                onClick={onLearn}
                            >
                                <FontAwesomeIcon icon={faBookOpen} />
                                Vào học
                                <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="catalog-button catalog-button-primary"
                                disabled={enrolling || enrollmentLoading}
                                onClick={() => onEnroll(course.id)}
                            >
                                {enrolling ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Đang đăng ký...
                                    </>
                                ) : (
                                    <>
                                        Đăng ký
                                        <FontAwesomeIcon icon={faArrowRight} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

export default Courses;
