import { type ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bus,
  CircleHelp,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorPlay,
  Route,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AdminLayoutProps {
  children: ReactNode;
}

interface AdminMenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
  section: string;
}

interface SidebarContentProps {
  menuItems: AdminMenuItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onGoToUserPage: () => void;
  onLogout: () => void;
  onClose?: () => void;
}

function SidebarContent({
  menuItems,
  currentPath,
  onNavigate,
  onGoToUserPage,
  onLogout,
  onClose,
}: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3b8a]">
            <span className="text-lg font-bold text-white">U</span>
          </div>
          <div>
            <h1 className="font-['Public_Sans'] text-[18px] font-bold text-[#0f172a]">UNIBUS SCH</h1>
            <p className="font-['Public_Sans'] text-[11px] text-[#64748b]">관리자 대시보드</p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="관리자 메뉴 닫기"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg text-[#64748b] hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1.5">
          {menuItems.map((item, index) => {
            const isActive = currentPath === item.path;
            return (
              <li key={item.path}>
                {index === 0 || menuItems[index - 1].section !== item.section ? (
                  <p className="mb-2 mt-4 px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] first:mt-0">
                    {item.section}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-['Public_Sans'] text-[14px] transition-colors ${
                    isActive
                      ? "bg-[#1e3b8a] font-semibold text-white"
                      : "text-[#64748b] hover:bg-gray-100 hover:text-[#0f172a]"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-2 border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={onGoToUserPage}
          className="flex w-full items-center gap-3 rounded-xl border border-[#1e3a8a]/20 bg-[#1e3a8a]/5 p-3 text-left transition-colors hover:bg-[#1e3a8a]/10"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#1e3a8a]">
            <Home className="h-5 w-5 text-white" />
          </span>
          <span className="min-w-0">
            <span className="block font-['Public_Sans'] text-[13px] font-semibold text-[#1e3a8a]">사용자 페이지로</span>
            <span className="block font-['Public_Sans'] text-[11px] text-[#64748b]">일반 홈 화면으로 이동</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-['Public_Sans'] text-[14px] text-[#64748b] transition-colors hover:bg-gray-100 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems: AdminMenuItem[] = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "운영 센터", section: "실시간 운영" },
    { path: "/admin/buses", icon: Bus, label: "운행 관리", section: "실시간 운영" },
    { path: "/admin/routes", icon: Route, label: "노선·시간표", section: "콘텐츠 관리" },
    { path: "/admin/notices", icon: FileText, label: "공지·알림", section: "콘텐츠 관리" },
    { path: "/admin/support", icon: CircleHelp, label: "문의·장애", section: "사용자 대응" },
    { path: "/admin/users", icon: Users, label: "사용자", section: "사용자 대응" },
    { path: "/admin/demo", icon: MonitorPlay, label: "프로토타입 도구", section: "학술제" },
  ];
  const currentItem = menuItems.find((item) => item.path === location.pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-gray-50 md:flex-row">
      <header className="z-30 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#1e3b8a] font-bold text-white">U</span>
          <div className="min-w-0">
            <p className="font-['Public_Sans'] text-[10px] font-bold text-[#1e3b8a]">UNIBUS 관리자</p>
            <p className="truncate font-['Public_Sans'] text-[16px] font-bold text-[#0f172a]">{currentItem?.label ?? "관리자"}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="관리자 메뉴 열기"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-gray-200 text-[#0f172a]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <SidebarContent
          menuItems={menuItems}
          currentPath={location.pathname}
          onNavigate={navigate}
          onGoToUserPage={() => navigate("/home")}
          onLogout={handleLogout}
        />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="관리자 메뉴 닫기"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <aside className="absolute bottom-0 left-0 top-0 flex w-[min(84vw,320px)] flex-col bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <SidebarContent
              menuItems={menuItems}
              currentPath={location.pathname}
              onNavigate={navigate}
              onGoToUserPage={() => navigate("/home")}
              onLogout={handleLogout}
              onClose={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <main className="min-w-0 flex-1 overflow-auto overscroll-contain">
        <div className="admin-page min-h-full">{children}</div>
      </main>
    </div>
  );
}
