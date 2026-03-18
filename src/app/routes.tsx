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
import { MobileLayout } from "./components/MobileLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import NoticeManagement from "./admin/NoticeManagement";
import RouteManagement from "./admin/RouteManagement";
import NotificationSender from "./admin/NotificationSender";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <MobileLayout>
        <Layout autoNavigate={{ to: "/onboarding", delay: 2500 }}>
          <SplashScreen />
        </Layout>
      </MobileLayout>
    ),
  },
  {
    path: "/onboarding",
    element: (
      <MobileLayout>
        <OnboardingWrapper />
      </MobileLayout>
    ),
  },
  {
    path: "/login",
    element: (
      <MobileLayout>
        <LoginWrapper />
      </MobileLayout>
    ),
  },
  {
    path: "/signup",
    element: (
      <MobileLayout>
        <SignUpWrapper />
      </MobileLayout>
    ),
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <MobileLayout>
          <HomeWrapper />
        </MobileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/campus-shuttle",
    element: (
      <ProtectedRoute>
        <MobileLayout>
          <CampusShuttleWrapper />
        </MobileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/commuter-bus",
    element: (
      <ProtectedRoute>
        <MobileLayout>
          <CommuterBusWrapper />
        </MobileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/qr-scanner",
    element: (
      <ProtectedRoute>
        <MobileLayout>
          <QrScannerWrapper />
        </MobileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/notice",
    element: (
      <ProtectedRoute>
        <MobileLayout>
          <NoticeWrapper />
        </MobileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <MobileLayout>
          <SettingsWrapper />
        </MobileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin/dashboard",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/notices",
    element: (
      <AdminRoute>
        <NoticeManagement />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/routes",
    element: (
      <AdminRoute>
        <RouteManagement />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/notifications",
    element: (
      <AdminRoute>
        <NotificationSender />
      </AdminRoute>
    ),
  },
  {
    path: "*",
    Component: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-gray-600 mb-4">Page not found</p>
          <a href="/home" className="text-blue-600 underline">Go to Home</a>
        </div>
      </div>
    ),
  },
]);