import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import svgPaths from "../../imports/svg-l5s7zp6z8c";
import { useLanguage } from "../contexts/LanguageContext";
import { getUnreadNoticeCount } from "../utils/notificationPreferences";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [unreadNotices, setUnreadNotices] = useState(() => getUnreadNoticeCount());

  const isActive = (path: string) => location.pathname === path || (path === "/campus-shuttle" && location.pathname === "/shuttle");

  useEffect(() => {
    const handleUnread = (event: Event) => {
      const customEvent = event as CustomEvent<{ count: number }>;
      setUnreadNotices(customEvent.detail?.count ?? getUnreadNoticeCount());
    };
    window.addEventListener("unibus:notification-unread", handleUnread);
    return () => window.removeEventListener("unibus:notification-unread", handleUnread);
  }, []);

  return (
    <nav
      aria-label={t("주요 화면", "Primary")}
      className="absolute inset-x-0 bottom-0 z-50 flex w-full max-w-[430px] items-center justify-center border-t border-[#e2e8f0] bg-[rgba(255,255,255,0.95)] px-[24px] pb-safe-nav pt-[13px] backdrop-blur-[12px]"
    >
      <div className="flex items-center justify-between w-full">
        {/* Home */}
        <button
          onClick={() => navigate("/home")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="h-[19.5px] relative shrink-0 w-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 19.5">
              <path d={svgPaths.p39defd40} fill={isActive("/home") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/home") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className={`leading-[16.5px] ${isActive("/home") ? "text-[#1e3a8a]" : "text-[#94a3b8]"}`}>
              {t("홈", "Home")}
            </p>
          </div>
        </button>

        {/* 셔틀버스 */}
        <button
          onClick={() => navigate("/campus-shuttle")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="h-[20.583px] relative shrink-0 w-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 20.5833">
              <path d={svgPaths.p5662500} fill={isActive("/campus-shuttle") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/campus-shuttle") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className={`leading-[16.5px] ${isActive("/campus-shuttle") ? "text-[#1e3a8a]" : "text-[#94a3b8]"}`}>
              {t("셔틀버스", "Shuttle")}
            </p>
          </div>
        </button>

        {/* 통학버스 */}
        <button
          onClick={() => navigate("/commuter-bus")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="h-[20.583px] relative shrink-0 w-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 20.5833">
              <path d={svgPaths.p5662500} fill={isActive("/commuter-bus") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/commuter-bus") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className={`leading-[16.5px] ${isActive("/commuter-bus") ? "text-[#1e3a8a]" : "text-[#94a3b8]"}`}>
              {t("통학버스", "Commuter")}
            </p>
          </div>
        </button>

        {/* Notice */}
        <button
          onClick={() => navigate("/notice")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          {unreadNotices > 0 && !isActive("/notice") && (
            <span className="absolute right-[10px] top-[-3px] z-10 size-[8px] rounded-full bg-[#ef4444] ring-2 ring-white" />
          )}
          <div className="h-[21.667px] relative shrink-0 w-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 21.6667">
              <path d={svgPaths.p3827a538} fill={isActive("/notice") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/notice") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className={`leading-[16.5px] ${isActive("/notice") ? "text-[#1e3a8a]" : "text-[#94a3b8]"}`}>
              {t("공지", "Notice")}
            </p>
          </div>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate("/settings")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="relative shrink-0 size-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 17.3333">
              <path d={svgPaths.p1c6e17c0} fill={isActive("/settings") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/settings") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className={`leading-[16.5px] ${isActive("/settings") ? "text-[#1e3a8a]" : "text-[#94a3b8]"}`}>
              {t("프로필", "Profile")}
            </p>
          </div>
        </button>
      </div>

      {/* Bottom Indicator */}
      <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2">
        <div className="bg-[#e2e8f0] h-[6px] rounded-[9999px] w-[128px]" />
      </div>
    </nav>
  );
}
