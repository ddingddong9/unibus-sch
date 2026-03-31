import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Bus, Bell, LogOut, Users } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      navigate("/admin/login");
    }
  };

  const menuItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "대시보드" },
    { path: "/admin/notices", icon: FileText, label: "공지사항 관리" },
    { path: "/admin/routes", icon: Bus, label: "버스 노선 관리" },
    { path: "/admin/notifications", icon: Bell, label: "알림 전송" },
    { path: "/admin/users", icon: Users, label: "사용자 관리" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1e3b8a] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px]">UNIBUS SCH</h1>
              <p className="font-['Public_Sans'] text-[#64748b] text-[11px]">관리자 대시보드</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-['Public_Sans'] text-[14px] transition-colors ${
                      isActive
                        ? "bg-[#1e3b8a] text-white font-semibold"
                        : "text-[#64748b] hover:bg-gray-100 hover:text-[#0f172a]"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-['Public_Sans'] text-[14px] text-[#64748b] hover:bg-gray-100 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
