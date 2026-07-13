import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Bell, BusFront, House, MapPinned, UserRound } from "lucide-react";
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

  const items = [
    { path: "/home", label: t("홈", "Home"), icon: House },
    { path: "/campus-shuttle", label: t("셔틀버스", "Shuttle"), icon: MapPinned },
    { path: "/commuter-bus", label: t("통학버스", "Commuter"), icon: BusFront },
    { path: "/notice", label: t("공지", "Notice"), icon: Bell, badge: unreadNotices > 0 },
    { path: "/settings", label: t("프로필", "Profile"), icon: UserRound },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[#dfe5ec] bg-white/95 px-2 pt-2 backdrop-blur-xl pb-safe-nav" aria-label={t("주요 메뉴", "Main navigation")}>
      <div className="grid h-[58px] grid-cols-5">
        {items.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg transition-colors active:bg-[#eef2f7] ${active ? "text-[#1e3a8a]" : "text-[#8390a3]"}`}
            >
              {active && <span className="absolute top-[-9px] h-[3px] w-7 rounded-full bg-[#1e3a8a]" />}
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2.5 : 2} />
                {item.badge && !active && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#ef4444] ring-2 ring-white" />}
              </span>
              <span className={`max-w-full truncate font-['Public_Sans'] text-[10px] leading-3 ${active ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
