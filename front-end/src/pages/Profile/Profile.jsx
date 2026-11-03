
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPen,
  faFloppyDisk,
  faXmark,
  faSpinner,
  faCircleExclamation,
  faEnvelope,
  faVenusMars,
  faCalendarDays,
  faLink,
  faIdCard,
  faCamera,
  faCode,
} from "@fortawesome/free-solid-svg-icons";

import Navbar from "../../components/layout/Navbar/Navbar";
import { useAuth } from "../../context/useAuth";
import profileService from "../../services/profileService";

import "./Profile.css";

const getSkillsText = (skills) => {
  if (Array.isArray(skills)) {
    return skills.join(", ");
  }

  if (typeof skills === "string") {
    return skills;
  }

  return "";
};

const parseSkills = (skills) => {
  if (Array.isArray(skills)) {
    return [
      ...new Set(
        skills
          .filter((skill) => typeof skill === "string")
          .map((skill) => skill.trim())
          .filter(Boolean)
      ),
    ];
  }

  if (typeof skills === "string") {
    return [
      ...new Set(
        skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      ),
    ];
  }

  return [];
};

const getFormData = (data) => ({
  firstName: data?.firstName || "",
  lastName: data?.lastName || "",
  gender: data?.gender || "",
  dob: data?.dob || "",
  url: data?.url || "",
  skills: getSkillsText(data?.skills),
});

function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    url: "",
    skills: "",
  });

  /*
   * LOAD PROFILE
   */
  
useEffect(() => {
  let ignore = false;

  const fetchProfile = async () => {
    try {
      const response = await profileService.getMyProfile();

      if (ignore) return;

      const data = response.data?.result;

      setProfile(data);
      setFormData(getFormData(data));
      setError("");
    } catch (error) {
      if (ignore) return;

      console.error("Get profile failed:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data?.result?.message ||
          "Không thể tải thông tin hồ sơ."
      );
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  };

  // Không gọi setState đồng bộ trực tiếp trong effect.
  if (user) {
    fetchProfile();
  }

  return () => {
    ignore = true;
  };
}, [user]);

  /*
   * HANDLE CHANGE
   */
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

  /*
   * START EDIT
   */
  const handleEdit = () => {
    setError("");
    setFormData(getFormData(profile));
    setEditing(true);
  };

  /*
   * SAVE PROFILE
   */
  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!formData.firstName.trim()) {
      setError("Vui lòng nhập họ.");
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Vui lòng nhập tên.");
      return;
    }

    if (!formData.gender) {
      setError("Vui lòng chọn giới tính.");
      return;
    }

    if (!formData.dob) {
      setError("Vui lòng chọn ngày sinh.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        dob: formData.dob,
        url: formData.url.trim(),
        skills: parseSkills(formData.skills),
      };

      const response = await profileService.updateMyProfile(payload);
      const updatedProfile = response.data?.result;

      // Nếu API trả về hồ sơ mới thì dùng dữ liệu đó.
      // Nếu API chỉ trả thông báo thành công, dùng payload vừa lưu.
      const nextProfile = updatedProfile
        ? {
            ...updatedProfile,
            skills:
              updatedProfile.skills ?? payload.skills,
          }
        : {
            ...profile,
            ...payload,
          };

      setProfile(nextProfile);
      setFormData(getFormData(nextProfile));
      setEditing(false);
    } catch (error) {
      console.error("Update profile failed:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data?.result?.message ||
          error.response?.data?.error ||
          "Không thể cập nhật hồ sơ."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * CANCEL
   */
  const handleCancel = () => {
    setFormData(getFormData(profile));
    setEditing(false);
    setError("");
  };

  /*
   * AUTH CHECK
   */
  if (!user) {
    return (
      <div className="profile-page">
        <Navbar />

        <main className="profile-container">
          <div className="profile-state">
            <div className="profile-state-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>

            <h2>Vui lòng đăng nhập</h2>

            <p>
              Bạn cần đăng nhập để xem thông tin hồ sơ cá nhân.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />

        <main className="profile-container">
          <div className="profile-state">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="profile-spinner"
            />

            <h2>Đang tải hồ sơ</h2>

            <p>Vui lòng chờ trong giây lát...</p>
          </div>
        </main>
      </div>
    );
  }

  /*
   * RENDER
   */
  const skills = parseSkills(profile?.skills);

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-container">
        {/* PAGE HEADER */}
        <div className="profile-page-header">
          <div>
            <span className="profile-label">
              <FontAwesomeIcon icon={faIdCard} />
              HỒ SƠ CÁ NHÂN
            </span>

            <h1>Thông tin của bạn</h1>

            <p>
              Quản lý thông tin cá nhân và hồ sơ JLearn của bạn.
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="profile-error" role="alert">
            <FontAwesomeIcon icon={faCircleExclamation} />
            <span>{error}</span>
          </div>
        )}

        {/* PROFILE CARD */}
        <section className="profile-card">
          {/* PROFILE HEADER */}
          <div className="profile-card-header">
            <div className="profile-avatar">
              {profile?.url ? (
                <img
                  src={profile.url}
                  alt="Avatar"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {profile?.firstName?.charAt(0)?.toUpperCase()}
                  {profile?.lastName?.charAt(0)?.toUpperCase()}

                  {!profile?.firstName &&
                    !profile?.lastName && (
                      <FontAwesomeIcon icon={faUser} />
                    )}
                </div>
              )}

              {editing && (
                <div
                  className="avatar-edit-icon"
                  title="Chỉnh sửa URL avatar ở bên dưới"
                >
                  <FontAwesomeIcon icon={faCamera} />
                </div>
              )}
            </div>

            <div className="profile-summary">
              <span>TÀI KHOẢN JLEARN</span>

              <h2>{user?.username || "Người dùng"}</h2>

              <p>{user?.email || "Chưa cập nhật email"}</p>
            </div>

            {!editing && (
              <button
                type="button"
                className="profile-edit-button"
                onClick={handleEdit}
              >
                <FontAwesomeIcon icon={faPen} />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>

          {/* EDIT FORM */}
          {editing ? (
            <form className="profile-form" onSubmit={handleSave}>
              <div className="profile-form-grid">
                {/* HỌ */}
                <div className="form-group">
                  <label htmlFor="firstName">Họ</label>

                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faUser} />

                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="Nhập họ"
                      required
                    />
                  </div>
                </div>

                {/* TÊN */}
                <div className="form-group">
                  <label htmlFor="lastName">Tên</label>

                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faUser} />

                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="Nhập tên"
                      required
                    />
                  </div>
                </div>

                {/* GIỚI TÍNH */}
                <div className="form-group">
                  <label htmlFor="gender">Giới tính</label>

                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faVenusMars} />

                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={saving}
                      required
                    >
                      <option value="">-- Chọn giới tính --</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                {/* NGÀY SINH */}
                <div className="form-group">
                  <label htmlFor="dob">Ngày sinh</label>

                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faCalendarDays} />

                    <input
                      id="dob"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                {/* AVATAR URL */}
                <div className="form-group profile-form-full">
                  <label htmlFor="url">Avatar URL</label>

                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faLink} />

                    <input
                      id="url"
                      name="url"
                      type="url"
                      value={formData.url}
                      onChange={handleChange}
                      placeholder="https://..."
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* SKILLS */}
                <div className="form-group profile-form-full">
                  <label htmlFor="skills">Kỹ năng</label>

                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faCode} />

                    <input
                      id="skills"
                      name="skills"
                      type="text"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="Java, Spring Boot, React..."
                      disabled={saving}
                    />
                  </div>

                  <p className="profile-skills-hint">
                    Nhập các kỹ năng và phân cách bằng dấu phẩy.
                  </p>
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="profile-actions">
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <FontAwesomeIcon icon={faXmark} />
                  <span>Hủy</span>
                </button>
              </div>
            </form>
          ) : (
            /* VIEW PROFILE */
            <>
              <div className="profile-details">
                <ProfileField
                  icon={faUser}
                  label="Username"
                  value={user?.username}
                />

                <ProfileField
                  icon={faUser}
                  label="Họ"
                  value={profile?.firstName}
                />

                <ProfileField
                  icon={faUser}
                  label="Tên"
                  value={profile?.lastName}
                />

                <ProfileField
                  icon={faVenusMars}
                  label="Giới tính"
                  value={getGenderLabel(profile?.gender)}
                />

                <ProfileField
                  icon={faCalendarDays}
                  label="Ngày sinh"
                  value={profile?.dob}
                />

                <ProfileField
                  icon={faEnvelope}
                  label="Email"
                  value={user?.email}
                  full
                />
              </div>

              {/* SKILLS SECTION */}
              <section className="profile-skills-section">
                <div className="profile-skills-header">
                  <div className="profile-skills-icon">
                    <FontAwesomeIcon icon={faCode} />
                  </div>

                  <div className="profile-skills-title">
                    <h3>Kỹ năng</h3>
                    <p>
                      Những công nghệ và kỹ năng bạn đang học hoặc sử dụng.
                    </p>
                  </div>

                  <span className="profile-skills-count">
                    {skills.length} kỹ năng
                  </span>
                </div>

                {skills.length > 0 ? (
                  <div className="profile-skills-list">
                    {skills.map((skill, index) => (
                      <span
                        className="profile-skill-tag"
                        key={`${skill}-${index}`}
                      >
                        <span className="profile-skill-dot" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="profile-skills-empty">
                    <FontAwesomeIcon icon={faCode} />

                    <span>
                      Bạn chưa cập nhật kỹ năng. Nhấn “Chỉnh sửa” để bổ sung.
                    </span>
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function getGenderLabel(gender) {
  const labels = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };

  return labels[gender] || gender || "";
}

function ProfileField({ icon, label, value, full = false }) {
  return (
    <div
      className={`profile-field ${
        full ? "profile-field-full" : ""
      }`}
    >
      <div className="profile-field-icon">
        <FontAwesomeIcon icon={icon} />
      </div>

      <div className="profile-field-content">
        <span>{label}</span>
        <strong>{value || "Chưa cập nhật"}</strong>
      </div>
    </div>
  );
}

export default Profile;
