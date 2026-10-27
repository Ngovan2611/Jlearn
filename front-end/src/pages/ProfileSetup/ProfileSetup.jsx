import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faVenusMars,
    faCalendarDays,
    faLink,
    faFloppyDisk,
    faCircleExclamation,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
  
import { useAuth } from "../../context/useAuth";
import profileService from "../../services/profileService";

import "./ProfileSetup.css";

function ProfileSetup() {
    const { user, getCurrentUser } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "",
        dob: "",
        url: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) {
            setError("");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        // Validate họ
        if (!formData.firstName.trim()) {
            setError("Vui lòng nhập họ.");
            return;
        }

        // Validate tên
        if (!formData.lastName.trim()) {
            setError("Vui lòng nhập tên.");
            return;
        }

        // Validate giới tính
        if (!formData.gender) {
            setError("Vui lòng chọn giới tính.");
            return;
        }

        // Validate ngày sinh
        if (!formData.dob) {
            setError("Vui lòng chọn ngày sinh.");
            return;
        }

        try {
            setLoading(true);

            // Cập nhật profile của tài khoản hiện tại
            await profileService.updateMyProfile({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                gender: formData.gender,
                dob: formData.dob,
                url: formData.url.trim(),
            });

            // Cập nhật lại thông tin user trong AuthContext
            await getCurrentUser();

            // Hoàn tất
            navigate("/", {
                replace: true,
            });
        } catch (error) {
            console.error("Update profile failed:", error);

            setError(
                error.response?.data?.message ||
                error.response?.data?.result?.message ||
                error.response?.data?.error ||
                "Không thể cập nhật hồ sơ. Vui lòng thử lại."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-setup-page">
            <div className="profile-setup-container">

                {/* Header */}
                <div className="profile-setup-header">
                    <div className="profile-setup-icon">
                        <FontAwesomeIcon icon={faUser} />
                    </div>

                    <span className="profile-setup-label">
                        JLEARN
                    </span>

                    <h1>Hoàn thiện hồ sơ</h1>

                    <p>
                        Chào{" "}
                        <strong>
                            {user?.username || "bạn"}
                        </strong>
                        , hãy hoàn thiện thông tin cá nhân để
                        tiếp tục sử dụng JLearn.
                    </p>
                </div>

                <form
                    className="profile-setup-form"
                    onSubmit={handleSubmit}
                >
                    {/* Error */}
                    {error && (
                        <div className="profile-error">
                            <FontAwesomeIcon
                                icon={faCircleExclamation}
                            />

                            <span>{error}</span>
                        </div>
                    )}

                    {/* Họ */}
                    <div className="form-group">
                        <label htmlFor="firstName">
                            Họ
                        </label>

                        <div className="profile-input-wrapper">
                            <FontAwesomeIcon
                                className="profile-input-icon"
                                icon={faUser}
                            />

                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Nhập họ"
                                disabled={loading}
                                autoComplete="given-name"
                            />
                        </div>
                    </div>

                    {/* Tên */}
                    <div className="form-group">
                        <label htmlFor="lastName">
                            Tên
                        </label>

                        <div className="profile-input-wrapper">
                            <FontAwesomeIcon
                                className="profile-input-icon"
                                icon={faUser}
                            />

                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Nhập tên"
                                disabled={loading}
                                autoComplete="family-name"
                            />
                        </div>
                    </div>

                    {/* Giới tính */}
                    <div className="form-group">
                        <label htmlFor="gender">
                            Giới tính
                        </label>

                        <div className="profile-input-wrapper">
                            <FontAwesomeIcon
                                className="profile-input-icon"
                                icon={faVenusMars}
                            />

                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">
                                    -- Chọn giới tính --
                                </option>

                                <option value="MALE">
                                    Nam
                                </option>

                                <option value="FEMALE">
                                    Nữ
                                </option>

                                <option value="OTHER">
                                    Khác
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* Ngày sinh */}
                    <div className="form-group">
                        <label htmlFor="dob">
                            Ngày sinh
                        </label>

                        <div className="profile-input-wrapper">
                            <FontAwesomeIcon
                                className="profile-input-icon"
                                icon={faCalendarDays}
                            />

                            <input
                                id="dob"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Avatar URL */}
                    <div className="form-group">
                        <label htmlFor="url">
                            Avatar URL
                        </label>

                        <div className="profile-input-wrapper">
                            <FontAwesomeIcon
                                className="profile-input-icon"
                                icon={faLink}
                            />

                            <input
                                id="url"
                                name="url"
                                type="url"
                                value={formData.url}
                                onChange={handleChange}
                                placeholder="https://..."
                                disabled={loading}
                            />
                        </div>

                        <small className="form-hint">
                            Bạn có thể bỏ trống nếu chưa có ảnh đại diện.
                        </small>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="profile-setup-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                />

                                <span>
                                    Đang lưu...
                                </span>
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon
                                    icon={faFloppyDisk}
                                />

                                <span>
                                    Hoàn tất hồ sơ
                                </span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProfileSetup;