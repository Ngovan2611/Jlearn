import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Users,
    Percent,
    RefreshCw,
    Search,
    TrendingUp,
    PieChart as PieChartIcon,
    CheckCircle2,
    GraduationCap,
    CircleHelp,
} from "lucide-react";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import adminDashboardService from "../../../services/admin/adminDashboardService";
import "./CourseStatisticsPage.css";

const COMPLETED_COLOR = "#6366f1";
const INCOMPLETE_COLOR = "#e5e7eb";

function unwrapResponse(response) {
    let data = response?.data ?? response;

    if (
        data &&
        Object.prototype.hasOwnProperty.call(data, "result")
    ) {
        data = data.result;
    }

    return data;
}

function formatNumber(value) {
    return Number(value ?? 0).toLocaleString("vi-VN");
}

function formatPercent(value) {
    return `${Number(value ?? 0).toLocaleString("vi-VN", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
    })}%`;
}

function getEnrollmentCount(course) {
    return Math.max(
        0,
        Number(course?.enrollmentCount ?? 0) || 0
    );
}

function getCompletedCount(course) {
    return Math.min(
        getEnrollmentCount(course),
        Math.max(0, Number(course?.completedCount ?? 0) || 0)
    );
}

function getCompletionRate(course) {
    const total = getEnrollmentCount(course);

    if (total === 0) return 0;

    return (getCompletedCount(course) / total) * 100;
}

/**
 * Biểu đồ Doughnut riêng cho từng khóa học.
 */
function CourseCompletionChart({ course }) {
    const total = getEnrollmentCount(course);
    const completed = getCompletedCount(course);
    const incomplete = Math.max(0, total - completed);
    const completionRate = getCompletionRate(course);

    const chartData = [
        {
            name: "Đã hoàn thành",
            value: completed,
            color: COMPLETED_COLOR,
        },
        {
            name: "Chưa hoàn thành",
            value: incomplete,
            color: INCOMPLETE_COLOR,
        },
    ];

    return (
        <article className="cs-completion-card">
            <div className="cs-completion-card-top">
                <div className="cs-completion-book-icon">
                    <BookOpen size={19} />
                </div>

                <span
                    className={`cs-completion-status ${
                        total === 0
                            ? "is-empty"
                            : completionRate === 100
                              ? "is-complete"
                              : "is-progress"
                    }`}
                >
                    {total === 0
                        ? "Chưa có học viên"
                        : completionRate === 100
                          ? "Đã hoàn thành"
                          : "Đang theo dõi"}
                </span>
            </div>

            <h3
                className="cs-completion-title"
                title={course.courseTitle}
            >
                {course.courseTitle}
            </h3>

            <div className="cs-completion-chart">
                <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={66}
                            outerRadius={88}
                            paddingAngle={total > 0 ? 3 : 0}
                            stroke="none"
                            isAnimationActive={false}
                        >
                            {chartData.map((item) => (
                                <Cell
                                    key={item.name}
                                    fill={item.color}
                                />
                            ))}
                        </Pie>

                        <Tooltip
                            formatter={(value, name) => [
                                `${formatNumber(value)} học viên`,
                                name,
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="cs-completion-center">
                    <strong>{formatPercent(completionRate)}</strong>
                    <span>Hoàn thành</span>
                </div>
            </div>

            <div className="cs-completion-total">
                <span>Tổng lượt đăng ký</span>
                <strong>{formatNumber(total)}</strong>
            </div>

            <div className="cs-completion-divider" />

            <div className="cs-completion-stats">
                <div className="cs-completion-stat">
                    <span className="cs-completion-dot completed" />

                    <span className="cs-completion-stat-label">
                        Đã hoàn thành
                    </span>

                    <strong>{formatNumber(completed)}</strong>
                </div>

                <div className="cs-completion-stat">
                    <span className="cs-completion-dot incomplete" />

                    <span className="cs-completion-stat-label">
                        Chưa hoàn thành
                    </span>

                    <strong>{formatNumber(incomplete)}</strong>
                </div>
            </div>

            {total === 0 && (
                <div className="cs-completion-empty-note">
                    <CircleHelp size={14} />
                    Chưa có dữ liệu đăng ký
                </div>
            )}
        </article>
    );
}

function CourseStatisticsPage() {
    const [overview, setOverview] = useState({
        totalEnrollments: 0,
        totalCoursesWithEnrollments: 0,
        courses: [],
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [sortBy, setSortBy] = useState("completionRate");

    const loadStatistics = useCallback(async () => {
        try {
            const response =
                await adminDashboardService.getCourseEnrollmentStatistics();

            const data = unwrapResponse(response);

            if (!data || !Array.isArray(data.courses)) {
                throw new Error(
                    "Dữ liệu thống kê khóa học không hợp lệ."
                );
            }

            const courses = data.courses.map((course, index) => ({
                ...course,
                courseId: String(
                    course.courseId ?? `course-${index}`
                ),
                courseTitle:
                    course.courseTitle || "Khóa học chưa có tên",
                enrollmentCount: getEnrollmentCount(course),
                completedCount: getCompletedCount(course),
                thumbnail: course.thumbnail || "",
            }));

            const totalEnrollments = courses.reduce(
                (sum, course) => sum + course.enrollmentCount,
                0
            );

            const totalCoursesWithEnrollments = courses.filter(
                (course) => course.enrollmentCount > 0
            ).length;

            setOverview({
                totalEnrollments,
                totalCoursesWithEnrollments,
                courses,
            });

            setError("");
        } catch (err) {
            console.error("Lỗi tải thống kê khóa học:", err);

            setError(
                "Không thể tải thống kê khóa học. Vui lòng kiểm tra API backend."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const fetchData = async () => {
            if (!isCancelled) {
                await loadStatistics();
            }
        };

        void fetchData();

        return () => {
            isCancelled = true;
        };
    }, [loadStatistics]);

    const refresh = useCallback(async () => {
        if (refreshing || loading) return;

        setRefreshing(true);
        await loadStatistics();
    }, [refreshing, loading, loadStatistics]);

    const filteredCourses = useMemo(() => {
        const normalizedKeyword = keyword
            .trim()
            .toLocaleLowerCase("vi");

        return [...overview.courses]
            .filter((course) =>
                course.courseTitle
                    .toLocaleLowerCase("vi")
                    .includes(normalizedKeyword)
            )
            .sort((a, b) => {
                if (sortBy === "courseTitle") {
                    return a.courseTitle.localeCompare(
                        b.courseTitle,
                        "vi"
                    );
                }

                if (sortBy === "enrollmentCount") {
                    return b.enrollmentCount - a.enrollmentCount;
                }

                if (sortBy === "completionRate") {
                    return (
                        getCompletionRate(b) - getCompletionRate(a)
                    );
                }

                return b.enrollmentCount - a.enrollmentCount;
            });
    }, [overview.courses, keyword, sortBy]);

    const totalCompleted = useMemo(
        () =>
            overview.courses.reduce(
                (sum, course) => sum + course.completedCount,
                0
            ),
        [overview.courses]
    );

    const overallCompletionRate =
        overview.totalEnrollments > 0
            ? (totalCompleted / overview.totalEnrollments) * 100
            : 0;

    return (
        <div className="course-statistics-page">
            {/* Header */}
            <header className="cs-heading">
                <div className="cs-heading-content">
                    <span className="cs-eyebrow">
                        JLEARN ADMINISTRATION
                    </span>

                    <h1>Thống kê khóa học</h1>

                    <p>
                        Theo dõi tiến độ học tập và tỷ lệ hoàn thành
                        của từng khóa học trên hệ thống.
                    </p>
                </div>

                <button
                    type="button"
                    className="cs-refresh"
                    onClick={refresh}
                    disabled={refreshing || loading}
                >
                    <RefreshCw
                        size={17}
                        className={refreshing ? "cs-spin" : ""}
                    />

                    {refreshing ? "Đang tải..." : "Làm mới dữ liệu"}
                </button>
            </header>

            {/* Error */}
            {error && (
                <div className="cs-error" role="alert">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => {
                            setLoading(true);
                            setRefreshing(true);
                            void loadStatistics();
                        }}
                        disabled={refreshing}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Summary cards */}
            <section className="cs-summary-grid">
                <article className="cs-summary-card">
                    <div className="cs-summary-card-top">
                        <div className="cs-summary-icon purple">
                            <Users size={21} />
                        </div>

                        <span className="cs-summary-caption">
                            Đăng ký hợp lệ
                        </span>
                    </div>

                    <strong className="cs-summary-value">
                        {loading
                            ? "..."
                            : formatNumber(overview.totalEnrollments)}
                    </strong>

                    <span className="cs-summary-description">
                        Tổng lượt đăng ký các khóa học
                    </span>
                </article>

                <article className="cs-summary-card">
                    <div className="cs-summary-card-top">
                        <div className="cs-summary-icon green">
                            <CheckCircle2 size={21} />
                        </div>

                        <span className="cs-summary-caption">
                            Đã hoàn thành
                        </span>
                    </div>

                    <strong className="cs-summary-value">
                        {loading ? "..." : formatNumber(totalCompleted)}
                    </strong>

                    <span className="cs-summary-description">
                        Tổng lượt đăng ký đã hoàn thành
                    </span>
                </article>

                <article className="cs-summary-card">
                    <div className="cs-summary-card-top">
                        <div className="cs-summary-icon blue">
                            <Percent size={21} />
                        </div>

                        <span className="cs-summary-caption">
                            Tỷ lệ hoàn thành
                        </span>
                    </div>

                    <strong className="cs-summary-value">
                        {loading
                            ? "..."
                            : formatPercent(overallCompletionRate)}
                    </strong>

                    <span className="cs-summary-description">
                        Trên tổng lượt đăng ký hợp lệ
                    </span>
                </article>

                <article className="cs-summary-card">
                    <div className="cs-summary-card-top">
                        <div className="cs-summary-icon orange">
                            <GraduationCap size={21} />
                        </div>

                        <span className="cs-summary-caption">
                            Tổng khóa học
                        </span>
                    </div>

                    <strong className="cs-summary-value">
                        {loading
                            ? "..."
                            : formatNumber(overview.courses.length)}
                    </strong>

                    <span className="cs-summary-description">
                        Bao gồm khóa học chưa có học viên
                    </span>
                </article>
            </section>

            {/* Per-course doughnut charts */}
            <section className="cs-panel cs-completion-panel">
                <div className="cs-panel-heading">
                    <div>
                        <div className="cs-section-eyebrow">
                            COURSE PERFORMANCE
                        </div>

                        <h2>Tỷ lệ hoàn thành theo khóa học</h2>

                        <p>
                            Mỗi biểu đồ thể hiện tỷ lệ hoàn thành và
                            số lượt đăng ký chưa hoàn thành của một khóa học.
                        </p>
                    </div>

                    <div className="cs-panel-heading-icon">
                        <PieChartIcon size={22} />
                    </div>
                </div>

                {loading ? (
                    <div className="cs-empty">
                        <RefreshCw size={22} className="cs-spin" />
                        <span>Đang tải dữ liệu khóa học...</span>
                    </div>
                ) : overview.courses.length === 0 ? (
                    <div className="cs-empty">
                        <BookOpen size={28} />
                        <strong>Chưa có khóa học</strong>
                        <span>
                            Hiện chưa có khóa học để hiển thị thống kê.
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="cs-chart-toolbar">
                            <span>
                                Hiển thị{" "}
                                <strong>
                                    {formatNumber(filteredCourses.length)}
                                </strong>{" "}
                                khóa học
                            </span>

                            <span className="cs-chart-legend-explanation">
                                <i className="cs-completion-dot completed" />
                                Đã hoàn thành

                                <i className="cs-completion-dot incomplete" />
                                Chưa hoàn thành
                            </span>
                        </div>

                        {filteredCourses.length === 0 ? (
                            <div className="cs-empty">
                                Không tìm thấy khóa học phù hợp.
                            </div>
                        ) : (
                            <div className="cs-completion-grid">
                                {filteredCourses.map((course) => (
                                    <CourseCompletionChart
                                        key={course.courseId}
                                        course={course}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Course ranking */}
            <section className="cs-panel">
                <div className="cs-panel-heading">
                    <div>
                        <div className="cs-section-eyebrow">
                            COURSE OVERVIEW
                        </div>

                        <h2>Khóa học nổi bật</h2>

                        <p>
                            Tối đa 5 khóa học có tỷ lệ hoàn thành cao
                            nhất theo dữ liệu hiện tại.
                        </p>
                    </div>

                    <div className="cs-panel-heading-icon">
                        <TrendingUp size={22} />
                    </div>
                </div>

                {loading ? (
                    <div className="cs-empty">Đang tải thống kê...</div>
                ) : (
                    <div className="cs-ranking-list">
                        {[...overview.courses]
                            .sort(
                                (a, b) =>
                                    getCompletionRate(b) -
                                    getCompletionRate(a)
                            )
                            .slice(0, 5)
                            .map((course, index) => {
                                const rate = getCompletionRate(course);

                                return (
                                    <div
                                        className="cs-ranking-item"
                                        key={course.courseId}
                                    >
                                        <div className="cs-ranking-number">
                                            {index + 1}
                                        </div>

                                        <div className="cs-ranking-info">
                                            <div className="cs-ranking-title">
                                                <strong>
                                                    {course.courseTitle}
                                                </strong>

                                                <span>
                                                    {formatNumber(
                                                        course.completedCount
                                                    )}{" "}
                                                    /{" "}
                                                    {formatNumber(
                                                        course.enrollmentCount
                                                    )} lượt
                                                </span>
                                            </div>

                                            <div className="cs-progress-track">
                                                <div
                                                    className="cs-progress-fill"
                                                    style={{
                                                        width: `${rate}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <strong className="cs-ranking-percent">
                                            {formatPercent(rate)}
                                        </strong>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </section>

            {/* Detail table */}
            <section className="cs-panel cs-table-panel">
                <div className="cs-panel-heading">
                    <div>
                        <div className="cs-section-eyebrow">
                            DETAILED REPORT
                        </div>

                        <h2>Chi tiết thống kê</h2>

                        <p>
                            Tra cứu số lượt đăng ký, số lượt hoàn thành
                            và tỷ lệ hoàn thành của từng khóa học.
                        </p>
                    </div>
                </div>

                <div className="cs-toolbar">
                    <label className="cs-search">
                        <Search size={18} />

                        <input
                            value={keyword}
                            onChange={(event) =>
                                setKeyword(event.target.value)
                            }
                            placeholder="Tìm tên khóa học..."
                        />
                    </label>

                    <select
                        value={sortBy}
                        onChange={(event) =>
                            setSortBy(event.target.value)
                        }
                        aria-label="Sắp xếp khóa học"
                    >
                        <option value="completionRate">
                            Tỷ lệ hoàn thành giảm dần
                        </option>

                        <option value="enrollmentCount">
                            Lượt đăng ký giảm dần
                        </option>

                        <option value="courseTitle">
                            Tên khóa học A–Z
                        </option>
                    </select>
                </div>

                <div className="cs-table-wrapper">
                    <table className="cs-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Khóa học</th>
                                <th>Tổng đăng ký</th>
                                <th>Đã hoàn thành</th>
                                <th>Chưa hoàn thành</th>
                                <th>Tỷ lệ hoàn thành</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading && filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="cs-empty-cell">
                                        Không tìm thấy khóa học phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredCourses.map((course, index) => {
                                    const total = getEnrollmentCount(course);
                                    const completed = getCompletedCount(course);
                                    const incomplete = Math.max(
                                        0,
                                        total - completed
                                    );
                                    const rate = getCompletionRate(course);

                                    return (
                                        <tr key={course.courseId}>
                                            <td>{index + 1}</td>

                                            <td>
                                                <div className="cs-course-cell">
                                                    {course.thumbnail ? (
                                                        <img
                                                            src={course.thumbnail}
                                                            alt=""
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="cs-course-placeholder">
                                                            <BookOpen size={20} />
                                                        </div>
                                                    )}

                                                    <strong>
                                                        {course.courseTitle}
                                                    </strong>
                                                </div>
                                            </td>

                                            <td className="cs-number">
                                                {formatNumber(total)}
                                            </td>

                                            <td className="cs-number cs-completed-number">
                                                {formatNumber(completed)}
                                            </td>

                                            <td className="cs-number">
                                                {formatNumber(incomplete)}
                                            </td>

                                            <td>
                                                <div className="cs-share-cell">
                                                    <strong>
                                                        {formatPercent(rate)}
                                                    </strong>

                                                    <div className="cs-mini-track">
                                                        <div
                                                            style={{
                                                                width: `${rate}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="cs-table-footer">
                    Hiển thị {formatNumber(filteredCourses.length)} /{" "}
                    {formatNumber(overview.courses.length)} khóa học
                </div>
            </section>
        </div>
    );
}

export default CourseStatisticsPage;
