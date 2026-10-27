import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { hasAdminRole } from "../utils/role"; // Import từ helper

export default function AdminRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="route-loading">Đang kiểm tra quyền truy cập...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!hasAdminRole(user)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}