import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import {
  getBusTypeLabel,
  getRouteDirectionLabel,
  getRouteKindLabel,
  getRouteSchedulePreview,
  type DriverRoute,
  type DriverActiveTrip,
} from "../../utils/driverRouteDisplay";

interface Bus {
  id: string;
  name: string;
  type: string;
  capacity: number;
  is_running: boolean;
  current_driver_id: string | null;
  assigned_driver_id?: string | null;
  is_assigned_to_me?: boolean;
  is_shared?: boolean;
  currentRoute?: DriverRoute | null;
  activeTrip?: DriverActiveTrip | null;
}

export default function DriverHomeWrapper() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const data = await api.getDriverBuses();
      setBuses(data);
    } catch {
      setError("버스 목록을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  // 앱 재진입 시 이미 운행 중이면 운행 화면으로 복원
  useEffect(() => {
    api.getDriverStatus().then(({ activeBus }) => {
      if (activeBus) {
        navigate("/driver/active", { state: { bus: activeBus }, replace: true });
      }
    });
  }, [navigate]);

  const handleStart = async (bus: Bus) => {
    if (bus.is_running && bus.current_driver_id !== user?.id) return;
    setStarting(bus.id);
    setError("");
    try {
      const trip = await api.driverStart(bus.id);
      navigate("/driver/active", {
        state: {
          bus: {
            ...bus,
            activeTrip: {
              id: trip.tripId,
              routeId: bus.currentRoute?.id ?? null,
              status: "active",
              currentStopOrder: 0,
              startedAt: new Date().toISOString(),
            },
          },
        },
      });
    } catch (err: any) {
      setError(err.message || "운행 시작에 실패했습니다");
    } finally {
      setStarting(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const assignedCount = buses.filter((bus) => bus.is_assigned_to_me).length;
  const sharedCount = buses.filter((bus) => bus.is_shared).length;

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex flex-col items-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col bg-white">

        {/* Header */}
        <div className="bg-[#1e3b8a] px-6 pt-14 pb-8">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-white/70 text-xs font-medium tracking-wider uppercase">기사 전용</p>
              <h1 className="text-white text-2xl font-black tracking-tight mt-0.5">운행할 버스를 선택해 주세요</h1>
            </div>
            <div className="bg-white/10 rounded-full w-12 h-12 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-3">{user?.name} 기사님 · {user?.email}</p>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-6 flex flex-col gap-4">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {!loading && buses.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="text-indigo-500 text-[11px] font-black uppercase tracking-[0.5px]">내 배정</p>
                <p className="mt-1 text-indigo-900 text-2xl font-black">{assignedCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.5px]">공용 배차</p>
                <p className="mt-1 text-slate-900 text-2xl font-black">{sharedCount}</p>
              </div>
            </div>
          )}

          {!loading && buses.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-amber-900 text-sm font-bold">운행 시작 후 위치 권한을 허용해 주세요</p>
              <p className="mt-1 text-amber-700 text-xs leading-relaxed">
                위치 권한이 꺼져 있으면 사용자 화면에 실시간 버스 위치가 표시되지 않습니다.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3b8a] mx-auto" />
                <p className="mt-3 text-gray-400 text-sm">버스 목록 불러오는 중...</p>
              </div>
            </div>
          ) : buses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1e3b8a] shadow-sm">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 17H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v7a2 2 0 01-2 2h-3m-9 0h10M8 17v2m8-2v2M3 12h18" />
                  </svg>
                </div>
                <p className="text-gray-700 text-base font-black">운행 가능한 버스가 없습니다</p>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                  활성화된 공용 배차가 없거나 기사님에게 배정된 버스가 없습니다.
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  관리자에게 버스 활성화, 노선 배정, 기사 배정을 요청해 주세요.
                </p>
              </div>
            </div>
          ) : (
            buses.map((bus) => {
              const isMine = bus.current_driver_id === user?.id;
              const isOtherDriver = bus.is_running && !isMine;
              const typeLabel = getBusTypeLabel(bus);
              const routeKind = getRouteKindLabel(bus);
              const routeSchedule = getRouteSchedulePreview(bus.currentRoute);
              const routeColor = bus.currentRoute?.color || "#1e3b8a";

              return (
                <button
                  key={bus.id}
                  onClick={() => handleStart(bus)}
                  disabled={isOtherDriver || starting === bus.id}
                  className={`w-full rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98] text-left
                    ${isOtherDriver
                      ? "bg-gray-50 border border-gray-100 opacity-50 cursor-not-allowed"
                      : "bg-white border border-[#e2e8f0] shadow-sm hover:border-[#1e3b8a]/30 hover:shadow-md"
                    }`}
                >
                  {/* 버스 아이콘 */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                    ${isOtherDriver ? "bg-gray-100" : "bg-[#1e3b8a]/10"}`}
                  >
                    <svg className={`w-7 h-7 ${isOtherDriver ? "text-gray-400" : "text-[#1e3b8a]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v7a2 2 0 01-2 2h-3m-9 0h10M8 17v2m8-2v2M3 12h18" />
                    </svg>
                  </div>

                  {/* 버스 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-[#0f172a] text-lg leading-tight">{bus.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${bus.type === 'campus' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                      >
                        {typeLabel}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${bus.is_assigned_to_me ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {bus.is_assigned_to_me ? '내 배정' : '공용 배차'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">{bus.id} · 정원 {bus.capacity}명</p>
                    <div className={`mt-3 rounded-xl border px-3 py-2 ${
                      bus.currentRoute ? "border-[#e2e8f0] bg-[#f8fafc]" : "border-amber-200 bg-amber-50"
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: bus.currentRoute ? routeColor : "#f59e0b" }}
                        />
                        <span className={`text-[11px] font-black shrink-0 ${
                          bus.currentRoute ? "text-[#1e3b8a]" : "text-amber-700"
                        }`}>
                          {routeKind}
                        </span>
                        <span className={`text-[11px] font-semibold truncate ${
                          bus.currentRoute ? "text-[#0f172a]" : "text-amber-700"
                        }`}>
                          {bus.currentRoute?.name || "노선 미지정"}
                        </span>
                      </div>
                      <p className={`mt-1 text-[11px] leading-[16px] ${
                        bus.currentRoute ? "text-[#64748b]" : "text-amber-700"
                      }`}>
                        {bus.currentRoute
                          ? [getRouteDirectionLabel(bus.currentRoute), routeSchedule].filter(Boolean).join(" · ")
                          : "관리자 버스 관리에서 운행 노선을 배정하면 사용자 지도와 기사 화면이 함께 연동됩니다."}
                      </p>
                    </div>
                    {isOtherDriver && (
                      <p className="text-orange-500 text-xs font-semibold mt-1">다른 기사 운행 중</p>
                    )}
                  </div>

                  {/* 운행 시작 버튼 */}
                  {!isOtherDriver && (
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                      ${starting === bus.id ? "bg-gray-100" : "bg-[#1e3b8a]"}`}
                    >
                      {starting === bus.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Logout */}
        <div className="px-5 pb-10">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl border border-gray-200 text-gray-400 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            로그아웃
          </button>
        </div>

      </div>
    </div>
  );
}
