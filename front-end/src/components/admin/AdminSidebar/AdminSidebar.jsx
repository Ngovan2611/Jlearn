import { NavLink } from "react-router-dom";
import "./AdminSidebar.css";

const menuItems = [
    { label: "Tổng quan", path: "/admin", icon: "▦", end: true },
    { label: "Người dùng", path: "/admin/users", icon: "♙" },
    { label: "Khóa học", path: "/admin/courses", icon: "▤" },
    
    { label: "Bài học", path: "/admin/lessons", icon: "▧" },
    { label: "Bài tập", path: "/admin/exercises", icon: "⌘" },
    {
        label: "Thống kê",
        path: "/admin/course-statistics",
        icon: "▥",
    },
];

export default function AdminSidebar() {
    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar__brand">
                <div className="admin-sidebar__logo">J</div>
                <div>
                    <h2>Jlearn</h2>
                    <span>Administration</span>
                </div>
            </div>

            <div className="admin-sidebar__section">
                <span>MENU CHÍNH</span>
            </div>

            <nav className="admin-sidebar__nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `admin-sidebar__link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >
                        <span className="admin-sidebar__icon">
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="admin-sidebar__footer">
                <span className="admin-sidebar__status" />
                <div>
                    <strong>Jlearn System</strong>
                    <small>Administration Panel</small>
                </div>
            </div>
        </aside>
    );
}