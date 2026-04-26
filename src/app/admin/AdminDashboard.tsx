import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Bell, Bus, FileText, Users, Activity, RefreshCw, Plus, Trash2, Square, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";

// 학내 순환 정류장
const CAMPUS_STOPS = [
  { name: "후문",   lat: 36.772760, lng: 126.933816 },
  { name: "향3",   lat: 36.768228, lng: 126.935383 },
  { name: "향1",   lat: 36.767905, lng: 126.932505 },
  { name: "도서관", lat: 36.768856, lng: 126.931303 },
  { name: "정문",  lat: 36.769014, lng: 126.927978 },
];

// 직행버스 정류장 (예시)
const DIRECT_STOPS = [
  { name: "정문",       lat: 36.769014, lng: 126.927978 },
  { name: "SCH아트홀",  lat: 36.773500, lng: 126.922000 },
  { name: "천안터미널", lat: 36.806000, lng: 127.148000 },
];

function interpolate(from: { lat: number; lng: number }, to: { lat: number; lng: number }, steps: number) {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / steps;
    return { lat: from.lat + (to.lat - from.lat) * t, lng: from.lng + (to.lng - from.lng) * t };
  });
}

const STEPS_PER_SEGMENT = 15;
const FULL_ROUTE = CAMPUS_STOPS.flatMap((stop, i) => {
  if (i === CAMPUS_STOPS.length - 1) return [];
  return interpolate(stop, CAMPUS_STOPS[i + 1], STEPS_PER_SEGMENT);
});
const DIRECT_ROUTE = DIRECT_STOPS.flatMap((stop, i) => {
  if (i === DIRECT_STOPS.length - 1) return [];
  return interpolate(stop, DIRECT_STOPS[i + 1], 30);
});

interface DashboardStats {
  totalNotices: number;
  activeRoutes: number;
  totalRoutes: number;
  totalBuses: number;
  activeBuses: number;
  totalUsers: number;
}

type TabType = "dashboard" | "buses";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // 대시보드 state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 버스 관리 state
  const [buses, setBuses] = useState<any[]>([]);
  const [busesLoading, setBusesLoading] = useState(false);
  const [newBusForm, setNewBusForm] = useState({ name: "", type: "campus", licensePlate: "", capacity: "" });
  const [busFormError, setBusFormError] = useState("");
  const [busFormLoading, setBusFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [forceStopConfirm, setForceStopConfirm] = useState<string | null>(null);
  const [busActionLoading, setBusActionLoading] = useState<string | null>(null);

  // 테스트 시뮬레이션 state
  const [testBusType, setTestBusType] = useState<"campus" | "direct">("campus");
  const [testRunning, setTestRunning] = useState(false);
  const [testStep, setTestStep] = useState(0);
  const [testTotal, setTestTotal] = useState(0);
  const [testBusId, setTestBusId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string>("");
  const testIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testBusIdRef = useRef<string | null>(null);
  const testRouteRef = useRef<[number, number][]>([]);

  // ── 대시보드 데이터 ──
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

  // ── 버스 목록 ──
  const fetchBuses = async () => {
    setBusesLoading(true);
    try {
      const data = await api.getBuses();
      setBuses(data);
    } catch (e) {
      console.error("Bus fetch error:", e);
    } finally {
      setBusesLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === "buses") fetchBuses();
  }, [activeTab]);

  // 버스 탭에서 10초마다 자동 갱신
  useEffect(() => {
    if (activeTab !== "buses") return;
    const id = setInterval(fetchBuses, 10000);
    return () => clearInterval(id);
  }, [activeTab]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const secs  = Math.floor(diff / 1000);
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (secs  < 10)  return "방금 전";
    if (mins  < 1)   return `${secs}초 전`;
    if (mins  < 60)  return `${mins}분 전`;
    if (hours < 24)  return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const categoryColor: Record<string, string> = {
    general: "bg-blue-500", route: "bg-green-500", system: "bg-red-500", lost: "bg-orange-500",
  };
  const categoryLabel: Record<string, string> = {
    general: "일반", route: "노선", system: "시스템", lost: "분실물",
  };
  const busTypeLabel: Record<string, string> = {
    campus: "학내순환", direct: "직행", commute: "통학",
  };

  const statCards = stats ? [
    { label: "총 공지사항",  value: stats.totalNotices.toLocaleString(), sub: "등록된 전체 공지",           icon: FileText, color: "bg-[#1e3b8a]" },
    { label: "활성 노선",    value: stats.activeRoutes.toLocaleString(), sub: `전체 ${stats.totalRoutes}개 중`, icon: Bus,      color: "bg-[#1e3b8a]" },
    { label: "등록된 버스",  value: stats.totalBuses.toLocaleString(),   sub: `운행중 ${stats.activeBuses}대`,  icon: Bus,      color: "bg-[#1e3b8a]" },
    { label: "등록된 사용자", value: stats.totalUsers.toLocaleString(),  sub: "전체 가입자 수",               icon: Users,    color: "bg-[#1e3b8a]" },
  ] : [];

  // ── 테스트 시뮬레이션 ──
  const currentStops = testBusType === "campus" ? CAMPUS_STOPS : DIRECT_STOPS;

  const stopTestBus = async (busId: string | null, silent = false) => {
    if (testIntervalRef.current) clearInterval(testIntervalRef.current);
    testIntervalRef.current = null;
    setTestRunning(false);
    setTestStep(0);
    setTestBusId(null);
    testBusIdRef.current = null;
    if (!silent && busId) {
      try {
        await api.updateBus(busId, { status: "inactive" });
        setTestStatus("운행 완료 — 버스가 지도에서 사라졌습니다.");
        fetchBuses();
      } catch (_) {}
    }
  };

  const startTestBus = async () => {
    if (testRunning) return;
    setTestStatus("경로 및 버스 준비 중...");
    try {
      let routePath: [number, number][] = [];
      if (testBusType === "campus") {
        try {
          const { path } = await api.getCampusRoutePath();
          routePath = path;
        } catch (_) {}
        if (!routePath || routePath.length === 0) {
          routePath = FULL_ROUTE.map(p => [p.lng, p.lat]);
        }
      } else {
        routePath = DIRECT_ROUTE.map(p => [p.lng, p.lat]);
      }
      testRouteRef.current = routePath;
      setTestTotal(routePath.length);

      const busName = testBusType === "campus" ? "테스트-학내순환" : "테스트-직행버스";
      const allBuses = await api.getBuses();
      const existing = allBuses.find((b: any) => b.name === busName) ?? allBuses[0];

      let busId: string;
      if (existing) {
        busId = existing.id;
        await api.updateBus(busId, { status: "active" });
      } else {
        try {
          const bus = await api.createBus({ name: busName, type: testBusType });
          busId = bus.id;
          await api.updateBus(busId, { status: "active" });
        } catch (createErr: any) {
          setTestStatus(`버스 준비 실패: ${createErr.message}`);
          return;
        }
      }

      setTestBusId(busId);
      testBusIdRef.current = busId;
      setTestRunning(true);
      setTestStep(0);
      setTestStatus(`출발: ${currentStops[0].name} (경로 ${routePath.length}개 좌표)`);
      fetchBuses();

      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
      const STOP_RADIUS = 0.0004;
      const stops = testBusType === "campus" ? CAMPUS_STOPS : DIRECT_STOPS;

      const runLoop = async () => {
        const route = testRouteRef.current;
        for (let step = 0; step < route.length; step++) {
          if (!testBusIdRef.current) break;
          const [lng, lat] = route[step];
          try { await api.updateBusLocation(testBusIdRef.current!, { lat, lng, speed: 15 }); } catch (_) {}
          setTestStep(step + 1);
          const atStop = stops.find(
            s => Math.abs(s.lat - lat) < STOP_RADIUS && Math.abs(s.lng - lng) < STOP_RADIUS
          );
          if (atStop) {
            setTestStatus(`${atStop.name} 정류장 정차 중...`);
            await sleep(5000);
          } else {
            const progress = step / route.length;
            const stopIdx = Math.min(Math.floor(progress * (stops.length - 1)), stops.length - 2);
            setTestStatus(`→ ${stops[stopIdx + 1]?.name} 이동 중...`);
            await sleep(2000);
          }
        }
        await stopTestBus(testBusIdRef.current);
        setTestStatus("운행 완료 — 버스가 지도에서 사라졌습니다.");
      };
      runLoop();
    } catch (e: any) {
      setTestStatus(`오류: ${e.message}`);
      setTestRunning(false);
    }
  };

  // ── 버스 CRUD ──
  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusForm.name.trim()) { setBusFormError("버스 이름을 입력해주세요."); return; }
    setBusFormError("");
    setBusFormLoading(true);
    try {
      await api.createBus({
        name: newBusForm.name.trim(),
        type: newBusForm.type,
        licensePlate: newBusForm.licensePlate.trim() || undefined,
        capacity: newBusForm.capacity ? parseInt(newBusForm.capacity) : undefined,
      });
      setNewBusForm({ name: "", type: "campus", licensePlate: "", capacity: "" });
      await fetchBuses();
      fetchData();
    } catch (err: any) {
      setBusFormError(err.message || "버스 등록에 실패했습니다.");
    } finally {
      setBusFormLoading(false);
    }
  };

  const handleDeleteBus = async (busId: string) => {
    setBusActionLoading(busId);
    try {
      await api.deleteBus(busId);
      setDeleteConfirm(null);
      await fetchBuses();
      fetchData();
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`);
    } finally {
      setBusActionLoading(null);
    }
  };

  const handleForceStop = async (busId: string) => {
    setBusActionLoading(busId);
    try {
      await api.updateBus(busId, { status: "inactive" });
      setForceStopConfirm(null);
      await fetchBuses();
    } catch (err: any) {
      alert(`강제 종료 실패: ${err.message}`);
    } finally {
      setBusActionLoading(null);
    }
  };

  const quickLinks = [
    { title: "공지사항 작성", path: "/admin/notices",       icon: FileText, color: "text-blue-600" },
    { title: "노선 추가",     path: "/admin/routes",        icon: Bus,      color: "text-green-600" },
    { title: "알림 보내기",   path: "/admin/notifications", icon: Bell,     color: "text-purple-600" },
    { title: "사용자 관리",   path: "/admin/users",         icon: Users,    color: "text-orange-600" },
  ];

  useEffect(() => {
    return () => { if (testIntervalRef.current) clearInterval(testIntervalRef.current); };
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">
              관리자 대시보드
            </h1>
            <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
              UNIBUS SCH 시스템을 관리합니다
            </p>
          </div>
          {activeTab === "dashboard" && (
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#cbd5e1] text-[#64748b] rounded-lg hover:bg-gray-50 transition-colors text-[14px] font-['Public_Sans'] font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdated ? `${timeAgo(lastUpdated.toISOString())} 업데이트` : "새로고침"}
            </button>
          )}
        </div>

        {/* Tab 네비게이션 */}
        <div className="flex gap-1 mb-8 border-b border-[#e2e8f0]">
          {(["dashboard", "buses"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 font-['Public_Sans'] font-semibold text-[14px] border-b-2 transition-all -mb-px ${
                activeTab === tab
                  ? "border-[#1e3b8a] text-[#1e3b8a]"
                  : "border-transparent text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              {tab === "dashboard" ? "대시보드" : "버스 관리"}
            </button>
          ))}
        </div>

        {/* ════════════════ 대시보드 탭 ════════════════ */}
        {activeTab === "dashboard" && (
          <>
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
          </>
        )}

        {/* ════════════════ 버스 관리 탭 ════════════════ */}
        {activeTab === "buses" && (
          <div className="space-y-6">

            {/* ① 실시간 버스 현황 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[18px]">실시간 버스 현황</h3>
                  <p className="font-['Public_Sans'] text-[#94a3b8] text-[13px] mt-0.5">10초마다 자동 갱신</p>
                </div>
                <button
                  onClick={fetchBuses}
                  disabled={busesLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-['Public_Sans'] text-[#64748b] border border-[#cbd5e1] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busesLoading ? "animate-spin" : ""}`} />
                  새로고침
                </button>
              </div>

              {busesLoading && buses.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : buses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[#94a3b8]">
                  <Bus className="w-10 h-10 mb-2 opacity-30" />
                  <p className="font-['Public_Sans'] text-[14px]">등록된 버스가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {buses.map((bus) => {
                    const isActive = bus.status === "active";
                    const lastPing = bus.lastLocationAt || bus.updatedAt;
                    return (
                      <div
                        key={bus.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isActive ? "border-[#1e3b8a]/20 bg-[#1e3b8a]/[0.03]" : "border-gray-100 bg-gray-50/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-[#1e3b8a]" : "bg-gray-200"}`}>
                          <Bus className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[15px] truncate">{bus.name}</span>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {isActive ? "운행중" : "미운행"}
                            </span>
                            {bus.type && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] bg-[#1e3b8a]/10 text-[#1e3b8a]">
                                {busTypeLabel[bus.type] ?? bus.type}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {bus.licensePlate && (
                              <span className="font-['Public_Sans'] text-[#94a3b8] text-[12px]">{bus.licensePlate}</span>
                            )}
                            {lastPing && (
                              <span className="font-['Public_Sans'] text-[#94a3b8] text-[12px] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(lastPing)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* 강제 운행 종료 */}
                          {isActive && (
                            forceStopConfirm === bus.id ? (
                              <div className="flex items-center gap-2">
                                <span className="font-['Public_Sans'] text-[12px] text-[#64748b]">종료할까요?</span>
                                <button
                                  onClick={() => handleForceStop(bus.id)}
                                  disabled={busActionLoading === bus.id}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[12px] font-['Public_Sans'] font-semibold hover:bg-red-700 disabled:opacity-50"
                                >
                                  {busActionLoading === bus.id ? "처리 중..." : "확인"}
                                </button>
                                <button
                                  onClick={() => setForceStopConfirm(null)}
                                  className="px-3 py-1.5 border border-gray-200 text-[#64748b] rounded-lg text-[12px] font-['Public_Sans']"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setForceStopConfirm(bus.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[12px] font-['Public_Sans'] font-semibold hover:bg-red-50 transition-colors"
                              >
                                <Square className="w-3.5 h-3.5" />
                                강제 종료
                              </button>
                            )
                          )}

                          {/* 삭제 */}
                          {deleteConfirm === bus.id ? (
                            <div className="flex items-center gap-2">
                              <span className="font-['Public_Sans'] text-[12px] text-[#64748b]">삭제할까요?</span>
                              <button
                                onClick={() => handleDeleteBus(bus.id)}
                                disabled={busActionLoading === bus.id}
                                className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-[12px] font-['Public_Sans'] font-semibold hover:bg-gray-900 disabled:opacity-50"
                              >
                                {busActionLoading === bus.id ? "삭제 중..." : "삭제"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 border border-gray-200 text-[#64748b] rounded-lg text-[12px] font-['Public_Sans']"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(bus.id)}
                              className="p-2 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ② 버스 등록 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[18px] mb-1">버스 등록</h3>
              <p className="font-['Public_Sans'] text-[#94a3b8] text-[13px] mb-5">
                새 버스를 시스템에 등록합니다. 등록 후 기사 앱에서 즉시 선택 가능합니다.
              </p>
              <form onSubmit={handleCreateBus} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block font-['Public_Sans'] text-[#64748b] text-[13px] mb-1.5">버스 이름 *</label>
                  <input
                    type="text"
                    value={newBusForm.name}
                    onChange={e => setNewBusForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="예: 학내순환 1호차"
                    className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[14px] text-[#0f172a] placeholder-[#cbd5e1] focus:outline-none focus:border-[#1e3b8a] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-['Public_Sans'] text-[#64748b] text-[13px] mb-1.5">운행 유형 *</label>
                  <select
                    value={newBusForm.type}
                    onChange={e => setNewBusForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[14px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] transition-colors bg-white"
                  >
                    <option value="campus">학내순환</option>
                    <option value="direct">직행버스</option>
                    <option value="commute">통학버스</option>
                  </select>
                </div>
                <div>
                  <label className="block font-['Public_Sans'] text-[#64748b] text-[13px] mb-1.5">차량 번호</label>
                  <input
                    type="text"
                    value={newBusForm.licensePlate}
                    onChange={e => setNewBusForm(f => ({ ...f, licensePlate: e.target.value }))}
                    placeholder="예: 충남 70 가 1234"
                    className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[14px] text-[#0f172a] placeholder-[#cbd5e1] focus:outline-none focus:border-[#1e3b8a] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-['Public_Sans'] text-[#64748b] text-[13px] mb-1.5">정원</label>
                  <input
                    type="number"
                    min="1"
                    value={newBusForm.capacity}
                    onChange={e => setNewBusForm(f => ({ ...f, capacity: e.target.value }))}
                    placeholder="예: 45"
                    className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[14px] text-[#0f172a] placeholder-[#cbd5e1] focus:outline-none focus:border-[#1e3b8a] transition-colors"
                  />
                </div>
                <div className="md:col-span-2 xl:col-span-4">
                  {busFormError && (
                    <div className="flex items-center gap-2 mb-3 text-red-600 font-['Public_Sans'] text-[13px]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {busFormError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={busFormLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3b8a] text-white rounded-lg font-['Public_Sans'] font-semibold text-[14px] hover:bg-[#1e3b8a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    {busFormLoading ? "등록 중..." : "버스 등록"}
                  </button>
                </div>
              </form>
            </div>

            {/* ③ 버스 테스트 시뮬레이션 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[18px] mb-1">버스 테스트 시뮬레이션</h3>
              <p className="font-['Public_Sans'] text-[#94a3b8] text-[13px] mb-5">
                가상 버스를 실제 경로로 이동시켜 지도 연동을 테스트합니다. 완료 후 자동으로 미운행 전환됩니다.
              </p>

              {/* 버스 유형 선택 */}
              <div className="flex gap-2 mb-5">
                {(["campus", "direct"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => !testRunning && setTestBusType(type)}
                    disabled={testRunning}
                    className={`px-4 py-2 rounded-lg font-['Public_Sans'] font-semibold text-[13px] border transition-all ${
                      testBusType === type
                        ? "bg-[#1e3b8a] text-white border-[#1e3b8a]"
                        : "bg-white text-[#64748b] border-[#cbd5e1] hover:border-[#1e3b8a] hover:text-[#1e3b8a]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {type === "campus" ? "학내순환" : "직행버스"}
                  </button>
                ))}
              </div>

              {/* 정류장 순서 */}
              <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
                {currentStops.map((stop, i) => {
                  const segStart = i * STEPS_PER_SEGMENT;
                  const passed  = testStep > segStart;
                  const current = testRunning && testStep >= segStart && testStep < (i + 1) * STEPS_PER_SEGMENT;
                  return (
                    <div key={stop.name} className="flex items-center gap-2 shrink-0">
                      <div className={`px-3 py-1.5 rounded-lg text-[12px] font-['Public_Sans'] font-semibold border transition-all ${
                        current ? "bg-[#1e3b8a] text-white border-[#1e3b8a]" :
                        passed  ? "bg-[#1e3b8a]/10 text-[#1e3b8a] border-[#1e3b8a]/20" :
                                  "bg-[#f1f5f9] text-[#94a3b8] border-transparent"
                      }`}>
                        {stop.name}
                      </div>
                      {i < currentStops.length - 1 && (
                        <svg className={`w-4 h-4 shrink-0 ${passed ? "text-[#1e3b8a]" : "text-[#cbd5e1]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 진행 바 */}
              <div className="mb-4">
                <div className="flex justify-between text-[12px] font-['Public_Sans'] text-[#64748b] mb-1">
                  <span>진행률</span>
                  <span>{testRunning && testTotal > 0 ? `${Math.round((testStep / testTotal) * 100)}%` : "—"}</span>
                </div>
                <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1e3b8a] rounded-full transition-all duration-500"
                    style={{ width: testTotal > 0 ? `${(testStep / testTotal) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              {/* 상태 메시지 */}
              {testStatus && (
                <div className="flex items-center gap-2 mb-4">
                  {testRunning
                    ? <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    : <CheckCircle2 className="w-4 h-4 text-[#94a3b8] shrink-0" />
                  }
                  <p className="font-['Public_Sans'] text-[#64748b] text-[13px]">{testStatus}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={startTestBus}
                  disabled={testRunning}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3b8a] text-white rounded-lg font-['Public_Sans'] font-semibold text-[14px] hover:bg-[#1e3b8a]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Bus className="w-4 h-4" />
                  {testRunning ? "운행 중..." : "테스트 시작"}
                </button>
                {testRunning && (
                  <button
                    onClick={() => stopTestBus(testBusId)}
                    className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 rounded-lg font-['Public_Sans'] font-semibold text-[14px] hover:bg-red-50 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    강제 중지
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}
