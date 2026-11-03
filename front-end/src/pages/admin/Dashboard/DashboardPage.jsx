import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Users,
    BookOpen,
    Code2,
    ClipboardCheck,
    ArrowUpRight,
    CheckCircle2,
    Bot,
    Activity,
    RefreshCw,
    GraduationCap,
    Percent,
    Star,
} from "lucide-react";

import adminDashboardService from "../../../services/admin/adminDashboardService";
import "./DashboardPage.css";

// =========================================================
// CẤU HÌNH THỐNG KÊ
// =========================================================

const STAT_DEFINITIONS = [
    {
        key: "users",
        label: "Tổng người dùng",
        icon: Users,
        color: "blue",
        note: "Tổng tài khoản học viên",
    },
    {
        key: "courses",
        label: "Khóa học",
        icon: BookOpen,
        color: "purple",
        note: "Tổng số khóa học",
    },
    {
        key: "exercises",
        label: "Bài tập",
        icon: Code2,
        color: "orange",
        note: "Tổng số bài tập",
    },
    {
        key: "submissions",
        label: "Bản ghi bài nộp",
        icon: ClipboardCheck,
        color: "green",
        note: "Tổng số bản ghi bài nộp",
    },
    {
        key: "enrollments",
        label: "Lượt đăng ký",
        icon: GraduationCap,
        color: "blue",
        note: "Lượt đăng ký chưa bị hủy",
    },
    {
        key: "completionRate",
        label: "Tỷ lệ hoàn thành",
        icon: Percent,
        color: "green",
        note: "Tỷ lệ đăng ký đã hoàn thành",
    },
    {
        key: "averageScore",
        label: "Điểm trung bình",
        icon: Star,
        color: "orange",
        note: "Điểm trung bình bài nộp đã chấm",
    },
];

const PERIOD_API = {
    "7 ngày": "7d",
    "30 ngày": "30d",
    "90 ngày": "90d",
};

const INITIAL_STATS = {
    users: null,
    courses: null,
    exercises: null,
    submissions: null,
    enrollments: null,
    completionRate: null,
    averageScore: null,
};

const INITIAL_SUBMISSION_STATUS = [
    { key: "completed", name: "Đã chấm xong", value: 0, color: "#16a34a" },
    { key: "failed", name: "Thất bại", value: 0, color: "#ef4444" },
    { key: "pending", name: "Đang chờ", value: 0, color: "#f59e0b" },
    { key: "grading", name: "Đang chấm", value: 0, color: "#8b5cf6" },
];

const GENDER_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#94a3b8"];

// =========================================================
// CHUẨN HÓA RESPONSE
// =========================================================

function unwrapResponse(response) {
    let data = response?.data ?? response;
    if (
        data &&
        typeof data === "object" &&
        Object.prototype.hasOwnProperty.call(data, "result")
    ) {
        data = data.result;
    }
    return data;
}

function toValidNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        typeof value === "boolean"
    ) {
        return null;
    }
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
}

function extractCount(response, candidates = []) {
    const data = unwrapResponse(response);
    const directValue = toValidNumber(data);

    if (directValue !== null) {
        return directValue;
    }

    if (data && typeof data === "object" && !Array.isArray(data)) {
        const keys = [
            ...candidates,
            "total",
            "count",
            "totalUsers",
            "totalProfiles",
            "totalCourses",
            "totalExercises",
            "totalSubmissions",
        ];

        for (const key of keys) {
            const value = toValidNumber(data[key]);
            if (value !== null) {
                return value;
            }
        }
    }

    throw new Error("API không trả về số liệu tổng hợp hợp lệ.");
}

function extractEnrollmentStatistics(response) {
    const data = unwrapResponse(response);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Dữ liệu thống kê đăng ký không hợp lệ.");
    }

    const totalEnrollments = toValidNumber(data.totalEnrollments);
    const completionRate = toValidNumber(data.completionRate);

    if (totalEnrollments === null || completionRate === null) {
        throw new Error("API đăng ký cần trả về totalEnrollments và completionRate.");
    }

    return { enrollments: totalEnrollments, completionRate };
}

function extractAverageScore(response) {
    const data = unwrapResponse(response);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Dữ liệu thống kê điểm không hợp lệ.");
    }

    const averageScore = toValidNumber(data.averageScore);
    if (averageScore === null) {
        throw new Error("API không trả về averageScore hợp lệ.");
    }

    return averageScore;
}

function normalizeSubmissionStatus(response) {
    const data = unwrapResponse(response);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Dữ liệu trạng thái bài nộp không hợp lệ.");
    }

    const candidates = {
        completed: ["completed", "COMPLETED"],
        failed: ["failed", "FAILED"],
        pending: ["pending", "PENDING"],
        grading: ["grading", "GRADING"],
    };

    return INITIAL_SUBMISSION_STATUS.map((item) => {
        const rawValue = candidates[item.key]
            .map((key) => data[key])
            .find((value) => value !== undefined && value !== null);

        const value = toValidNumber(rawValue ?? 0);
        if (value === null) {
            throw new Error(`Giá trị trạng thái "${item.key}" không hợp lệ.`);
        }

        return { ...item, value };
    });
}

function normalizeActivity(response) {
    const data = unwrapResponse(response);
    if (
        !data ||
        typeof data !== "object" ||
        !Array.isArray(data.labels) ||
        !Array.isArray(data.submissions)
    ) {
        throw new Error("API hoạt động cần trả về labels và submissions dạng mảng.");
    }

    if (data.labels.length !== data.submissions.length) {
        throw new Error("Số lượng nhãn và số liệu hoạt động không khớp.");
    }

    return data.labels.map((label, index) => {
        const value = toValidNumber(data.submissions[index] ?? 0);
        if (value === null) {
            throw new Error("Số liệu hoạt động không hợp lệ.");
        }
        return { day: String(label), submissions: value };
    });
}

function normalizeGenderDistribution(response) {
    const data = unwrapResponse(response);
    const distribution = data?.genderDistribution ?? data;

    if (!distribution || typeof distribution !== "object" || Array.isArray(distribution)) {
        throw new Error("Dữ liệu thống kê giới tính không hợp lệ.");
    }

    const labels = {
        male: "Nam", female: "Nữ", other: "Khác", unknown: "Chưa xác định",
        nam: "Nam", nữ: "Nữ", khac: "Khác", khác: "Khác",
        "không xác định": "Chưa xác định", "chưa xác định": "Chưa xác định",
    };

    return Object.entries(distribution).map(([gender, rawValue]) => {
        const value = toValidNumber(rawValue);
        if (value === null) {
            throw new Error(`Số liệu giới tính "${gender}" không hợp lệ.`);
        }
        const normalizedKey = gender.trim().toLowerCase();
        return {
            name: labels[normalizedKey] ?? gender.trim(),
            value,
        };
    });
}

function formatCount(value) {
    return value === null || value === undefined ? "—" : Number(value).toLocaleString("vi-VN");
}

function formatPercent(value) {
    return value === null || value === undefined
        ? "—"
        : `${Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
}

function formatScore(value) {
    return value === null || value === undefined
        ? "—"
        : Number(value).toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// =========================================================
// DASHBOARD PAGE
// =========================================================

function DashboardPage() {
    const [period, setPeriod] = useState("7 ngày");

    const [stats, setStats] = useState(INITIAL_STATS);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const [activityData, setActivityData] = useState([]);
    const [submissionData, setSubmissionData] = useState(INITIAL_SUBMISSION_STATUS);
    const [chartLoading, setChartLoading] = useState(true);
    const [chartError, setChartError] = useState("");

    const [genderData, setGenderData] = useState([]);
    const [genderLoading, setGenderLoading] = useState(true);
    const [genderError, setGenderError] = useState("");

    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // -----------------------------------------------------
    // THỐNG KÊ TỔNG QUAN
    // -----------------------------------------------------

    const fetchDashboardStats = useCallback(async () => {
        try {
            const overviewResults = await adminDashboardService.getOverviewStatistics();
            if (!mountedRef.current) return;

            const nextStats = {};
            const failedStats = [];
            const overviewKeys = ["users", "courses", "exercises", "submissions"];

            overviewResults.forEach((result, index) => {
                const key = overviewKeys[index];
                if (!key) return;

                if (result.status !== "fulfilled") {
                    failedStats.push(key);
                    return;
                }

                try {
                    const candidatesByKey = {
                        users: ["totalUsers", "totalProfiles"],
                        courses: ["totalCourses"],
                        exercises: ["totalExercises"],
                        submissions: ["totalSubmissions"],
                    };
                    nextStats[key] = extractCount(result.value, candidatesByKey[key]);
                } catch {
                    failedStats.push(key);
                }
            });

            const extraResults = await Promise.allSettled([
                adminDashboardService.getEnrollmentStatistics(),
                adminDashboardService.getSubmissionStatistics(),
            ]);

            if (!mountedRef.current) return;

            if (extraResults[0].status === "fulfilled") {
                try {
                    Object.assign(nextStats, extractEnrollmentStatistics(extraResults[0].value));
                } catch {
                    failedStats.push("lượt đăng ký / tỷ lệ hoàn thành");
                }
            } else {
                failedStats.push("lượt đăng ký / tỷ lệ hoàn thành");
            }

            if (extraResults[1].status === "fulfilled") {
                try {
                    nextStats.averageScore = extractAverageScore(extraResults[1].value);
                } catch {
                    failedStats.push("điểm trung bình");
                }
            } else {
                failedStats.push("điểm trung bình");
            }

            setStats((previous) => ({ ...previous, ...nextStats }));
            setError(
                failedStats.length > 0
                    ? `Không thể tải thống kê: ${[...new Set(failedStats)].join(", ")}.`
                    : ""
            );

            if (Object.keys(nextStats).length > 0) {
                setLastUpdated(new Date());
            }
        } catch (requestError) {
            console.error("Lỗi tải thống kê Dashboard:", requestError);
            if (mountedRef.current) {
                setError("Không thể tải dữ liệu thống kê Dashboard.");
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    // -----------------------------------------------------
    // BIỂU ĐỒ TRẠNG THÁI BÀI NỘP VÀ HOẠT ĐỘNG
    // -----------------------------------------------------

    const fetchCharts = useCallback(async (selectedPeriod) => {
        if (!PERIOD_API[selectedPeriod]) {
            if (mountedRef.current) {
                setChartError("Khoảng thời gian thống kê không hợp lệ.");
                setChartLoading(false);
            }
            return;
        }

        try {
            const results = await Promise.allSettled([
                adminDashboardService.getSubmissionStatistics(),
                adminDashboardService.getSubmissionActivity(PERIOD_API[selectedPeriod]),
            ]);

            if (!mountedRef.current) return;

            const errors = [];

            if (results[0].status === "fulfilled") {
                try {
                    setSubmissionData(normalizeSubmissionStatus(results[0].value));
                } catch {
                    errors.push("trạng thái bài nộp");
                }
            } else {
                errors.push("trạng thái bài nộp");
            }

            if (results[1].status === "fulfilled") {
                try {
                    setActivityData(normalizeActivity(results[1].value));
                } catch {
                    errors.push("hoạt động theo thời gian");
                }
            } else {
                errors.push("hoạt động theo thời gian");
            }

            setChartError(
                errors.length
                    ? `Không thể tải ${errors.join(" và ")}. Vui lòng kiểm tra API backend.`
                    : ""
            );
        } catch (requestError) {
            console.error("Lỗi tải biểu đồ:", requestError);
            if (mountedRef.current) {
                setChartError("Không thể tải dữ liệu biểu đồ.");
            }
        } finally {
            if (mountedRef.current) {
                setChartLoading(false);
            }
        }
    }, []);

    // -----------------------------------------------------
    // THỐNG KÊ GIỚI TÍNH
    // -----------------------------------------------------

    const fetchGenderStatistics = useCallback(async () => {
        try {
            const response = await adminDashboardService.getGenderStatistics();
            if (!mountedRef.current) return;

            setGenderData(normalizeGenderDistribution(response));
            setGenderError("");
        } catch (requestError) {
            console.error("Lỗi tải thống kê giới tính:", requestError);
            if (mountedRef.current) {
                setGenderError("Không thể tải thống kê giới tính. Vui lòng kiểm tra API.");
            }
        } finally {
            if (mountedRef.current) {
                setGenderLoading(false);
            }
        }
    }, []);

    // -----------------------------------------------------
    // TẢI DỮ LIỆU KHI MỞ TRANG VA KHI THAY ĐỔI PERIOD
    // -----------------------------------------------------

    // -----------------------------------------------------
    // TẢI DỮ LIỆU KHI MỞ TRANG
    // -----------------------------------------------------

    useEffect(() => {
        let isCancelled = false;

        const loadInitialData = async () => {
            await Promise.allSettled([
                fetchDashboardStats(),
                fetchGenderStatistics(),
            ]);
        };

        if (!isCancelled) {
            loadInitialData();
        }

        return () => {
            isCancelled = true;
        };
    }, [fetchDashboardStats, fetchGenderStatistics]);

    useEffect(() => {
        let isCancelled = false;

        const loadChartData = async () => {
            await fetchCharts(period);
        };

        if (!isCancelled) {
            loadChartData();
        }

        return () => {
            isCancelled = true;
        };
    }, [fetchCharts, period]);

    // -----------------------------------------------------
    // LÀM MỚI DỮ LIỆU
    // -----------------------------------------------------

    const refreshDashboard = useCallback(async () => {
        if (refreshing) return;

        setRefreshing(true);
        setChartLoading(true);
        setGenderLoading(true);

        try {
            await Promise.allSettled([
                fetchDashboardStats(),
                fetchCharts(period),
                fetchGenderStatistics(),
            ]);
        } finally {
            if (mountedRef.current) {
                setRefreshing(false);
            }
        }
    }, [refreshing, fetchDashboardStats, fetchCharts, fetchGenderStatistics, period]);

    // -----------------------------------------------------
    // TÍNH TOÁN DỮ LIỆU
    // -----------------------------------------------------

    const totalSubmissions = useMemo(
        () => submissionData.reduce((total, item) => total + item.value, 0),
        [submissionData]
    );

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="dashboard-page">
            <div className="dashboard-heading">
                <button
                    className="dashboard-refresh"
                    onClick={refreshDashboard}
                    type="button"
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={17}
                        className={refreshing ? "dashboard-spin" : ""}
                    />
                    {refreshing ? "Đang tải..." : "Làm mới"}
                </button>
            </div>

            {/* Welcome */}
            <div className="dashboard-welcome">
                <div className="welcome-content">
                    <span className="welcome-label">ADMIN DASHBOARD</span>
                    <h2>Chào mừng trở lại!</h2>
                    <p>
                        Quản lý người dùng, khóa học và theo dõi tiến độ học Java trên Jlearn.
                    </p>
                    <div className="welcome-status">
                        <span className="status-dot" />
                        Bảng điều khiển quản trị
                    </div>
                </div>

                <div className="welcome-art">
                    <div className="welcome-art-circle">
                        <Code2 size={54} strokeWidth={1.5} />
                    </div>
                    <span className="art-badge art-badge-one">Java</span>
                    <span className="art-badge art-badge-two">AI Tutor</span>
                </div>
            </div>

            {/* Thống kê tổng quan */}
            <div className="dashboard-stats">
                {STAT_DEFINITIONS.map((stat) => {
                    const Icon = stat.icon;
                    const value = stats[stat.key];

                    let formattedValue;
                    if (stat.key === "completionRate") {
                        formattedValue = formatPercent(value);
                    } else if (stat.key === "averageScore") {
                        formattedValue = formatScore(value);
                    } else {
                        formattedValue = formatCount(value);
                    }

                    return (
                        <div className="dashboard-stat-card" key={stat.key}>
                            <div className="stat-card-top">
                                <div className={`stat-icon ${stat.color}`}>
                                    <Icon size={22} />
                                </div>
                            </div>
                            <p className="stat-label">{stat.label}</p>
                            <h3>
                                {loading && value === null ? "..." : formattedValue}
                            </h3>
                            <span className="stat-note">{stat.note}</span>
                        </div>
                    );
                })}
            </div>

            {error && (
                <div className="dashboard-stats-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={refreshDashboard}
                        disabled={refreshing}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Biểu đồ */}
            <div className="dashboard-charts">
                {/* Hoạt động theo thời gian */}
                <section className="dashboard-panel activity-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Hoạt động học tập</h3>
                            <p>Số bản ghi bài nộp theo thời gian</p>
                        </div>

                        <select
                            value={period}
                            onChange={(event) => {
                                setChartLoading(true); // set loading khi user click chọn period
                                setPeriod(event.target.value);
                            }}
                            aria-label="Khoảng thời gian thống kê"
                        >
                            <option value="7 ngày">7 ngày</option>
                            <option value="30 ngày">30 ngày</option>
                            <option value="90 ngày">90 ngày</option>
                        </select>
                    </div>

                    <div className="chart-legend">
                        <span>
                            <i className="legend-dot purple-dot" />
                            Bản ghi bài nộp
                        </span>
                    </div>

                    <div className="activity-chart">
                        {chartLoading ? (
                            <div className="dashboard-chart-message">
                                Đang tải dữ liệu biểu đồ...
                            </div>
                        ) : activityData.length === 0 ? (
                            <div className="dashboard-chart-message">
                                {chartError || "Chưa có dữ liệu trong khoảng thời gian này."}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={activityData}
                                    margin={{
                                        top: 12,
                                        right: 8,
                                        left: -18,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="submissionGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#8b5cf6"
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#8b5cf6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        stroke="#edf0f6"
                                        strokeDasharray="4 4"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#8b93a7", fontSize: 12 }}
                                        dy={10}
                                    />

                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                        tick={{ fill: "#8b93a7", fontSize: 11 }}
                                    />

                                    <Tooltip
                                        formatter={(value) => [
                                            Number(value).toLocaleString("vi-VN"),
                                            "Bản ghi bài nộp",
                                        ]}
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: "1px solid #edf0f6",
                                            boxShadow: "0 8px 24px #17255412",
                                        }}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="submissions"
                                        name="Bản ghi bài nộp"
                                        stroke="#8b5cf6"
                                        strokeWidth={2.5}
                                        fill="url(#submissionGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {chartError && !chartLoading && (
                        <p className="dashboard-chart-error" role="alert">
                            {chartError}
                        </p>
                    )}
                </section>

                {/* Trạng thái bài nộp */}
                <section className="dashboard-panel submission-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Trạng thái chấm bài</h3>
                            <p>Phân bố bản ghi bài nộp</p>
                        </div>
                        <span className="panel-icon">
                            <Activity size={19} />
                        </span>
                    </div>

                    <div className="submission-chart">
                        {chartLoading ? (
                            <div className="dashboard-chart-message">
                                Đang tải dữ liệu...
                            </div>
                        ) : totalSubmissions === 0 ? (
                            <div className="dashboard-chart-message">
                                Chưa có dữ liệu bài nộp.
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={submissionData.filter((item) => item.value > 0)}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={66}
                                            outerRadius={91}
                                            paddingAngle={4}
                                            stroke="none"
                                        >
                                            {submissionData
                                                .filter((item) => item.value > 0)
                                                .map((item) => (
                                                    <Cell key={item.key} fill={item.color} />
                                                ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [
                                                Number(value).toLocaleString("vi-VN"),
                                                name,
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="submission-center">
                                    <strong>{formatCount(totalSubmissions)}</strong>
                                    <span>Bản ghi</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="submission-legend">
                        {submissionData.map((item) => (
                            <div className="submission-legend-item" key={item.key}>
                                <span>
                                    <i
                                        className="legend-dot"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    {item.name}
                                </span>
                                <strong>{formatCount(item.value)}</strong>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Phân bố giới tính */}
            <div className="dashboard-gender-section">
                <section className="dashboard-panel gender-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Phân bố giới tính</h3>
                            <p>Thống kê giới tính người dùng có hồ sơ</p>
                        </div>
                        <span className="panel-icon">
                            <Users size={19} />
                        </span>
                    </div>

                    <div className="gender-chart">
                        {genderLoading ? (
                            <div className="dashboard-chart-message">
                                Đang tải dữ liệu giới tính...
                            </div>
                        ) : genderError ? (
                            <div className="dashboard-chart-message" role="alert">
                                {genderError}
                            </div>
                        ) : genderData.length === 0 || genderData.every((item) => item.value === 0) ? (
                            <div className="dashboard-chart-message">
                                Chưa có dữ liệu giới tính.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genderData.filter((item) => item.value > 0)}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={58}
                                        outerRadius={88}
                                        paddingAngle={3}
                                        stroke="none"
                                    >
                                        {genderData
                                            .filter((item) => item.value > 0)
                                            .map((item, index) => (
                                                <Cell
                                                    key={`${item.name}-${index}`}
                                                    fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                                                />
                                            ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [
                                            Number(value).toLocaleString("vi-VN"),
                                            name,
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {!genderLoading &&
                        !genderError &&
                        genderData.length > 0 &&
                        genderData.some((item) => item.value > 0) && (
                            <div className="gender-legend">
                                {genderData.map((item, index) => (
                                    <div className="gender-legend-item" key={item.name}>
                                        <span>
                                            <i
                                                className="legend-dot"
                                                style={{
                                                    backgroundColor:
                                                        GENDER_COLORS[index % GENDER_COLORS.length],
                                                }}
                                            />
                                            {item.name}
                                        </span>
                                        <strong>{formatCount(item.value)}</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                </section>
            </div>

            {/* Hoạt động gần đây và tổng quan chức năng */}
            <div className="dashboard-bottom">
                <section className="dashboard-panel recent-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Hoạt động gần đây</h3>
                            <p>Các hoạt động trên hệ thống</p>
                        </div>
                    </div>
                    <div className="activity-list">
                        <div className="dashboard-chart-message">
                            Chưa tích hợp API nhật ký hoạt động.
                        </div>
                    </div>
                </section>

                <section className="dashboard-panel system-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Tổng quan chức năng</h3>
                            <p>Các khu vực quản trị Jlearn</p>
                        </div>
                    </div>

                    <div className="system-item">
                        <div className="system-item-icon blue">
                            <Users size={18} />
                        </div>
                        <div className="system-item-info">
                            <strong>Người dùng</strong>
                            <span>Quản lý tài khoản và vai trò</span>
                        </div>
                        <CheckCircle2 size={18} className="system-check" />
                    </div>

                    <div className="system-item">
                        <div className="system-item-icon purple">
                            <BookOpen size={18} />
                        </div>
                        <div className="system-item-info">
                            <strong>Khóa học</strong>
                            <span>Quản lý nội dung học tập</span>
                        </div>
                        <CheckCircle2 size={18} className="system-check" />
                    </div>

                    <div className="system-item">
                        <div className="system-item-icon orange">
                            <Code2 size={18} />
                        </div>
                        <div className="system-item-info">
                            <strong>Bài tập Java</strong>
                            <span>Quản lý bài tập và testcase</span>
                        </div>
                        <CheckCircle2 size={18} className="system-check" />
                    </div>

                    <div className="system-item">
                        <div className="system-item-icon green">
                            <Bot size={18} />
                        </div>
                        <div className="system-item-info">
                            <strong>AI Tutor</strong>
                            <span>Hỗ trợ học Java bằng AI</span>
                        </div>
                        <ArrowUpRight size={18} className="system-arrow" />
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="dashboard-footer">
                <span>Jlearn Administration</span>
                <span>
                    {lastUpdated
                        ? `Dữ liệu được cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN")}`
                        : "Chưa có dữ liệu thống kê"}
                </span>
            </div>
        </div>
    );
}

export default DashboardPage;