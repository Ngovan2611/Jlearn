
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faGraduationCap,
    faUser,
    faLock,
    faEye,
    faEyeSlash,
    faUserPlus,
    faCircleExclamation,
    faCircleCheck,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

import authService from "../../../services/authService";

import "../LoginForm/LoginForm.css";

function RegisterForm() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Tự động ẩn thông báo lỗi sau 3 giây
    useEffect(() => {
        if (!error) return;

        const timer = setTimeout(() => {
            setError("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [error]);

    // Tự động ẩn thông báo thành công sau 3 giây
    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [success]);

    // Xử lý thay đổi dữ liệu
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (error) setError("");
        if (success) setSuccess("");
    };

    // Kiểm tra dữ liệu đăng ký
    const validateForm = () => {
        const username = formData.username.trim();

        if (!username) {
            return "Vui lòng nhập username.";
        }

        if (username.length < 3) {
            return "Username phải có ít nhất 3 ký tự.";
        }

        if (!formData.password) {
            return "Vui lòng nhập mật khẩu.";
        }

        if (formData.password.length < 6) {
            return "Mật khẩu phải có ít nhất 6 ký tự.";
        }

        if (!formData.confirmPassword) {
            return "Vui lòng xác nhận mật khẩu.";
        }

        if (formData.password !== formData.confirmPassword) {
            return "Mật khẩu xác nhận không khớp.";
        }

        return null;
    };

    // Xử lý đăng ký
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        setError("");
        setSuccess("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);

            await authService.register({
                username: formData.username.trim(),
                password: formData.password,
            });

            setSuccess("Đăng ký tài khoản thành công!");

            // Chuyển đến trang đăng nhập sau 1.5 giây
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1500);
        } catch (err) {
            console.error("Register failed:", err);

            const message =
                err.response?.data?.message ||
                err.response?.data?.result?.message ||
                err.response?.data?.error ||
                "Không thể đăng ký tài khoản.";

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form">
            {/* Logo */}
            <div className="auth-brand-icon">
                <FontAwesomeIcon icon={faGraduationCap} />
            </div>

            {/* Header */}
            <div className="auth-header">
                <span className="auth-eyebrow">
                    BẮT ĐẦU HÀNH TRÌNH
                </span>

                <h1>Tạo tài khoản</h1>


            </div>

            {/* Thông báo lỗi */}
            {error && (
                <div className="auth-error-popup" role="alert">
                    <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="auth-error-symbol"
                    />

                    <div className="auth-error-content">
                        <strong>Đăng ký thất bại</strong>
                        <span>{error}</span>
                    </div>

                    <button
                        type="button"
                        className="auth-error-close"
                        onClick={() => setError("")}
                        aria-label="Đóng thông báo"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}

            {/* Thông báo thành công */}
            {success && (
                <div className="auth-success-popup" role="status">
                    <FontAwesomeIcon
                        icon={faCircleCheck}
                        className="auth-success-symbol"
                    />

                    <div className="auth-success-content">
                        <strong>Thành công</strong>
                        <span>{success}</span>
                    </div>

                    <button
                        type="button"
                        className="auth-success-close"
                        onClick={() => setSuccess("")}
                        aria-label="Đóng thông báo"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}

            {/* Form đăng ký */}
            <form onSubmit={handleSubmit}>
                {/* Username */}
                <div className="form-group">
                    <label htmlFor="username">
                        Username
                    </label>

                    <div className="auth-input-wrapper">
                        <FontAwesomeIcon
                            icon={faUser}
                            className="auth-input-icon"
                        />

                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"
                            disabled={loading}
                            required
                        />
                    </div>
                </div>

                {/* Mật khẩu */}
                <div className="form-group">
                    <label htmlFor="password">
                        Mật khẩu
                    </label>

                    <div className="auth-input-wrapper">
                        <FontAwesomeIcon
                            icon={faLock}
                            className="auth-input-icon"
                        />

                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            disabled={loading}
                            required
                        />

                        <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() =>
                                setShowPassword((previous) => !previous)
                            }
                            disabled={loading}
                            aria-label={
                                showPassword
                                    ? "Ẩn mật khẩu"
                                    : "Hiện mật khẩu"
                            }
                            aria-pressed={showPassword}
                            title={
                                showPassword
                                    ? "Ẩn mật khẩu"
                                    : "Hiện mật khẩu"
                            }
                        >
                            <FontAwesomeIcon
                                icon={showPassword ? faEyeSlash : faEye}
                            />
                        </button>
                    </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div className="form-group">
                    <label htmlFor="confirmPassword">
                        Xác nhận mật khẩu
                    </label>

                    <div className="auth-input-wrapper">
                        <FontAwesomeIcon
                            icon={faLock}
                            className="auth-input-icon"
                        />

                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={
                                showConfirmPassword ? "text" : "password"
                            }
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            disabled={loading}
                            required
                        />

                        <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() =>
                                setShowConfirmPassword(
                                    (previous) => !previous
                                )
                            }
                            disabled={loading}
                            aria-label={
                                showConfirmPassword
                                    ? "Ẩn mật khẩu xác nhận"
                                    : "Hiện mật khẩu xác nhận"
                            }
                            aria-pressed={showConfirmPassword}
                            title={
                                showConfirmPassword
                                    ? "Ẩn mật khẩu xác nhận"
                                    : "Hiện mật khẩu xác nhận"
                            }
                        >
                            <FontAwesomeIcon
                                icon={
                                    showConfirmPassword
                                        ? faEyeSlash
                                        : faEye
                                }
                            />
                        </button>
                    </div>
                </div>

                {/* Nút đăng ký */}
                <button
                    type="submit"
                    className="auth-submit-button"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="auth-spinner" />
                            <span>Đang đăng ký...</span>
                        </>
                    ) : (
                        <>
                            <span>Đăng ký</span>
                            <FontAwesomeIcon icon={faUserPlus} />
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <div className="auth-footer">
                <span>Đã có tài khoản?</span>

                <Link to="/login">
                    Đăng nhập <span aria-hidden="true">→</span>
                </Link>
            </div>

            {/* Bảo mật */}
            <div className="auth-security-note">
                <FontAwesomeIcon icon={faLock} />
                <span>Đăng ký an toàn cùng JLearn</span>
            </div>
        </div>
    );
}

export default RegisterForm;
