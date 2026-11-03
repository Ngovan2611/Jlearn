import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import AuthContext from "./authContext";
import apiClient from "../services/apiClients";

function AuthProvider({ children }) {
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const publicPages = ["/login", "/register"];
  const isPublicPage = publicPages.includes(location.pathname);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get("/auth/info");
      return response.data.result;
    } catch {
      return null;
    }
  };

  const getCurrentUser = async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setAuthLoading(false);
    return currentUser;
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  /*
   * ✅ SỬA LẠI EFFECT:
   * Chỉ kích hoạt fetch dữ liệu bất đồng bộ.
   * Không gọi setAuthLoading/setUser đồng bộ trong body hàm effect.
   */
  useEffect(() => {
    if (isPublicPage) return;

    let ignore = false;

    const checkAuthentication = async () => {
      const currentUser = await fetchCurrentUser();

      if (!ignore) {
        setUser(currentUser);
        setAuthLoading(false);
      }
    };

    checkAuthentication();

    return () => {
      ignore = true;
    };
  }, [location.pathname, isPublicPage]);

  // Derived state: Trang public thì không cần loading auth
  const loading = isPublicPage ? false : authLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        getCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;