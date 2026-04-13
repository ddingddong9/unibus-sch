import { createBrowserRouter } from "react-router-dom";
import SplashScreen from "../imports/SplashScreen";
import OnboardingWrapper from "./screens/OnboardingWrapper";
import LoginWrapper from "./screens/LoginWrapper";
import SignUpWrapper from "./screens/SignUpWrapper";
import HomeWrapper from "./screens/HomeWrapper";
import CampusShuttleWrapper from "./screens/CampusShuttleWrapper";
import CommuterBusWrapper from "./screens/CommuterBusWrapper";
import QrScannerWrapper from "./screens/QrScannerWrapper";
import NoticeWrapper from "./screens/NoticeWrapper";
import SettingsWrapper from "./screens/SettingsWrapper";
import { Layout } from "./components/Layout";
import { AnimatedMobileLayout } from "./components/AnimatedMobileLayout";
import { ProtectedOutlet } from "./components/ProtectedOutlet";
import { AdminOutlet } from "./components/AdminOutlet";
import { DriverOutlet } from "./components/DriverOutlet";
import DriverHomeWrapper from "./screens/driver/DriverHomeWrapper";
import DriverActiveWrapper from "./screens/driver/DriverActiveWrapper";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import NoticeManagement from "./admin/NoticeManagement";
import RouteManagement from "./admin/RouteManagement";
import NotificationSender from "./admin/NotificationSender";
import UserManagement from "./admin/UserManagement";

export const router = createBrowserRouter([
  // ── 모바일 앱 라우트 (AnimatedMobileLayout이 AnimatePresence 유지) ──
  {
    element: <AnimatedMobileLayout />,
    children: [
      // 스플래시
      {
        path: "/",
        element: (
          <Layout autoNavigate={{ to: "/onboarding", delay: 2500 }}>
            <SplashScreen />
          </Layout>
        ),
      },
      // 인증 화면 (공개)
      { path: "/onboarding", element: <OnboardingWrapper /> },
      { path: "/login",      element: <LoginWrapper /> },
      { path: "/signup",     element: <SignUpWrapper /> },
      // 보호된 화면
      {
        element: <ProtectedOutlet />,
        children: [
          { path: "/home",            element: <HomeWrapper /> },
          { path: "/campus-shuttle",  element: <CampusShuttleWrapper /> },
          { path: "/commuter-bus",    element: <CommuterBusWrapper /> },
          { path: "/qr-scanner",     element: <QrScannerWrapper /> },
          { path: "/notice",         element: <NoticeWrapper /> },
          { path: "/settings",       element: <SettingsWrapper /> },
        ],
      },
    ],
  },

  // ── 기사 라우트 (별도 레이아웃, 모바일 전용) ──
  {
    element: <DriverOutlet />,
    children: [
      { path: "/driver",        element: <DriverHomeWrapper /> },
      { path: "/driver/active", element: <DriverActiveWrapper /> },
    ],
  },

  // ── 관리자 라우트 (별도 레이아웃, 애니메이션 없음) ──
  { path: "/admin/login", Component: AdminLogin },
  {
    element: <AdminOutlet />,
    children: [
      { path: "/admin/dashboard",     element: <AdminDashboard /> },
      { path: "/admin/notices",       element: <NoticeManagement /> },
      { path: "/admin/routes",        element: <RouteManagement /> },
      { path: "/admin/notifications", element: <NotificationSender /> },
      { path: "/admin/users",         element: <UserManagement /> },
    ],
  },

  // ── 404 ──
  {
    path: "*",
    Component: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-gray-600 mb-4">Page not found</p>
          <a href="/home" className="text-blue-600 underline">
            Go to Home
          </a>
        </div>
      </div>
    ),
  },
]);
