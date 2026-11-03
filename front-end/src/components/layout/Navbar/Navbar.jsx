import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faUser,
    faLock,
    faRightFromBracket,
    faChevronDown,
    faSpinner,
    faCode,
    faRobot,
    faHouse,
} from "@fortawesome/free-solid-svg-icons";

import Logo from "../../common/Logo/Logo";
import Button from "../../common/Button/Button";
import { useAuth } from "../../../context/useAuth";

import "./Navbar.css";

function Navbar() {
    const navigate = useNavigate();

    const {
        user,
        loading,
        logout,
    } = useAuth();

    const [openProfile, setOpenProfile] = useState(false);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setOpenProfile(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const handleLogout = async () => {
        setOpenProfile(false);

        await logout();

        navigate("/login");
    };

    const handleNavigate = (path) => {
        setOpenProfile(false);
        navigate(path);
    };

    return (
        <header className="navbar">

            {/* Logo */}
            <Logo />

            {/* Main navigation */}
            <nav>

                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        isActive ? "active" : ""
                    }
                >
                    <FontAwesomeIcon icon={faHouse} />
                    <span>Trang chủ</span>
                </NavLink>

                <NavLink
                    to="/courses"
                    className={({ isActive }) =>
                        isActive ? "active" : ""
                    }
                >
                    <FontAwesomeIcon icon={faBookOpen} />
                    <span>Khóa học</span>
                </NavLink>

                <NavLink
                    to="/practice"
                    className={({ isActive }) =>
                        isActive ? "active" : ""
                    }
                >
                    <FontAwesomeIcon icon={faCode} />
                    <span>Luyện code</span>
                </NavLink>

                <NavLink
                    to="/ai-tutor"
                    className={({ isActive }) =>
                        isActive ? "active" : ""
                    }
                >
                    <FontAwesomeIcon icon={faRobot} />
                    <span>AI Tutor</span>
                </NavLink>

            </nav>

            {/* Right actions */}
            <div className="nav-actions">

                {loading ? (

                    <div className="navbar-loading">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                        />

                        <span>Đang tải...</span>
                    </div>

                ) : user ? (

                    <div
                        className="profile-dropdown"
                        ref={profileRef}
                    >

                        {/* Profile button */}
                        <button
                            type="button"
                            className="profile-dropdown-button"
                            onClick={() =>
                                setOpenProfile(
                                    (prev) => !prev
                                )
                            }
                        >
                            <FontAwesomeIcon icon={faUser} />

                            <span>
                                Xin chào, {user.username}
                            </span>

                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`profile-arrow ${
                                    openProfile ? "open" : ""
                                }`}
                            />
                        </button>

                        {/* Dropdown */}
                        {openProfile && (
                            <div className="profile-dropdown-menu">

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleNavigate(
                                            "/my-courses"
                                        )
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faBookOpen}
                                        className="menu-icon"
                                    />

                                    <span>
                                        Khóa học của tôi
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleNavigate(
                                            "/profile"
                                        )
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faUser}
                                        className="menu-icon"
                                    />

                                    <span>
                                        Chỉnh sửa thông tin cá nhân
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleNavigate(
                                            "/change-password"
                                        )
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faLock}
                                        className="menu-icon"
                                    />

                                    <span>
                                        Thay đổi mật khẩu
                                    </span>
                                </button>

                                <div className="profile-menu-divider" />

                                <button
                                    type="button"
                                    className="logout-menu-item"
                                    onClick={handleLogout}
                                >
                                    <FontAwesomeIcon
                                        icon={faRightFromBracket}
                                        className="menu-icon"
                                    />

                                    <span>
                                        Đăng xuất
                                    </span>
                                </button>

                            </div>
                        )}

                    </div>

                ) : (

                    <>
                        <Button
                            className="login"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            Đăng nhập
                        </Button>

                        <Button
                            variant="primary"
                            onClick={() =>
                                navigate("/register")
                            }
                        >
                            Đăng ký
                        </Button>
                    </>

                )}

            </div>

        </header>
    );
}

export default Navbar;