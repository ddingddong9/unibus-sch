import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Bell, Bus, FileText, Users, TrendingUp, Activity, RefreshCw } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";

interface DashboardStats {
  totalNotices: number;
  activeRoutes: number;
  totalRoutes: number;
  totalBuses: number;
  activeBuses: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notices, routes, buses, users] = await Promise.allSettled([
        api.getNotices(),
        api.getRoutes(),
        api.getBuses(),
        api.getUsers(),
      ]);

      const noticesData = notices.status === "fulfilled" ? notices.value : [];
      const routesData  = routes.status  === "fulfilled" ? routes.value  : [];
      const busesData   = buses.status   === "fulfilled" ? buses.value   : [];
      const usersData   = users.status   === "fulfilled" ? users.value   : [];

      setStats({
        totalNotices: noticesData.length,
        activeRoutes: routesData.filter((r: any) => r.isActive).length,
        totalRoutes:  routesData.length,
        totalBuses:   busesData.length,
        activeBuses:  busesData.filter((b: any) => b.status === "active").length,
        totalUsers:   usersData.length,
      });

      // 최근 공지 5개 (최신순)
      const sorted = [...noticesData].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentNotices(sorted.slice(0, 5));
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return "방금 전";
    if (mins  < 60) return `${mins}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const categoryColor: Record<string, string> = {
    general: "bg-blue-500",
    route:   "bg-green-500",
    system:  "bg-red-500",
    lost:    "bg-orange-500",
  };

  const categoryLabel: Record<string, string> = {
    general: "일반",
    route:   "노선",
    system:  "시스템",
    lost:    "분실물",
  };

  const statCards = stats ? [
    {
      label: "총 공지사항",
      value: stats.totalNotices.toLocaleString(),
      sub: "등록된 전체 공지",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      label: "활성 노선",
      value: stats.activeRoutes.toLocaleString(),
      sub: `전체 ${stats.totalRoutes}개 중`,
      icon: Bus,
      color: "bg-green-500",
    },
    {
      label: "등록된 버스",
      value: stats.totalBuses.toLocaleString(),
      sub: `운행중 ${stats.activeBuses}대`,
      icon: Bus,
      color: "bg-purple-500",
    },
    {
      label: "등록된 사용자",
      value: stats.totalUsers.toLocaleString(),
      sub: "전체 가입자 수",
      icon: Users,
      color: "bg-orange-500",
    },
  ] : [];

  const quickLinks = [
    { title: "공지사항 작성", path: "/admin/notices",       icon: FileText, color: "text-blue-600" },
    { title: "노선 추가",     path: "/admin/routes",        icon: Bus,      color: "text-green-600" },
    { title: "알림 보내기",   path: "/admin/notifications", icon: Bell,     color: "text-purple-600" },
    { title: "사용자 관리",   path: "/admin/users",         icon: Users,    color: "text-orange-600" },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">
              대시보드
            </h1>
            <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
              UNIBUS SCH 시스템 현황을 한눈에 확인하세요
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#cbd5e1] text-[#64748b] rounded-lg hover:bg-gray-50 transition-colors text-[14px] font-['Public_Sans'] font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {lastUpdated ? `${timeAgo(lastUpdated.toISOString())} 업데이트` : "새로고침"}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="h-9 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))
          ) : (
            statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-['Public_Sans'] text-[#64748b] text-[14px] mb-2">
                      {stat.label}
                    </p>
                    <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[36px] leading-none mb-1">
                      {stat.value}
                    </h3>
                    <span className="font-['Public_Sans'] text-[#94a3b8] text-[12px]">
                      {stat.sub}
                    </span>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center shrink-0`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))
          )}
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
                  <link.icon className="w-5 h-5 text-[#1e3b8a] group-hover:scale-110 transition-transform" />
                  <span className="font-['Public_Sans'] text-[#0f172a] text-[15px] font-medium">
                    {link.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Notices */}
          <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] flex items-center gap-2">
                <Activity className="w-5 h-5" />
                최근 공지사항
              </h2>
              <button
                onClick={() => navigate("/admin/notices")}
                className="text-[#1e3b8a] text-[13px] font-['Public_Sans'] font-semibold hover:underline"
              >
                전체보기
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3 py-3 border-b border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-gray-200 mt-2 shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#94a3b8]">
                <FileText className="w-10 h-10 mb-2 opacity-30" />
                <p className="font-['Public_Sans'] text-[14px]">등록된 공지사항이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentNotices.map((notice, index) => (
                  <div
                    key={notice.id || index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-3 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate("/admin/notices")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${categoryColor[notice.category] ?? "bg-gray-400"}`} />
                      <div>
                        <p className="font-['Public_Sans'] font-medium text-[#0f172a] text-[14px] line-clamp-1">
                          {notice.title}
                        </p>
                        <p className="font-['Public_Sans'] text-[#94a3b8] text-[12px]">
                          {categoryLabel[notice.category] ?? notice.category} · {notice.authorName}
                        </p>
                      </div>
                    </div>
                    <div className="font-['Public_Sans'] text-[#64748b] text-[12px] shrink-0 ml-4">
                      {timeAgo(notice.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[16px] mb-4">
              시스템 상태
            </h3>
            <div className="space-y-3">
              {[
                { label: "API 서버",    ok: !loading },
                { label: "데이터베이스", ok: stats !== null },
                { label: "Edge Function", ok: stats !== null },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">{item.label}</span>
                  <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                    loading ? "bg-yellow-100 text-yellow-700" :
                    item.ok  ? "bg-green-100 text-green-700" :
                               "bg-red-100 text-red-700"
                  }`}>
                    {loading ? "확인 중" : item.ok ? "정상" : "오류"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[16px] mb-4">
              데이터 요약
            </h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">캠퍼스 셔틀</span>
                  <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">
                    {/* routes가 없을 수도 있으니 stats 기준 */}
                    -
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">전체 노선</span>
                  <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">
                    {stats?.totalRoutes ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">등록 버스</span>
                  <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">
                    {stats?.totalBuses ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">총 공지</span>
                  <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">
                    {stats?.totalNotices ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">가입 사용자</span>
                  <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">
                    {stats?.totalUsers ?? "-"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
