
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faVenusMars,
  faCalendarDays,
  faUserPlus,
  faMessage,
  faCircleExclamation,
  faSpinner,
  faCode,
} from "@fortawesome/free-solid-svg-icons";

import Navbar from "../../components/layout/Navbar/Navbar";
import profileService from "../../services/profileService";

import "./OtherProfile.css";

/*
 * Chuẩn hóa skills thành mảng chuỗi.
 * Hỗ trợ:
 * ["Java", "React"]
 * "Java, React"
 */
function normalizeSkills(skills) {
  let result = [];

  if (Array.isArray(skills)) {
    result = skills;
  } else if (typeof skills === "string") {
    result = skills.split(",");
  }

  return [
    ...new Set(
      result
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter(Boolean)
    ),
  ];
}

/*
 * OTHER PROFILE
 */
function OtherProfile() {
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * LOAD PROFILE
   */
  useEffect(() => {
    let ignore = false;

    const fetchProfile = async () => {
        if (!userId) {
            if (!ignore) {
                setError("Không tìm thấy mã người dùng.");
                setLoading(false);
            }
            return;
        }

        try {
            const response = await profileService.getProfileByUserId(userId);

            if (ignore) return;

            const data = response?.data?.result ?? response?.data;

            if (!data) {
                setError("Không tìm thấy thông tin người dùng.");
                return;
            }

            setProfile(data);
        } catch (err) {
            if (!ignore) {
                setError(
                    err?.response?.data?.message ||
                    "Không thể tải thông tin người dùng."
                );
            }
        } finally {
            if (!ignore) {
                setLoading(false);
            }
        }
    };

    fetchProfile();

    return () => {
        ignore = true;
    };
}, [userId]);

  /*
   * LOADING
   */
  if (loading) {
    return (
      <div className="other-profile-page">
        <Navbar />

        <main className="other-profile-container">
          <div className="other-profile-state">
            <FontAwesomeIcon icon={faSpinner} spin />

            <span>Đang tải hồ sơ...</span>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ERROR
   */
  if (error) {
    return (
      <div className="other-profile-page">
        <Navbar />

        <main className="other-profile-container">
          <div className="other-profile-error" role="alert">
            <FontAwesomeIcon icon={faCircleExclamation} />

            <span>{error}</span>
          </div>
        </main>
      </div>
    );
  }

  /*
   * PROFILE NOT FOUND
   */
  if (!profile) {
    return (
      <div className="other-profile-page">
        <Navbar />

        <main className="other-profile-container">
          <div className="other-profile-state">
            <div className="other-profile-empty-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>

            <h2>Không tìm thấy người dùng</h2>

            <p>
              Hồ sơ này không tồn tại hoặc không còn khả dụng.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /*
   * PROFILE DATA
   */
  const fullName =
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  const initials =
    `${profile.firstName?.charAt(0) || ""}${
      profile.lastName?.charAt(0) || ""
    }`.toUpperCase();

  const skills = normalizeSkills(profile.skills);

  /*
   * RENDER
   */
  return (
    <div className="other-profile-page">
      <Navbar />

      <main className="other-profile-container">
        {/* PAGE HEADER */}
        <div className="other-profile-header">
          <span className="other-profile-label">JLEARN</span>

          <h1>Trang cá nhân</h1>

          <p>Thông tin của người dùng</p>
        </div>

        {/* PROFILE CARD */}
        <section className="other-profile-card">
          {/* AVATAR */}
          <div className="other-profile-avatar-wrapper">
            <div className="other-profile-avatar">
              {profile.url ? (
                <img
                  src={profile.url}
                  alt={`Avatar của ${fullName || "người dùng"}`}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="other-avatar-placeholder">
                  {initials || <FontAwesomeIcon icon={faUser} />}
                </div>
              )}
            </div>
          </div>

          {/* NAME */}
          <div className="other-profile-name">
            <h2>{fullName || "Người dùng"}</h2>

            <span>Thành viên JLearn</span>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="other-profile-info">
            <ProfileField
              icon={faUser}
              label="Họ"
              value={profile.firstName}
            />

            <ProfileField
              icon={faUser}
              label="Tên"
              value={profile.lastName}
            />

            <ProfileField
              icon={faVenusMars}
              label="Giới tính"
              value={formatGender(profile.gender)}
            />

            <ProfileField
              icon={faCalendarDays}
              label="Ngày sinh"
              value={profile.dob}
            />
          </div>

          {/* SKILLS */}
          <section className="other-profile-skills">
            <div className="other-profile-skills-header">
              <div className="other-profile-skills-icon">
                <FontAwesomeIcon icon={faCode} />
              </div>

              <div className="other-profile-skills-heading">
                <h3>Kỹ năng</h3>

                <p>
                  Những công nghệ và kỹ năng người dùng đang học
                  hoặc sử dụng.
                </p>
              </div>

              <span className="other-profile-skills-count">
                {skills.length} kỹ năng
              </span>
            </div>

            {skills.length > 0 ? (
              <div className="other-profile-skills-list">
                {skills.map((skill, index) => (
                  <span
                    className="other-profile-skill-tag"
                    key={`${skill}-${index}`}
                  >
                    <span className="other-profile-skill-dot" />

                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="other-profile-skills-empty">
                <FontAwesomeIcon icon={faCode} />

                <span>Người dùng chưa cập nhật kỹ năng.</span>
              </div>
            )}
          </section>

          {/* ACTIONS */}
          <div className="other-profile-actions">
            <button
              type="button"
              className="follow-button"
            >
              <FontAwesomeIcon icon={faUserPlus} />

              <span>Theo dõi</span>
            </button>

            <button
              type="button"
              className="message-button"
            >
              <FontAwesomeIcon icon={faMessage} />

              <span>Nhắn tin</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

/*
 * FORMAT GENDER
 */
function formatGender(gender) {
  if (!gender) {
    return "Chưa cập nhật";
  }

  const genderMap = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };

  return genderMap[gender] || gender;
}

/*
 * PROFILE FIELD
 */
function ProfileField({ icon, label, value }) {
  return (
    <div className="other-profile-field">
      <div className="other-profile-field-icon">
        <FontAwesomeIcon icon={icon} />
      </div>

      <div className="other-profile-field-content">
        <span>{label}</span>

        <strong>{value || "Chưa cập nhật"}</strong>
      </div>
    </div>
  );
}

export default OtherProfile;
