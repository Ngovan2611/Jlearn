
import { useNavigate } from "react-router-dom";
import "./AdminHeader.css";

export default function AdminHeader({
    user,
    onLogout,
}) {
    const navigate = useNavigate();

    const displayName =
        user?.username || user?.fullName || user?.email || "Administrator";

    return (
        <header className="admin-header">
            <div>
                <div className="admin-header__breadcrumb">
                    Jlearn / Administration
                </div>
            </div>

            <div className="admin-header__actions">
                <div className="admin-header__profile">
                    <div className="admin-header__avatar">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-header__user">
                        <strong>{displayName}</strong>
                        <span>Administrator</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="admin-header__logout"
                    onClick={() => {
                        if (onLogout) {
                            onLogout();
                        } else {
                            navigate("/login");
                        }
                    }}
                >
                    Đăng xuất
                </button>
            </div>
        </header>
    );
}
