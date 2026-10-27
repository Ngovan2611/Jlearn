import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { hasAdminRole } from "../utils/role"; // ✅ Import chính xác từ helper
import Loading from "../components/common/Loading/Loading.jsx";

function ProtectedRoute({ children, allowAdmin = false }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading text="Đang xác thực tài khoản..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowAdmin && hasAdminRole(user)) {
        return <Navigate to="/admin" replace />;
    }

    return children ? children : <Outlet />;
}

export default ProtectedRoute;