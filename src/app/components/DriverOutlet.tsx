import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function DriverOutlet() {
  const { isAuthenticated, isDriver, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E3B8A]" />
          <p className="mt-3 text-gray-500 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // admin도 driver 화면 접근 가능 (테스트용)
  if (!isDriver && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
