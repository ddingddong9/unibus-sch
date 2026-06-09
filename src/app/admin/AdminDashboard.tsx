import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Bell, Bus, FileText, Users, Activity, RefreshCw, Play, Square } from "lucide-react";
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

// 데모 시뮬레이션용 경로 — 중간점 보간으로 매끄러운 이동
function interpolateRoute(waypoints: { lat: number; lng: number }[], steps = 8) {
  const result: { lat: number; lng: number }[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i], to = waypoints[i + 1];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      result.push({ lat: from.lat + (to.lat - from.lat) * t, lng: from.lng + (to.lng - from.lng) * t });
    }
  }
  result.push(waypoints[waypoints.length - 1]);
  return result;
}

const CAMPUS_ROUTE = interpolateRoute([
  { lat: 36.772760, lng: 126.933816 },
  { lat: 36.768228, lng: 126.935383 },
  { lat: 36.767905, lng: 126.932505 },
  { lat: 36.768856, lng: 126.931303 },
  { lat: 36.769014, lng: 126.927978 },
], 6);

const SEOUL_ROUTE = interpolateRoute([
  { lat: 36.769014, lng: 126.927978 },
  { lat: 36.800000, lng: 127.073000 },
  { lat: 37.145000, lng: 127.065000 },
  { lat: 37.263000, lng: 127.029000 },
  { lat: 37.361000, lng: 126.935000 },
  { lat: 37.430000, lng: 126.896000 },
  { lat: 37.497000, lng: 127.047000 },
], 10);

const INCHEON_ROUTE = interpolateRoute([
  { lat: 36.769014, lng: 126.927978 },
  { lat: 36.808000, lng: 127.073000 },
  { lat: 37.120000, lng: 126.900000 },
  { lat: 37.320000, lng: 126.831000 },
  { lat: 37.499000, lng: 126.789000 },
  { lat: 37.456000, lng: 126.705000 },
], 10);

function calcBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const rlat1 = toRad(from.lat), rlat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(rlat2);
  const x = Math.cos(rlat1) * Math.sin(rlat2) - Math.sin(rlat1) * Math.cos(rlat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

interface SimBus {
  busId: string;
  name: string;
  type: "campus" | "commuter";
  route: { lat: number; lng: number }[];
  label: string;
  idx: number;
  dir: 1 | -1;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [simRunning, setSimRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simBusesRef = useRef<SimBus[]>([]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
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

      setAllBuses(busesData);
      setStats({
        totalNotices: noticesData.length,
        activeRoutes: routesData.filter((r: any) => r.isActive).length,
        totalRoutes:  routesData.length,
        totalBuses:   busesData.length,
        activeBuses:  busesData.filter((b: any) => b.status === "active").length,
        totalUsers:   usersData.length,
      });

      const sorted = [...noticesData].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentNotices(sorted.slice(0, 5));
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const buildSimBuses = (buses: any[]): SimBus[] => {
    const campusBuses = buses.filter((b) => b.type === "campus");
    const commuterBuses = buses.filter((b) => b.type === "commuter");
    const result: SimBus[] = [];

    campusBuses.forEach((b, i) => {
      const startIdx = Math.floor((CAMPUS_ROUTE.length / Math.max(campusBuses.length, 1)) * i);
      result.push({ busId: b.id, name: b.name, type: "campus", route: CAMPUS_ROUTE, label: "캠퍼스 순환", idx: startIdx, dir: 1 });
    });

    commuterBuses.forEach((b, i) => {
      const route = i % 2 === 0 ? SEOUL_ROUTE : INCHEON_ROUTE;
      const label = i % 2 === 0 ? "서울행" : "인천행";
      result.push({ busId: b.id, name: b.name, type: "commuter", route, label, idx: 0, dir: 1 });
    });

    return result;
  };

  const startSimulation = async () => {
    const simBuses = buildSimBuses(allBuses);
    if (simBuses.length === 0) return;

    simBusesRef.current = simBuses;
    await Promise.allSettled(simBuses.map((b) => api.updateBus(b.busId, { status: "active" })));
    setSimRunning(true);

    simIntervalRef.current = setInterval(async () => {
      const updated = simBusesRef.current.map((b) => {
        let next = b.idx + b.dir;
        let dir = b.dir;
        if (b.type === "campus") {
          if (next >= b.route.length) next = 0;
        } else {
          if (next >= b.route.length) { next = b.route.length - 2; dir = -1; }
          else if (next < 0) { next = 1; dir = 1; }
        }
        return { ...b, idx: next, dir };
      });
      simBusesRef.current = updated;

      await Promise.allSettled(
        updated.map((b) => {
          const pos = b.route[b.idx];
          const nextPos = b.route[(b.idx + 1) % b.route.length] ?? pos;
          const heading = calcBearing(pos, nextPos);
          return api.updateBusLocation(b.busId, { lat: pos.lat, lng: pos.lng, speed: 40, heading });
        })
      );
    }, 2000);
  };

  const stopSimulation = async () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    await Promise.allSettled(simBusesRef.current.map((b) => api.updateBus(b.busId, { status: "inactive" })));
    simBusesRef.current = [];
    setSimRunning(false);
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(true), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

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
    { label: "총 공지사항",  value: stats.totalNotices.toLocaleString(), sub: "등록된 전체 공지",           icon: FileText, color: "bg-[#1e3b8a]" },
    { label: "활성 노선",    value: stats.activeRoutes.toLocaleString(), sub: `전체 ${stats.totalRoutes}개 중`, icon: Bus,      color: "bg-[#1e3b8a]" },
    { label: "등록된 버스",  value: stats.totalBuses.toLocaleString(),   sub: `운행중 ${stats.activeBuses}대`,  icon: Bus,      color: "bg-[#1e3b8a]" },
    { label: "등록된 사용자", value: stats.totalUsers.toLocaleString(),  sub: "전체 가입자 수",               icon: Users,    color: "bg-[#1e3b8a]" },
  ] : [];

  const quickLinks = [
    { title: "공지사항 작성", path: "/admin/notices",       icon: FileText },
    { title: "노선 추가",     path: "/admin/routes",        icon: Bus },
    { title: "버스 관리",     path: "/admin/buses",         icon: Bus },
    { title: "알림 보내기",   path: "/admin/notifications", icon: Bell },
    { title: "사용자 관리",   path: "/admin/users",         icon: Users },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">대시보드</h1>
            <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">UNIBUS SCH 시스템 현황을 한눈에 확인하세요</p>
          </div>
          <button
            onClick={() => fetchData()}
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
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-['Public_Sans'] text-[#64748b] text-[14px] mb-2">{stat.label}</p>
                    <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[36px] leading-none mb-1">{stat.value}</h3>
                    <span className="font-['Public_Sans'] text-[#94a3b8] text-[12px]">{stat.sub}</span>
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
            <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">빠른 작업</h2>
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#1e3b8a] hover:bg-[#1e3b8a]/5 transition-all group"
                >
                  <link.icon className="w-5 h-5 text-[#1e3b8a] group-hover:scale-110 transition-transform" />
                  <span className="font-['Public_Sans'] text-[#0f172a] text-[15px] font-medium">{link.title}</span>
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
              <button onClick={() => navigate("/admin/notices")} className="text-[#1e3b8a] text-[13px] font-['Public_Sans'] font-semibold hover:underline">
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
                        <p className="font-['Public_Sans'] font-medium text-[#0f172a] text-[14px] line-clamp-1">{notice.title}</p>
                        <p className="font-['Public_Sans'] text-[#94a3b8] text-[12px]">
                          {categoryLabel[notice.category] ?? notice.category} · {notice.authorName}
                        </p>
                      </div>
                    </div>
                    <div className="font-['Public_Sans'] text-[#64748b] text-[12px] shrink-0 ml-4">{timeAgo(notice.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[16px] mb-4">시스템 상태</h3>
            <div className="space-y-3">
              {[
                { label: "API 서버",      ok: !loading },
                { label: "데이터베이스",   ok: stats !== null },
                { label: "Edge Function", ok: stats !== null },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">{item.label}</span>
                  <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                    loading ? "bg-yellow-100 text-yellow-700" :
                    item.ok  ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {loading ? "확인 중" : item.ok ? "정상" : "오류"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[16px] mb-4">데이터 요약</h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "전체 노선",  value: stats?.totalRoutes  ?? "-" },
                  { label: "등록 버스",  value: stats?.totalBuses   ?? "-" },
                  { label: "총 공지",    value: stats?.totalNotices ?? "-" },
                  { label: "가입 사용자", value: stats?.totalUsers  ?? "-" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="font-['Public_Sans'] text-[#64748b] text-[14px]">{row.label}</span>
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[16px] font-bold">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 데모 시뮬레이션 패널 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px]">데모 시뮬레이션</h2>
              <p className="font-['Public_Sans'] text-[#64748b] text-[13px] mt-0.5">학술제용 가상 다중 버스 운행 시뮬레이션</p>
            </div>
            <button
              onClick={simRunning ? stopSimulation : startSimulation}
              disabled={allBuses.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-['Public_Sans'] font-bold text-[14px] transition-all disabled:opacity-40 ${
                simRunning
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
                  : "bg-[#1e3b8a] hover:bg-[#1e3b8a]/90 text-white shadow-lg shadow-blue-200"
              }`}
            >
              {simRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {simRunning ? "시뮬레이션 종료" : "시뮬레이션 시작"}
            </button>
          </div>

          {allBuses.length === 0 ? (
            <div className="p-6 text-center text-[#94a3b8] font-['Public_Sans'] text-[14px]">
              등록된 버스가 없습니다. 먼저 버스를 등록해 주세요.
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {buildSimBuses(allBuses).map((b) => (
                <div
                  key={b.busId}
                  className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${
                    simRunning ? "border-[#1e3b8a]/30 bg-[#1e3b8a]/5" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${simRunning ? "bg-[#1e3b8a]" : "bg-gray-200"}`}>
                    <Bus className={`w-5 h-5 ${simRunning ? "text-white" : "text-gray-500"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[13px] truncate">{b.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {simRunning && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />}
                      <span className="font-['Public_Sans'] text-[#64748b] text-[12px]">{b.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
