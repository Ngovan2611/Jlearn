
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRightToBracket,
  faCircleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import authService from "../../../services/authService";
import profileService from "../../../services/profileService";
import { useAuth } from "../../../context/useAuth";

import "./LoginForm.css";

function LoginForm() {
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Tự động ẩn thông báo lỗi sau 3 giây
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

  // Xử lý thay đổi input
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

  // Kiểm tra profile đã hoàn thiện chưa
  const isProfileCompleted = (profile) =>
    Boolean(
      profile?.firstName?.trim() &&
      profile?.lastName?.trim() &&
      profile?.gender &&
      profile?.dob
    );

  // Xử lý đăng nhập
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!formData.username.trim()) {
      setError("Vui lòng nhập username.");
      return;
    }

    if (!formData.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      // 1. Đăng nhập
      await authService.login({
        username: formData.username.trim(),
        password: formData.password,
      });

      // 2. Lấy tài khoản hiện tại
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        setError("Không thể lấy thông tin tài khoản.");
        return;
      }

      // 3. Lấy hồ sơ cá nhân
      const profileResponse = await profileService.getMyProfile();

      const profile = profileResponse.data?.result;

      // 4. Chuyển đến trang hoàn thiện hồ sơ nếu còn thiếu
      if (!isProfileCompleted(profile)) {
        navigate("/profile/setup", { replace: true });
        return;
      }

      // 5. Hồ sơ đã hoàn thiện
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.result?.message ||
        err.response?.data?.error ||
        "Username hoặc mật khẩu không đúng.";

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
          CHÀO MỪNG TRỞ LẠI
        </span>

        <h1>Đăng nhập</h1>

 
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="auth-error-popup" role="alert">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="auth-error-symbol"
          />

          <div className="auth-error-content">
            <strong>Đăng nhập thất bại</strong>
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

      {/* Form đăng nhập */}
      <form onSubmit={handleSubmit}>
        {/* Username */}
        <div className="form-group">
          <label htmlFor="username">Username</label>

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
            />
          </div>
        </div>

        {/* Mật khẩu */}
        <div className="form-group">
          <label htmlFor="password">Mật khẩu</label>

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
              autoComplete="current-password"
              disabled={loading}
            />

            <button
              type="button"
              className="auth-password-toggle"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              disabled={loading}
              aria-label={
                showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
              }
              aria-pressed={showPassword}
              title={
                showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
              }
            >
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
              />
            </button>
          </div>
        </div>

        {/* Nút đăng nhập */}
        <button
          type="submit"
          className="auth-submit-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="auth-spinner" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <FontAwesomeIcon icon={faArrowRightToBracket} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="auth-footer">
        <span>Chưa có tài khoản?</span>

        <Link to="/register">
          Đăng ký ngay <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Bảo mật */}
      <div className="auth-security-note">
        <FontAwesomeIcon icon={faLock} />
        <span>Đăng nhập an toàn cùng JLearn</span>
      </div>
    </div>
  );
}

export default LoginForm;
