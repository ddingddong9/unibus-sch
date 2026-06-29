import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { SettingsSkeleton } from "../components/SkeletonLoaders";
import {
  getNotificationPermission,
  isBrowserNotificationSupported,
  isNotificationEnabled,
  requestNotificationPermission,
  setNotificationEnabled,
} from "../utils/notificationPreferences";

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.0 } },
};
const rowVariant = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
};

export default function SettingsWrapper() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { logout, user, isAdmin, isLoading } = useAuth();
  const [notifications, setNotifications] = useState(() => isNotificationEnabled());
  const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermission());
  const [location, setLocation] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    if (confirm(t("로그아웃 하시겠습니까?", "Are you sure you want to logout?"))) {
      await logout();
      navigate("/login");
    }
  };

  const handleToggleNotifications = async () => {
    if (notifications) {
      setNotifications(false);
      setNotificationEnabled(false);
      return;
    }

    if (!isBrowserNotificationSupported()) {
      alert("이 브라우저에서는 알림을 지원하지 않습니다.");
      return;
    }

    const permission = notificationPermission === "granted"
      ? "granted"
      : await requestNotificationPermission();

    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotifications(true);
      setNotificationEnabled(true);
      return;
    }

    setNotifications(false);
    setNotificationEnabled(false);
    if (permission === "denied") {
      alert("브라우저에서 알림 권한이 차단되어 있습니다. 브라우저 사이트 설정에서 알림을 허용해 주세요.");
    }
  };

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-start relative size-full">
      <div className="bg-white content-stretch flex flex-col items-start overflow-auto pb-[120px] relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full scrollbar-hide" style={{ height: '100dvh' }}>
        {/* Header */}
        <div className="sticky top-0 z-30 w-full pt-safe">
          <div className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] flex items-center justify-between pb-[12px] pt-[16px] px-[16px] w-full border-b border-[#f1f5f9]">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center justify-center size-[40px] hover:bg-gray-100 rounded-full active:scale-95 transition-all"
            >
              <svg className="w-3 h-5" fill="none" viewBox="0 0 12 20" stroke="#0F172A" strokeWidth="2">
                <path d="M11 1L1 10L11 19" />
              </svg>
            </button>

            <div className="flex flex-col items-center">
              <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px] leading-[22.5px]">{t("설정", "Settings")}</p>
            </div>

            <div className="w-[40px]" />
          </div>
        </div>

        {/* ── Skeleton / Content switch ─────────────────────── */}
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.div
              key="settings-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <SettingsSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="settings-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >

        {/* Profile Section */}
        <motion.div
          className="w-full px-[24px] py-[24px] border-b border-[#f1f5f9]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.05 }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] rounded-full size-[72px] flex items-center justify-center overflow-hidden shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="profile" className="size-full object-cover" />
              ) : (
                <span className="font-['Public_Sans'] font-bold text-white text-[28px]">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] leading-[28px] mb-1 truncate">
                {user?.name ?? "-"}
              </h2>
              {user?.studentId && (
                <p className="font-['Public_Sans'] font-normal text-[#64748b] text-[14px] leading-[20px] mb-1">
                  {t("학번", "Student ID")}: {user.studentId}
                </p>
              )}
              <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[12px] leading-[16px] truncate">
                {user?.email ?? "-"}
              </p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 bg-[#f1f5f9] h-[44px] rounded-[8px] font-['Public_Sans'] font-semibold text-[#1e3a8a] text-[14px] hover:bg-[#e2e8f0] transition-all"
          >
            {t("프로필 수정", "Edit Profile")}
          </motion.button>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          className="w-full px-[24px] py-[16px]"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] leading-[24px] mb-4">
            {t("환경설정", "Preferences")}
          </h3>

          <div className="space-y-3">
            <motion.div variants={rowVariant} className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-[12px]">
              <div className="flex items-center gap-3">
                <div className="bg-[#1e3a8a]/10 rounded-[8px] size-[40px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1e3a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[20px]">
                    {t("알림", "Notifications")}
                  </p>
                  <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[12px] leading-[16px]">
                    {notificationPermission === "denied"
                      ? t("브라우저에서 알림 권한이 차단되어 있습니다", "Notifications are blocked in this browser")
                      : t("운행 변경 및 공지 알림 받기", "Receive route and notice alerts")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`relative w-[52px] h-[28px] rounded-full transition-colors ${
                  notifications ? "bg-[#1e3a8a]" : "bg-[#cbd5e1]"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform ${
                    notifications ? "translate-x-[26px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </motion.div>

            <motion.div variants={rowVariant} className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-[12px]">
              <div className="flex items-center gap-3">
                <div className="bg-[#10b981]/10 rounded-[8px] size-[40px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[20px]">
                    {t("위치 서비스", "Location Services")}
                  </p>
                  <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[12px] leading-[16px]">
                    {t("근처 버스정류장 찾기", "Find nearby bus stops")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLocation(!location)}
                className={`relative w-[52px] h-[28px] rounded-full transition-colors ${
                  location ? "bg-[#10b981]" : "bg-[#cbd5e1]"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform ${
                    location ? "translate-x-[26px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </motion.div>

            <motion.div variants={rowVariant} className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-[12px]">
              <div className="flex items-center gap-3">
                <div className="bg-[#64748b]/10 rounded-[8px] size-[40px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[20px]">
                    {t("다크 모드", "Dark Mode")}
                  </p>
                  <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[12px] leading-[16px]">
                    {t("곧 출시 예정", "Coming soon")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                disabled
                className={`relative w-[52px] h-[28px] rounded-full transition-colors opacity-50 cursor-not-allowed ${
                  darkMode ? "bg-[#64748b]" : "bg-[#cbd5e1]"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform ${
                    darkMode ? "translate-x-[26px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </motion.div>

            <motion.div variants={rowVariant} className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-[12px]">
              <div className="flex items-center gap-3">
                <div className="bg-[#64748b]/10 rounded-[8px] size-[40px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[20px]">
                    {t("언어", "Language")}
                  </p>
                  <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[12px] leading-[16px]">
                    {t("앱 언어 변경", "Change app language")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-[6px] font-['Public_Sans'] font-semibold text-[12px] transition-all ${
                    language === 'en' 
                      ? 'bg-[#1e3a8a] text-white' 
                      : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ko')}
                  className={`px-3 py-1.5 rounded-[6px] font-['Public_Sans'] font-semibold text-[12px] transition-all ${
                    language === 'ko' 
                      ? 'bg-[#1e3a8a] text-white' 
                      : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  KO
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Other Options */}
        <motion.div
          className="w-full px-[24px] py-[16px]"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] leading-[24px] mb-4">
            {t("기타", "Other")}
          </h3>

          <div className="space-y-2">
            {[
              { label: t("도움말 & 지원", "Help & Support"), icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: t("이용약관", "Terms & Conditions"), icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            ].map((item) => (
              <motion.button
                key={item.label}
                variants={rowVariant}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-[12px] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <p className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">{item.label}</p>
                </div>
                <svg className="w-5 h-5 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            ))}
            <motion.div variants={rowVariant} className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-[12px]">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">{t("앱 정보", "About")}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[12px]">v1.0.0</p>
                <svg className="w-5 h-5 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Admin Button (관리자 전용) */}
        {isAdmin && (
          <motion.div
            className="w-full px-[24px] pb-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={() => navigate("/admin/dashboard")}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-between p-4 bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 rounded-[12px] hover:bg-[#1e3a8a]/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#1e3a8a] rounded-[8px] size-[40px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-['Public_Sans'] font-semibold text-[#1e3a8a] text-[14px] leading-[20px]">
                    {t("관리자 페이지", "Admin Dashboard")}
                  </p>
                  <p className="font-['Public_Sans'] font-normal text-[#64748b] text-[12px] leading-[16px]">
                    {t("노선·공지·사용자 관리", "Manage routes, notices & users")}
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-[#1e3a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {/* Logout Button */}
        <motion.div
          className="w-full px-[24px] py-[24px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={handleLogout}
            whileTap={{ scale: 0.97 }}
            className="w-full h-auto py-3 font-['Public_Sans'] font-normal text-[#94a3b8] text-[14px] hover:text-[#ef4444] transition-colors"
          >
            {t("로그아웃", "Logout")}
          </motion.button>
        </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
        {/* ── End skeleton / content ────────────────────────── */}

      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
