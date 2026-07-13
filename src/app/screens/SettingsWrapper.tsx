import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Check,
  ChevronRight,
  Languages,
  LocateFixed,
  LockKeyhole,
  LogOut,
  Mail,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import { SettingsSkeleton } from "../components/SkeletonLoaders";
import UserPageHeader from "../components/UserPageHeader";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  getNotificationPermission,
  isBrowserNotificationSupported,
  isNotificationEnabled,
  requestNotificationPermission,
  setNotificationEnabled,
} from "../utils/notificationPreferences";
import { disablePushSubscription, ensurePushSubscription, isPushSupported } from "../utils/pushNotifications";

type LocationPermission = PermissionState | "unsupported";

export default function SettingsWrapper() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { logout, user, isAdmin, isLoading } = useAuth();
  const [notifications, setNotifications] = useState(
    () => isNotificationEnabled() && getNotificationPermission() === "granted",
  );
  const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermission());
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [locationPermission, setLocationPermission] = useState<LocationPermission>("prompt");

  useEffect(() => {
    if (!navigator.permissions?.query) {
      setLocationPermission(navigator.geolocation ? "prompt" : "unsupported");
      return;
    }
    let status: PermissionStatus | null = null;
    const update = () => status && setLocationPermission(status.state);
    navigator.permissions.query({ name: "geolocation" }).then((nextStatus) => {
      status = nextStatus;
      setLocationPermission(nextStatus.state);
      nextStatus.addEventListener("change", update);
    }).catch(() => setLocationPermission(navigator.geolocation ? "prompt" : "unsupported"));
    return () => status?.removeEventListener("change", update);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm(t("로그아웃하시겠습니까?", "Log out of UNIBUS?"))) return;
    await logout();
    navigate("/login");
  };

  const handleToggleNotifications = async () => {
    if (notificationBusy) return;
    setNotificationBusy(true);
    try {
      if (notifications) {
        await disablePushSubscription();
        setNotifications(false);
        setNotificationEnabled(false);
        return;
      }
      if (!isBrowserNotificationSupported() || !isPushSupported()) {
        window.alert(t("이 브라우저에서는 백그라운드 알림을 지원하지 않습니다.", "Background notifications are not supported in this browser."));
        return;
      }
      const permission = notificationPermission === "granted" ? "granted" : await requestNotificationPermission();
      setNotificationPermission(permission);
      if (permission !== "granted") {
        setNotifications(false);
        setNotificationEnabled(false);
        if (permission === "denied") {
          window.alert(t("브라우저 사이트 설정에서 알림 권한을 허용해 주세요.", "Allow notifications in your browser site settings."));
        }
        return;
      }
      await ensurePushSubscription();
      setNotifications(true);
      setNotificationEnabled(true);
    } catch (caught) {
      setNotifications(false);
      setNotificationEnabled(false);
      window.alert(caught instanceof Error ? caught.message : t("알림 등록에 실패했습니다.", "Unable to enable notifications."));
    } finally {
      setNotificationBusy(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermission("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocationPermission("granted"),
      (error) => setLocationPermission(error.code === error.PERMISSION_DENIED ? "denied" : "prompt"),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 300_000 },
    );
  };

  const permissionLabel = (permission: LocationPermission) => {
    if (permission === "granted") return t("허용됨", "Allowed");
    if (permission === "denied") return t("차단됨", "Blocked");
    if (permission === "unsupported") return t("지원 안 함", "Unsupported");
    return t("권한 필요", "Permission needed");
  };

  return (
    <div className="relative size-full bg-[#f4f6f9]">
      <main className="h-[100dvh] overflow-y-auto pb-[112px] scrollbar-hide">
        <UserPageHeader
          title={t("프로필", "Profile")}
          subtitle={t("계정과 앱 권한 관리", "Account and app permissions")}
          action={<Settings2 size={21} className="text-[#1e3a8a]" />}
        />

        {isLoading ? <SettingsSkeleton /> : (
          <div className="space-y-5 px-4 py-5">
            <section className="rounded-lg bg-[#102a63] p-5 text-white shadow-[0_8px_24px_rgba(15,42,99,0.16)]">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/15">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={t("프로필 사진", "Profile")} className="size-full object-cover" />
                  ) : (
                    <span className="font-['Public_Sans'] text-[25px] font-black">{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-['Public_Sans'] text-[21px] font-bold leading-7">{user?.name ?? t("사용자", "User")}</h2>
                  <p className="mt-1 truncate font-['Public_Sans'] text-[12px] text-[#bfdbfe]">{user?.email ?? "-"}</p>
                  {user?.studentId && <p className="mt-0.5 font-['Public_Sans'] text-[11px] text-white/60">{t("학번", "Student ID")} {user.studentId}</p>}
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-2 px-1 font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">{t("계정", "Account")}</h2>
              <div className="overflow-hidden rounded-lg border border-[#dfe5ec] bg-white">
                <div className="flex min-h-14 items-center gap-3 px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7] text-[#526074]"><UserRound size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Public_Sans'] text-[11px] text-[#94a3b8]">{t("이름", "Name")}</p>
                    <p className="truncate font-['Public_Sans'] text-[13px] font-semibold text-[#0f172a]">{user?.name ?? "-"}</p>
                  </div>
                </div>
                <div className="mx-4 border-t border-[#edf1f5]" />
                <div className="flex min-h-14 items-center gap-3 px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7] text-[#526074]"><Mail size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Public_Sans'] text-[11px] text-[#94a3b8]">{t("이메일", "Email")}</p>
                    <p className="truncate font-['Public_Sans'] text-[13px] font-semibold text-[#0f172a]">{user?.email ?? "-"}</p>
                  </div>
                  <LockKeyhole size={15} className="text-[#94a3b8]" />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-2 px-1 font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">{t("권한과 알림", "Permissions")}</h2>
              <div className="overflow-hidden rounded-lg border border-[#dfe5ec] bg-white">
                <div className="flex min-h-[72px] items-center gap-3 px-4 py-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0ff] text-[#1e3a8a]"><Bell size={19} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Public_Sans'] text-[14px] font-bold text-[#0f172a]">{t("운행 알림", "Service alerts")}</p>
                    <p className="font-['Public_Sans'] text-[11px] leading-4 text-[#64748b]">
                      {notificationPermission === "denied" ? t("브라우저에서 차단됨", "Blocked by browser") : t("앱을 닫아도 중요 공지 받기", "Receive updates in the background")}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications}
                    disabled={notificationBusy}
                    onClick={handleToggleNotifications}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${notifications ? "bg-[#1e3a8a]" : "bg-[#cbd5e1]"}`}
                  >
                    <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform ${notifications ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="mx-4 border-t border-[#edf1f5]" />
                <div className="flex min-h-[72px] items-center gap-3 px-4 py-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f8f1] text-[#087f5b]"><LocateFixed size={19} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Public_Sans'] text-[14px] font-bold text-[#0f172a]">{t("위치 권한", "Location")}</p>
                    <p className="font-['Public_Sans'] text-[11px] leading-4 text-[#64748b]">{t("가장 가까운 정류장을 찾는 데 사용", "Used to find your nearest stop")}</p>
                  </div>
                  {locationPermission === "prompt" ? (
                    <button type="button" onClick={requestLocation} className="h-8 rounded-md bg-[#087f5b] px-3 font-['Public_Sans'] text-[11px] font-bold text-white">{t("허용", "Allow")}</button>
                  ) : (
                    <span className={`flex items-center gap-1 rounded-md px-2 py-1 font-['Public_Sans'] text-[11px] font-bold ${locationPermission === "granted" ? "bg-[#e8f8f1] text-[#087f5b]" : "bg-[#f1f5f9] text-[#64748b]"}`}>
                      {locationPermission === "granted" && <Check size={12} />}{permissionLabel(locationPermission)}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-2 px-1 font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">{t("화면", "Display")}</h2>
              <div className="flex min-h-[68px] items-center gap-3 rounded-lg border border-[#dfe5ec] bg-white px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#fff4dc] text-[#a16207]"><Languages size={19} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-['Public_Sans'] text-[14px] font-bold text-[#0f172a]">{t("언어", "Language")}</p>
                  <p className="font-['Public_Sans'] text-[11px] text-[#64748b]">{language === "ko" ? "한국어" : "English"}</p>
                </div>
                <div className="flex rounded-md bg-[#e5eaf0] p-0.5">
                  {(["ko", "en"] as const).map((item) => (
                    <button key={item} type="button" onClick={() => setLanguage(item)} className={`h-8 rounded px-3 font-['Public_Sans'] text-[11px] font-bold ${language === item ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"}`}>{item === "ko" ? "한국어" : "EN"}</button>
                  ))}
                </div>
              </div>
            </section>

            {isAdmin && (
              <button type="button" onClick={() => navigate("/admin/dashboard")} className="flex w-full items-center gap-3 rounded-lg border border-[#b8c8e8] bg-[#edf2ff] px-4 py-4 text-left active:bg-[#e2eafe]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1e3a8a] text-white"><ShieldCheck size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-['Public_Sans'] text-[14px] font-bold text-[#102a63]">{t("관리자 페이지", "Admin dashboard")}</span>
                  <span className="block font-['Public_Sans'] text-[11px] text-[#526b9c]">{t("노선, 버스, 공지 관리", "Manage routes, buses and notices")}</span>
                </span>
                <ChevronRight size={18} className="text-[#1e3a8a]" />
              </button>
            )}

            <div className="flex items-center justify-between px-1 font-['Public_Sans'] text-[11px] text-[#94a3b8]">
              <span>UNIBUS</span>
              <span>{t("순천향대학교 셔틀 안내", "Soonchunhyang shuttle service")}</span>
            </div>

            <button type="button" onClick={handleLogout} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#fecaca] bg-white font-['Public_Sans'] text-[13px] font-bold text-[#dc2626] active:bg-[#fff5f5]">
              <LogOut size={17} />{t("로그아웃", "Log out")}
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
