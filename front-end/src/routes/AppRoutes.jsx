import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { hasAdminRole } from "../utils/role"; // ✅ Import chính xác từ helper

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import AIChatWidget from "../components/ai-tutor/AIChatWidget";

// Pages
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import AITutor from "../pages/AITutor/AITutor";
import Profile from "../pages/Profile/Profile";
import ProfileSetup from "../pages/ProfileSetup/ProfileSetup";
import OtherProfile from "../pages/OtherProfile/OtherProfile";

import Courses from "../pages/Courses/Course";
import CourseDetail from "../pages/CourseDetail/CourseDetail";
import Lesson from "../pages/Lesson/Lesson";
import Exercise from "../pages/Practice/Exercise";
import Practice from "../pages/Practice/Practice";
import PracticeCode from "../pages/Practice/PracticeCode";
import MyCourses from "../pages/enrollment/MyCourses";

// Admin Pages & Layout
import AdminLayout from "../layout/AdminLayout/AdminLayout";
import DashboardPage from "../pages/admin/Dashboard/DashboardPage";
import UserManagementPage from "../pages/admin/UserManagement/UserManagementPage";
import CourseManagementPage from "../pages/admin/CourseManagement/CourseManagementPage";
import LessonManagementPage from "../pages/admin/LessonManagement/LessonManagementPage";
import CourseStatisticsPage from "../pages/admin/CourseStatistics/CourseStatisticsPage";
import ExerciseManagementPage from "../pages/admin/ExerciseManagementPage/ExerciseManagementPage";
// Route chỉ dành cho người chưa đăng nhập (Login / Register)
function PublicOnlyRoute() {
    const { user } = useAuth();

    if (user) {
        return <Navigate to={hasAdminRole(user) ? "/admin" : "/"} replace />;
    }

    return <Outlet />;
}

// Xử lý riêng cho Trang chủ /: Admin truy cập / sẽ tự redirect sang /admin
function RootRoute() {
    const { user } = useAuth();

    if (user && hasAdminRole(user)) {
        return <Navigate to="/admin" replace />;
    }

    return <Home />;
}

// Layout chung cho Client
function AppLayout() {
    return (
        <>
            <Outlet />
            <AIChatWidget />
        </>
    );
}

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* ================= ADMIN ROUTES ================= */}
            <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route
                        path="/admin/course-statistics"
                        element={<CourseStatisticsPage />}
                    />
                    <Route path="/admin/courses" element={<CourseManagementPage />} />
                    <Route path="/admin/lessons" element={<LessonManagementPage />} />
                    <Route path="/admin/exercises" element={<ExerciseManagementPage />} />
                </Route>
            </Route>

            {/* ================= CLIENT ROUTES ================= */}
            <Route element={<AppLayout />}>
                {/* Trang chủ */}
                <Route path="/" element={<RootRoute />} />

                {/* Trang công khai chỉ dành cho khách chưa đăng nhập */}
                <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                {/* ================= PROTECTED USER ROUTES ================= */}
                {/* allowAdmin = false: Ngăn cấm Admin truy cập vào các trang học tập của User */}
                <Route element={<ProtectedRoute allowAdmin={false} />}>
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:id" element={<CourseDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/ai-tutor" element={<AITutor />} />
                    <Route path="/profile/setup" element={<ProfileSetup />} />
                    <Route path="/profile/:userId" element={<OtherProfile />} />

                    {/* Learning & Practice */}
                    <Route path="/lessons/:lessonId" element={<Lesson />} />
                    <Route path="/lessons/:lessonId/exercises" element={<Exercise />} />
                    <Route path="/practice" element={<Practice />} />
                    <Route path="/practice/:exerciseId" element={<PracticeCode />} />

                    {/* Enrollment */}
                    <Route path="/my-courses" element={<MyCourses />} />
                </Route>

                {/* ================= 404 CATCH-ALL ================= */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={user && hasAdminRole(user) ? "/admin" : "/"}
                            replace
                        />
                    }
                />
            </Route>
        </Routes>
    );
}

export default AppRoutes;