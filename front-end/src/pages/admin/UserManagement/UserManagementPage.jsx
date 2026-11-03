import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faUserCheck,
    faUserSlash,
    faRotate,
    faMagnifyingGlass,
    faXmark,
    faEye,
    faLock,
    faUnlock,
    faChevronLeft,
    faChevronRight,
    faFolderOpen,
    faUser,
    faEnvelope,
    faCalendarDays,
    faVenusMars,
    faIdBadge,
    faCode,
    faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";

import adminUserService from "../../../services/admin/adminUserService";
import Loading from "../../../components/common/Loading/Loading";
import "./UserManagementPage.css";

const PAGE_SIZE = 10;

function StatCard({ label, value, icon, color }) {
    return (
        <article className="um-stat-card">
            <div className="um-stat-card__content">
                <span className="um-stat-card__label">{label}</span>
                <strong className="um-stat-card__value">{value}</strong>
            </div>
            <span className={`um-stat-card__icon ${color}`}>
                <FontAwesomeIcon icon={icon} />
            </span>
        </article>
    );
}
function normalizeSkills(skills) {
    if (Array.isArray(skills)) {
        return skills
            .filter((skill) => typeof skill === "string" && skill.trim())
            .map((skill) => skill.trim());
    }

    if (typeof skills === "string" && skills.trim()) {
        return skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);
    }

    return [];
}

export default function UserManagementPage() {
    // State dữ liệu & phân trang
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // State lọc & tìm kiếm
    const [keywordInput, setKeywordInput] = useState("");
    const [activeKeyword, setActiveKeyword] = useState("");

    // State trạng thái UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [updatingAccountId, setUpdatingAccountId] = useState(null);

    // State Modal Xem Profile
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // Fetch danh sách người dùng cơ bản từ API
    const fetchUsers = useCallback(async () => {
        try {
            const response = await adminUserService.getAllBasic({
                page,
                size: PAGE_SIZE,
                keyword: activeKeyword.trim(),
            });

            const result = response.data?.result || response.result;

            if (result) {
                setUsers(result.data || []);
                setTotalUsers(result.totalElements || 0);
                setTotalPages(Math.max(1, result.totalPages || 1));
            }
        } catch (err) {
            console.error("Lỗi tải danh sách người dùng:", err);
            setError(err.response?.data?.message || "Không thể tải danh sách người dùng.");
        } finally {
            setLoading(false);
        }
    }, [page, activeKeyword]);

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await adminUserService.getAllBasic({
                    page,
                    size: PAGE_SIZE,
                    keyword: activeKeyword.trim(),
                });

                if (cancelled) return;

                const result = response.data?.result || response.result;
                if (result) {
                    setUsers(result.data || []);
                    setTotalUsers(result.totalElements || 0);
                    setTotalPages(Math.max(1, result.totalPages || 1));
                }
            } catch (err) {
                if (cancelled) return;
                console.error("Lỗi tải danh sách người dùng:", err);
                setError(err.response?.data?.message || "Không thể tải danh sách người dùng.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [page, activeKeyword]);

    // Xử lý Tìm kiếm
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(0);
        setActiveKeyword(keywordInput);
    };

    const handleResetSearch = () => {
        setKeywordInput("");
        setActiveKeyword("");
        setPage(0);
    };

    // Xử lý Khóa / Mở khóa tài khoản
    const handleToggleStatus = async (accountId, currentStatus) => {
        const nextStatus = currentStatus === "ACTIVE" ? "LOCKED" : "ACTIVE";
        const actionText = nextStatus === "LOCKED" ? "KHÓA" : "MỞ KHÓA";

        if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản ID: ${accountId}?`)) {
            return;
        }

        setUpdatingAccountId(accountId);
        setError("");
        setNotice("");

        try {
            await adminUserService.updateStatus(accountId, nextStatus);
            setNotice(`Đã ${actionText.toLowerCase()} tài khoản thành công.`);

            setUsers((prev) =>
                prev.map((u) => (u.accountId === accountId ? { ...u, status: nextStatus } : u))
            );
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái:", err);
            setError(err.response?.data?.message || "Không thể thay đổi trạng thái tài khoản.");
        } finally {
            setUpdatingAccountId(null);
        }
    };

    // Xử lý xem Profile chi tiết qua Modal
    const handleOpenProfileModal = async (accountId) => {
        setSelectedUserId(accountId);
        setLoadingProfile(true);
        setUserProfile(null);

        try {
            const response = await adminUserService.getProfileByUserId(accountId);
            setUserProfile(response.data?.result || response.result);
        } catch (err) {
            console.error("Lỗi lấy thông tin profile:", err);
        } finally {
            setLoadingProfile(false);
        }
    };

    const activeCount = users.filter((u) => u.status === "ACTIVE").length;
    const lockedCount = users.filter((u) => u.status === "LOCKED").length;

    return (
        <div className="um-container">
            {/* Header Trang */}
            <div className="um-header">
                <div>
                    <span className="um-eyebrow">QUẢN TRỊ HỆ THỐNG</span>
                    <h2 className="um-title">Quản lý người dùng</h2>
                    <p className="um-subtitle">
                        Quản lý danh sách tài khoản, tìm kiếm và cập nhật trạng thái người dùng.
                    </p>
                </div>

                <button
                    type="button"
                    className="um-btn um-btn--outline"
                    onClick={fetchUsers}
                    disabled={loading}
                >
                    <FontAwesomeIcon icon={faRotate} className="um-btn__icon" /> Làm mới
                </button>
            </div>

            {/* Alert */}
            {error && (
                <div className="um-alert um-alert--error">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}

            {notice && (
                <div className="um-alert um-alert--success">
                    <span>{notice}</span>
                    <button type="button" onClick={() => setNotice("")}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}

            {/* Thống kê nhanh */}
            <div className="um-stats-grid">
                <StatCard
                    label="Tổng số tài khoản"
                    value={totalUsers.toLocaleString("vi-VN")}
                    icon={faUsers}
                    color="um-stat--blue"
                />
                <StatCard
                    label="Hoạt động (Trang hiện tại)"
                    value={loading ? "—" : activeCount}
                    icon={faUserCheck}
                    color="um-stat--green"
                />
                <StatCard
                    label="Đã khóa (Trang hiện tại)"
                    value={loading ? "—" : lockedCount}
                    icon={faUserSlash}
                    color="um-stat--red"
                />
            </div>

            {/* Panel Bảng dữ liệu */}
            <section className="um-panel">
                <div className="um-toolbar">
                    <form className="um-search-form" onSubmit={handleSearchSubmit}>
                        <div className="um-search-input">
                            <span className="um-search-icon">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                            </span>
                            <input
                                type="search"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder="Nhập Username hoặc Account ID..."
                            />
                        </div>
                        <button type="submit" className="um-btn um-btn--primary">
                            Tìm kiếm
                        </button>
                        {activeKeyword && (
                            <button
                                type="button"
                                className="um-btn um-btn--ghost"
                                onClick={handleResetSearch}
                            >
                                Xóa lọc
                            </button>
                        )}
                    </form>
                </div>

                {/* Bảng Hiển Thị */}
                <div className="um-table-wrapper">
                    <table className="um-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>ACCOUNT ID</th>
                                <th>USERNAME</th>
                                <th>TRẠNG THÁI</th>
                                <th className="um-table__actions-head">THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="um-table__empty">
                                        <Loading text="Đang tải dữ liệu..." />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="um-table__empty">
                                        <div className="um-empty-state">
                                            <span className="um-empty-icon">
                                                <FontAwesomeIcon icon={faFolderOpen} />
                                            </span>
                                            <strong>Không tìm thấy tài khoản nào</strong>
                                            <p>Thử điều chỉnh từ khóa tìm kiếm.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user.accountId}>
                                        <td>{page * PAGE_SIZE + index + 1}</td>
                                        <td>
                                            <code className="um-code">{user.accountId}</code>
                                        </td>
                                        <td>
                                            <div className="um-user-cell">
                                                <div className="um-avatar">
                                                    {(user.username || "U").charAt(0).toUpperCase()}
                                                </div>
                                                <strong className="um-username">{user.username}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`um-badge ${user.status === "ACTIVE"
                                                    ? "um-badge--active"
                                                    : "um-badge--locked"
                                                    }`}
                                            >
                                                <span className="um-badge__dot" />
                                                {user.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="um-actions">
                                                <button
                                                    type="button"
                                                    className="um-btn-action um-btn-action--view"
                                                    onClick={() => handleOpenProfileModal(user.accountId)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} /> Xem Profile
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`um-btn-action ${user.status === "ACTIVE"
                                                        ? "um-btn-action--lock"
                                                        : "um-btn-action--unlock"
                                                        }`}
                                                    disabled={updatingAccountId === user.accountId}
                                                    onClick={() =>
                                                        handleToggleStatus(user.accountId, user.status)
                                                    }
                                                >
                                                    {updatingAccountId === user.accountId ? (
                                                        "..."
                                                    ) : user.status === "ACTIVE" ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faLock} /> Khóa
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faUnlock} /> Mở khóa
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="um-pagination">
                        <span className="um-pagination__info">
                            Trang <strong>{page + 1}</strong> / {totalPages}
                        </span>

                        <div className="um-pagination__btns">
                            <button
                                type="button"
                                className="um-btn um-btn--outline"
                                disabled={page === 0 || loading}
                                onClick={() => setPage((prev) => prev - 1)}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} /> Trước
                            </button>

                            <button
                                type="button"
                                className="um-btn um-btn--outline"
                                disabled={page + 1 >= totalPages || loading}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                Sau <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* ========================================================================== */}
            {/* MODAL POPUP CHI TIẾT PROFILE (Khớp DTO ProfileResponse)                      */}
            {/* ========================================================================== */}
            {selectedUserId && (
                <div className="um-modal-backdrop" onClick={() => setSelectedUserId(null)}>
                    <div className="um-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="um-modal__header">
                            <h3>Thông tin Profile Người Dùng</h3>
                            <button
                                type="button"
                                className="um-modal__close"
                                onClick={() => setSelectedUserId(null)}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="um-modal__body">
                            {loadingProfile ? (
                                <Loading text="Đang tải dữ liệu profile..." />
                            ) : userProfile ? (
                                <div className="um-profile-card">
                                    {/* Avatar & Header Profile */}
                                    <div className="um-profile-card__header">
                                        <div className="um-profile-avatar-wrapper">
                                            {userProfile.url ? (
                                                <img
                                                    src={userProfile.url}
                                                    alt="Avatar"
                                                    className="um-profile-avatar-img"
                                                />
                                            ) : (
                                                <div className="um-profile-avatar-fallback">
                                                    {(
                                                        userProfile.firstName?.charAt(0) ||
                                                        userProfile.lastName?.charAt(0) ||
                                                        "U"
                                                    ).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="um-profile-fullname">
                                            {[userProfile.firstName, userProfile.lastName]
                                                .filter(Boolean)
                                                .join(" ") || "Chưa cập nhật tên"}
                                        </h4>
                                        <span className="um-profile-id-badge">
                                            <FontAwesomeIcon icon={faIdBadge} /> {userProfile.id || selectedUserId}
                                        </span>
                                    </div>

                                    {/* Danh sách thông tin chi tiết */}
                                    <div className="um-profile-details-list">
                                        <div className="um-profile-detail-item">
                                            <div className="um-profile-detail-icon">
                                                <FontAwesomeIcon icon={faUser} />
                                            </div>
                                            <div className="um-profile-detail-content">
                                                <label>Họ và Tên</label>
                                                <strong>
                                                    {[userProfile.firstName, userProfile.lastName]
                                                        .filter(Boolean)
                                                        .join(" ") || "Chưa cập nhật"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="um-profile-detail-item">
                                            <div className="um-profile-detail-icon">
                                                <FontAwesomeIcon icon={faEnvelope} />
                                            </div>
                                            <div className="um-profile-detail-content">
                                                <label>Email</label>
                                                <strong>{userProfile.email || "Chưa cập nhật"}</strong>
                                            </div>
                                        </div>

                                        <div className="um-profile-detail-item">
                                            <div className="um-profile-detail-icon">
                                                <FontAwesomeIcon icon={faCalendarDays} />
                                            </div>
                                            <div className="um-profile-detail-content">
                                                <label>Ngày sinh (DOB)</label>
                                                <strong>
                                                    {userProfile.dob
                                                        ? new Date(userProfile.dob).toLocaleDateString("vi-VN")
                                                        : "Chưa cập nhật"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="um-profile-detail-item">
                                            <div className="um-profile-detail-icon">
                                                <FontAwesomeIcon icon={faVenusMars} />
                                            </div>
                                            <div className="um-profile-detail-content">
                                                <label>Giới tính</label>
                                                <strong>{userProfile.gender || "Chưa cập nhật"}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Kỹ năng người dùng */}
                                    <section className="um-profile-skills">
                                        <div className="um-profile-skills__header">
                                            <div className="um-profile-skills__title">
                                                <span className="um-profile-skills__icon">
                                                    <FontAwesomeIcon icon={faCode} />
                                                </span>

                                                <div>
                                                    <h5>Kỹ năng lập trình</h5>
                                                    <p>Các công nghệ và kỹ năng người dùng đã khai báo</p>
                                                </div>
                                            </div>

                                            <span className="um-profile-skills__count">
                                                {normalizeSkills(userProfile.skills).length}
                                            </span>
                                        </div>

                                        {normalizeSkills(userProfile.skills).length > 0 ? (
                                            <div className="um-profile-skills__list">
                                                {normalizeSkills(userProfile.skills).map((skill, index) => (
                                                    <span
                                                        className="um-profile-skill"
                                                        key={`${skill}-${index}`}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faGraduationCap}
                                                            className="um-profile-skill__icon"
                                                        />
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="um-profile-skills__empty">
                                                <FontAwesomeIcon icon={faCode} />
                                                <span>Người dùng chưa cập nhật kỹ năng.</span>
                                            </div>
                                        )}
                                    </section>
                                </div>
                            ) : (
                                <p className="um-text-error">
                                    Không tìm thấy thông tin profile của tài khoản này.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}