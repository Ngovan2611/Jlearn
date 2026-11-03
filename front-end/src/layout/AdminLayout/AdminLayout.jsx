
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import AdminSidebar from "../../components/admin/AdminSidebar/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader/AdminHeader";

import "./AdminLayout.css";


export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

 

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />

            <div className="admin-layout__main">
                <AdminHeader
                    
                    user={user}
                    onLogout={handleLogout}
                />

                <main className="admin-layout__content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
