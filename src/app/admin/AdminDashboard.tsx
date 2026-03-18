import { useNavigate } from "react-router";
import { Bell, Bus, FileText, Users, TrendingUp, Activity } from "lucide-react";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: "총 공지사항", value: "24", change: "+3", icon: FileText, color: "bg-blue-500" },
    { label: "활성 노선", value: "8", change: "+1", icon: Bus, color: "bg-green-500" },
    { label: "오늘 발송 알림", value: "156", change: "+28", icon: Bell, color: "bg-purple-500" },
    { label: "등록된 사용자", value: "3,482", change: "+124", icon: Users, color: "bg-orange-500" },
  ];

  const recentActivities = [
    { action: "새 공지사항 작성", time: "2분 전", user: "관리자", type: "공지" },
    { action: "캠퍼스 셔틀 시간표 수정", time: "15분 전", user: "관리자", type: "노선" },
    { action: "긴급 알림 전송", time: "1시간 전", user: "관리자", type: "알림" },
    { action: "통근버스 노선 추가", time: "3시간 전", user: "관리자", type: "노선" },
    { action: "이벤트 공지 게시", time: "5시간 전", user: "관리자", type: "공지" },
  ];

  const quickLinks = [
    { title: "공지사항 작성", path: "/admin/notices", icon: FileText, color: "text-blue-600" },
    { title: "노선 추가", path: "/admin/routes", icon: Bus, color: "text-green-600" },
    { title: "알림 보내기", path: "/admin/notifications", icon: Bell, color: "text-purple-600" },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">
            대시보드
          </h1>
          <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
            UNIBUS SCH 시스템 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-['Public_Sans'] text-[#64748b] text-[14px] mb-2">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[36px]">
                      {stat.value}
                    </h3>
                    <span className="font-['Public_Sans'] text-green-600 text-[14px] font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="bg-[#1e3b8a] w-12 h-12 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Quick Links */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">
              빠른 작업
            </h2>
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#1e3b8a] hover:bg-[#1e3b8a]/5 transition-all group"
                >
                  <div className={`${link.color} group-hover:scale-110 transition-transform`}>
                    <link.icon className="w-5 h-5 text-[#1e3b8a]" />
                  </div>
                  <span className="font-['Public_Sans'] text-[#0f172a] text-[15px] font-medium">
                    {link.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] flex items-center gap-2">
                <Activity className="w-5 h-5" />
                최근 활동
              </h2>
            </div>
            <div className="space-y-1">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-3 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === "공지" ? "bg-blue-500" :
                      activity.type === "노선" ? "bg-green-500" :
                      "bg-purple-500"
                    }`} />
                    <div>
                      <p className="font-['Public_Sans'] font-medium text-[#0f172a] text-[15px]">
                        {activity.action}
                      </p>
                      <p className="font-['Public_Sans'] text-[#94a3b8] text-[13px]">
                        {activity.user}
                      </p>
                    </div>
                  </div>
                  <div className="font-['Public_Sans'] text-[#64748b] text-[13px]">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[16px] mb-4">
              시스템 상태
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">서버 상태</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[12px] font-medium">정상</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">데이터베이스</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[12px] font-medium">정상</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">알림 서비스</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[12px] font-medium">정상</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[16px] mb-4">
              이번 주 통계
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">새 공지사항</span>
                <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">노선 수정</span>
                <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">발송 알림</span>
                <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">843</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[16px] mb-4">
              사용자 현황
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">오늘 접속</span>
                <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">1,245</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">이번 주 신규</span>
                <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">124</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">활성 사용자</span>
                <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">2,856</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}