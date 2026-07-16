import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
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
import { disablePushSubscription, ensurePushSubscription, isPushSupported } from "../utils/pushNotifications";
import { api } from "../services/api";
import type { ReportCategory } from "../types";

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
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(() => isNotificationEnabled());
  const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermission());
  const [location, setLocation] = useState(true);
  const [supportOpen, setSupportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportForm, setReportForm] = useState({ category: "location" as ReportCategory, title: "", details: "" });

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
      await disablePushSubscription();
      return;
    }

    if (!isBrowserNotificationSupported() || !isPushSupported()) {
      alert("이 브라우저에서는 백그라운드 푸시 알림을 지원하지 않습니다.");
      return;
    }

    const permission = notificationPermission === "granted"
      ? "granted"
      : await requestNotificationPermission();

    setNotificationPermission(permission);

    if (permission === "granted") {
      try {
        await ensurePushSubscription();
        setNotifications(true);
        setNotificationEnabled(true);
      } catch (error: any) {
        setNotifications(false);
        setNotificationEnabled(false);
        alert(error.message || "푸시 알림 등록에 실패했습니다.");
      }
      return;
    }

    setNotifications(false);
    setNotificationEnabled(false);
    if (permission === "denied") {
      alert("브라우저에서 알림 권한이 차단되어 있습니다. 브라우저 사이트 설정에서 알림을 허용해 주세요.");
    }
  };

  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportForm.title.trim() || !reportForm.details.trim()) {
      setReportMessage(t("제목과 내용을 모두 입력해 주세요.", "Please enter a title and details."));
      return;
    }
    setReporting(true);
    setReportMessage("");
    try {
      await api.createReport({ ...reportForm, title: reportForm.title.trim(), details: reportForm.details.trim() });
      setReportMessage(t("문의가 접수되었습니다. 관리자가 확인할 수 있습니다.", "Your report has been submitted."));
      setReportForm({ category: "location", title: "", details: "" });
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : t("문의 접수에 실패했습니다.", "Failed to submit your report."));
    } finally {
      setReporting(false);
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
              <svg className="w-3 h-5 text-[#0f172a]" fill="none" viewBox="0 0 12 20" stroke="currentColor" strokeWidth="2">
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
                aria-label={t("알림", "Notifications")}
                aria-pressed={notifications}
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
                <div className="bg-[#1e3a8a]/10 rounded-[8px] size-[40px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1e3a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                aria-label={t("위치 서비스", "Location Services")}
                aria-pressed={location}
                className={`relative w-[52px] h-[28px] rounded-full transition-colors ${
                  location ? "bg-[#1e3a8a]" : "bg-[#cbd5e1]"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform ${
                    location ? "translate-x-[26px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </motion.div>

            <motion.div variants={rowVariant} className="flex flex-col gap-3 p-4 bg-white border border-[#e2e8f0] rounded-[12px] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#64748b]/10 rounded-[8px] size-[40px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[20px]">
                    {t("화면 모드", "Appearance")}
                  </p>
                  <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[12px] leading-[16px]">
                    {theme === "dark"
                      ? t("다크 화면 사용", "Dark appearance")
                      : t("화이트 화면 사용", "Light appearance")}
                  </p>
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-1 rounded-[8px] bg-[#f1f5f9] p-1 sm:w-[156px]" role="group" aria-label={t("화면 모드", "Appearance")}>
                {([
                  { value: "light", label: t("화이트", "Light"), Icon: Sun },
                  { value: "dark", label: t("다크", "Dark"), Icon: Moon },
                ] as const).map(({ value, label, Icon }) => {
                  const selected = theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      aria-pressed={selected}
                      title={label}
                      className={`flex min-w-0 items-center justify-center gap-1 rounded-[6px] px-2 py-2 text-[11px] font-bold transition-colors ${
                        selected
                          ? "bg-white text-[#1e3a8a] shadow-sm"
                          : "text-[#64748b] hover:bg-white/80"
                      }`}
                    >
                      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
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
                  aria-pressed={language === 'en'}
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
                  aria-pressed={language === 'ko'}
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
              { label: t("도움말 & 지원", "Help & Support"), icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", onClick: () => { setReportMessage(""); setSupportOpen(true); } },
            ].map((item) => (
              <motion.button
                key={item.label}
                variants={rowVariant}
                whileTap={{ scale: 0.98 }}
                onClick={item.onClick}
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

      {supportOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="support-title">
          <form onSubmit={submitReport} className="w-full max-w-lg rounded-t-2xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div><h2 id="support-title" className="text-xl font-bold text-[#0f172a]">{t("문제 신고·문의", "Report a problem")}</h2><p className="mt-1 text-xs text-[#64748b]">{t("운영자가 관리자 페이지에서 바로 확인합니다.", "An operator will review it in the admin center.")}</p></div>
              <button type="button" onClick={() => setSupportOpen(false)} aria-label={t("문의 창 닫기", "Close support form")} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl text-[#64748b]">×</button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-[#0f172a]">{t("문제 유형", "Category")}<select value={reportForm.category} onChange={(event) => setReportForm((current) => ({ ...current, category: event.target.value as ReportCategory }))} className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm"><option value="location">{t("버스 위치 표시", "Bus location")}</option><option value="schedule">{t("노선·시간표", "Route or schedule")}</option><option value="notification">{t("알림", "Notification")}</option><option value="login">{t("로그인", "Login")}</option><option value="lost">{t("분실물", "Lost item")}</option><option value="other">{t("기타", "Other")}</option></select></label>
              <label className="block text-sm font-bold text-[#0f172a]">{t("제목", "Title")}<input value={reportForm.title} onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))} maxLength={160} placeholder={t("무슨 문제가 생겼나요?", "What happened?")} className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] px-3 text-sm" /></label>
              <label className="block text-sm font-bold text-[#0f172a]">{t("상세 내용", "Details")}<textarea value={reportForm.details} onChange={(event) => setReportForm((current) => ({ ...current, details: event.target.value }))} rows={5} placeholder={t("발생한 화면과 상황을 적어 주세요.", "Tell us which screen and what you were doing.")} className="mt-2 w-full resize-none rounded-lg border border-[#cbd5e1] p-3 text-sm leading-6" /></label>
            </div>
            {reportMessage ? <p role="status" className="mt-4 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800">{reportMessage}</p> : null}
            <button type="submit" disabled={reporting} className="mt-5 h-12 w-full rounded-lg bg-[#1e3a8a] text-sm font-bold text-white disabled:opacity-50">{reporting ? t("접수 중...", "Submitting...") : t("문의 접수", "Submit report")}</button>
          </form>
        </div>
      ) : null}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
