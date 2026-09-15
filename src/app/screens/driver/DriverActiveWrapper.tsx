import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../services/api";
import {
  getBusTypeLabel,
  getRouteDirectionLabel,
  getRouteKindLabel,
  getRouteSchedulePreview,
  type DriverRoute,
  type DriverActiveTrip,
} from "../../utils/driverRouteDisplay";
import { parseDurationMinutes, simulateCommuterBus } from "../../utils/commuterSimulation";

interface ActiveBus {
  id: string;
  name: string;
  type?: string;
  capacity?: number;
  currentRoute?: DriverRoute | null;
  activeTrip?: DriverActiveTrip | null;
}

export default function DriverActiveWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bus, setBus] = useState<ActiveBus | null>(location.state?.bus || null);

  const [gpsStatus, setGpsStatus] = useState<"acquiring" | "active" | "error">("acquiring");
  const [coords, setCoords] = useState<{ lat: number; lng: number; speed: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);
  const [sendCount, setSendCount] = useState(0);
  const [progressUpdating, setProgressUpdating] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [phaseUpdating, setPhaseUpdating] = useState(false);
  const [demoGps, setDemoGps] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoGpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCoordsRef = useRef<{ lat: number; lng: number; speed: number; heading: number } | null>(null);
  const prevLatLngRef = useRef<{ lat: number; lng: number } | null>(null);
  const nearStopRef = useRef<{ key: string; count: number; triggered: boolean } | null>(null);

  // 버스 없이 접근 시 홈으로
  useEffect(() => {
    if (bus) return;
    let mounted = true;

    api.getDriverStatus()
      .then(({ activeBus }) => {
        if (!mounted) return;
        if (activeBus) {
          setBus(activeBus);
        } else {
          navigate("/driver", { replace: true });
        }
      })
      .catch(() => {
        if (mounted) navigate("/driver", { replace: true });
      });

    return () => {
      mounted = false;
    };
  }, [bus, navigate]);

  useEffect(() => {
    const startedAt = bus?.activeTrip?.startedAt;
    if (!startedAt) return;
    const startedAtMs = new Date(startedAt).getTime();
    if (Number.isFinite(startedAtMs)) {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    }
  }, [bus?.activeTrip?.startedAt]);

  // 실제 운행은 기기 GPS를 사용하고, 시연 모드에서는 배정 노선 위 좌표를 생성한다.
  useEffect(() => {
    if (!bus) return;
    let cancelled = false;

    if (demoGps) {
      const routePoints = [...(bus.currentRoute?.stops || [])]
        .filter((stop) => stop.lat != null && stop.lng != null)
        .sort((left, right) => left.order - right.order)
        .map((stop) => [Number(stop.lng), Number(stop.lat)] as [number, number]);
      const fallbackPath: [number, number][] = [
        [126.933816, 36.77276], [126.935383, 36.768228], [126.932505, 36.767905],
        [126.931303, 36.768856], [126.927978, 36.769014], [126.933816, 36.77276],
      ];
      const durationMinutes = bus.type === "campus" ? 12 : parseDurationMinutes(bus.currentRoute?.duration ?? undefined);
      const startDemoGps = async () => {
        let path = routePoints.length >= 2 ? routePoints : fallbackPath;
        if (bus.currentRoute?.id) {
          try {
            const result = await api.getRoutePath(bus.currentRoute.id);
            if (result.path.length >= 2) path = result.path;
          } catch {
            // 저장된 정류장 좌표를 대체 경로로 사용한다.
          }
        }
        if (cancelled) return;
        const updateDemoPosition = () => {
          const simulated = simulateCommuterBus(bus.currentRoute?.id || bus.id, path, Date.now(), durationMinutes);
          if (!simulated) return;
          const speed = bus.type === "campus" ? 7 : 17;
          const current = { ...simulated.position, speed, heading: simulated.heading };
          latestCoordsRef.current = current;
          setCoords(current);
          setGpsStatus("active");
        };
        updateDemoPosition();
        demoGpsTimerRef.current = setInterval(updateDemoPosition, 1000);
      };
      void startDemoGps();
    } else if (!navigator.geolocation) {
      setGpsStatus("error");
    } else {
      setGpsStatus("acquiring");
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          let heading = latestCoordsRef.current?.heading ?? 0;
          const prev = prevLatLngRef.current;
          if (prev) {
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dLng = toRad(longitude - prev.lng);
            const rlat1 = toRad(prev.lat);
            const rlat2 = toRad(latitude);
            const y = Math.sin(dLng) * Math.cos(rlat2);
            const x = Math.cos(rlat1) * Math.sin(rlat2) - Math.sin(rlat1) * Math.cos(rlat2) * Math.cos(dLng);
            heading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
          }
          prevLatLngRef.current = { lat: latitude, lng: longitude };
          const current = { lat: latitude, lng: longitude, speed: speed || 0, heading };
          latestCoordsRef.current = current;
          setCoords(current);
          setGpsStatus("active");
        },
        () => setGpsStatus("error"),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }

    // 5초마다 서버에 위치 전송
    intervalRef.current = setInterval(async () => {
      if (!latestCoordsRef.current) return;
      try {
        const { lat, lng, speed, heading } = latestCoordsRef.current;
        await api.driverSendLocation(lat, lng, speed, heading);
        setSendCount((n) => n + 1);
      } catch {
        // 전송 실패해도 계속 시도
      }
    }, 5000);

    // 경과 시간 타이머
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (demoGpsTimerRef.current) clearInterval(demoGpsTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      watchIdRef.current = null;
      demoGpsTimerRef.current = null;
    };
  }, [bus, demoGps]);

  const handleStop = async () => {
    setStopping(true);
    try {
      await api.driverStop();
    } catch {
      // 실패해도 화면은 이동
    } finally {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (demoGpsTimerRef.current) clearInterval(demoGpsTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      navigate("/driver", { replace: true });
    }
  };

  const handleStopProgress = useCallback(async (stopOrder: number) => {
    setProgressUpdating(true);
    setProgressError("");
    try {
      const activeTrip = await api.driverUpdateProgress(stopOrder);
      setBus((current) => current ? {
        ...current,
        currentRoute: activeTrip.currentRoute || current.currentRoute,
        activeTrip: {
          ...current.activeTrip,
          ...activeTrip,
          status: "active",
        } as DriverActiveTrip,
      } : current);
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : "정류장 진행 상태를 저장하지 못했습니다");
    } finally {
      setProgressUpdating(false);
    }
  }, []);

  const handleStationDeparture = async () => {
    setPhaseUpdating(true);
    setProgressError("");
    try {
      const activeTrip = await api.driverAdvancePhase();
      setBus((current) => current ? {
        ...current,
        activeTrip: { ...current.activeTrip, ...activeTrip, status: "active" } as DriverActiveTrip,
      } : current);
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : "신창역 출발 상태를 저장하지 못했습니다");
    } finally {
      setPhaseUpdating(false);
    }
  };

  useEffect(() => {
    if (!coords || !bus?.currentRoute || progressUpdating) return;
    if (["waiting_station", "return_to_parking"].includes(bus.activeTrip?.servicePhase || "")) return;
    const currentOrder = bus.activeTrip?.currentStopOrder ?? 0;
    const next = [...(bus.currentRoute.stops || [])]
      .sort((a, b) => a.order - b.order)
      .find((stop) => stop.order > currentOrder && stop.lat != null && stop.lng != null);
    if (!next || next.lat == null || next.lng == null) return;

    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    const latitudeDelta = toRadians(next.lat - coords.lat);
    const longitudeDelta = toRadians(next.lng - coords.lng);
    const a = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(toRadians(coords.lat)) * Math.cos(toRadians(next.lat)) * Math.sin(longitudeDelta / 2) ** 2;
    const distanceMeters = 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const key = `${bus.currentRoute.id}:${next.order}`;

    if (distanceMeters > 45) {
      nearStopRef.current = null;
      return;
    }

    const previous = nearStopRef.current;
    const current = previous?.key === key
      ? { ...previous, count: previous.count + 1 }
      : { key, count: 1, triggered: false };
    nearStopRef.current = current;
    if (current.count >= 2 && !current.triggered) {
      nearStopRef.current = { ...current, triggered: true };
      void handleStopProgress(next.order);
    }
  }, [bus, coords, handleStopProgress, progressUpdating]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!bus) return null;

  const routeKind = getRouteKindLabel(bus);
  const routeSchedule = getRouteSchedulePreview(bus.currentRoute);
  const routeColor = bus.currentRoute?.color || "#1e3b8a";
  const routeStops = [...(bus.currentRoute?.stops || [])].sort((a, b) => a.order - b.order);
  const currentStopOrder = bus.activeTrip?.currentStopOrder ?? 0;
  const nextStop = routeStops.find((stop) => stop.order > currentStopOrder) ?? null;
  const currentStop = routeStops.find((stop) => stop.order === currentStopOrder) ?? null;
  const routeLoops = bus.currentRoute?.shuttleVariant === "campus_loop"
    || bus.currentRoute?.shuttleVariant === "station_to_campus_loop";
  const servicePhase = bus.activeTrip?.servicePhase;
  const waitingAtStation = servicePhase === "waiting_station";
  const returningToParking = servicePhase === "return_to_parking";
  const formatPlannedTime = (value?: string | null) => value
    ? new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value))
    : null;

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex flex-col items-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col bg-white">

        {/* Header */}
        <div className="bg-[#1e3b8a] px-6 pt-14 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 bg-[#22c55e] text-white text-xs font-bold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              운행 중
            </span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">{bus.name}</h1>
          <p className="text-white/60 text-sm mt-1">{bus.id} · {getBusTypeLabel(bus)}</p>
        </div>

        {/* 운행 노선 */}
        <div className={`mx-5 mt-5 rounded-2xl p-5 border ${
          bus.currentRoute ? "bg-[#f8fafc] border-[#e2e8f0]" : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-black mb-1 ${
                bus.currentRoute ? "text-[#1e3b8a]" : "text-amber-700"
              }`}>
                {routeKind}
              </p>
              <p className={`text-lg font-black leading-6 truncate ${
                bus.currentRoute ? "text-[#0f172a]" : "text-amber-800"
              }`}>
                {bus.currentRoute?.name || "운행 노선이 지정되지 않았습니다"}
              </p>
              <p className={`text-xs leading-relaxed mt-2 ${
                bus.currentRoute ? "text-[#64748b]" : "text-amber-700"
              }`}>
                {bus.currentRoute
                  ? [getRouteDirectionLabel(bus.currentRoute), routeSchedule].filter(Boolean).join(" · ")
                  : "관리자 버스 관리에서 이 버스의 운행 노선을 지정해야 사용자 지도에서 정확히 분류됩니다."}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${routeColor}1A` }}
            >
              <span className="w-5 h-5 rounded-full" style={{ backgroundColor: bus.currentRoute ? routeColor : "#f59e0b" }} />
            </div>
          </div>
        </div>

        {waitingAtStation && (
          <div className="mx-5 mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-[11px] font-black uppercase text-blue-600">신창역 승강장 대기</p>
            <p className="mt-1 text-lg font-black text-[#0f172a]">
              열차 도착 후 학생 탑승을 확인해 주세요
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-[#64748b]">
              예정 출발 {formatPlannedTime(bus.activeTrip?.plannedDepartureAt) || "시간표 확인"} · 열차 도착 약 {bus.currentRoute?.boardingWaitMinutes ?? 5}분 뒤 출발
            </p>
            <button
              type="button"
              disabled={phaseUpdating}
              onClick={() => void handleStationDeparture()}
              className="mt-4 h-12 w-full rounded-xl bg-[#1e3b8a] text-sm font-black text-white disabled:opacity-60"
            >
              {phaseUpdating ? "저장 중..." : "학생 탑승 완료 · 후문으로 출발"}
            </button>
          </div>
        )}

        {returningToParking && (
          <div className="mx-5 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-[11px] font-black uppercase text-emerald-700">본 운행 완료</p>
            <p className="mt-1 text-lg font-black text-[#0f172a]">주차장 복귀 후 운행을 종료해 주세요</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-[#64748b]">
              승객 안내 노선은 완료되었으며, 아래 운행 종료 버튼을 누르면 원래 배정 노선으로 복원됩니다.
            </p>
          </div>
        )}

        {routeStops.length > 0 && !waitingAtStation && !returningToParking && (
          <div className="mx-5 mt-4 rounded-2xl border border-[#dbe4ef] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase text-[#64748b]">다음 정류장</p>
                <p className="mt-1 truncate text-xl font-black text-[#0f172a]">
                  {nextStop?.name || (bus.activeTrip?.oneLoopOnly ? "후문 복귀" : "이번 순환 완료")}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#64748b]">
                  {currentStop ? `${currentStop.name} 통과 · ` : "운행 시작 · "}
                  {Math.min(currentStopOrder, routeStops.length)}/{routeStops.length} 정류장
                </p>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef3ff] text-lg font-black text-[#1e3a8a]">
                {nextStop?.order ?? 1}
              </div>
            </div>

            {progressError ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{progressError}</p> : null}

            <button
              type="button"
              disabled={progressUpdating || (!nextStop && !routeLoops)}
              onClick={() => void handleStopProgress(nextStop?.order ?? 0)}
              className="mt-4 h-12 w-full rounded-xl bg-[#1e3a8a] text-sm font-black text-white transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {progressUpdating
                ? "저장 중..."
                  : nextStop
                  ? `${nextStop.name} 도착 처리`
                  : bus.activeTrip?.oneLoopOnly ? "후문 복귀 완료" : routeLoops ? "다음 순환 시작" : "모든 정류장 운행 완료"}
            </button>
          </div>
        )}

        {/* 경과 시간 */}
        <div className="mx-5 mt-4 bg-[#f8fafc] rounded-2xl p-5 flex items-center justify-between border border-[#e2e8f0]">
          <div>
            <p className="text-gray-400 text-xs font-medium mb-1">운행 경과 시간</p>
            <p className="text-[#0f172a] text-3xl font-black tracking-tight">{formatTime(elapsed)}</p>
          </div>
          <div className="bg-[#1e3b8a]/10 rounded-2xl w-14 h-14 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#1e3b8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* GPS 상태 */}
        <div className="mx-5 mt-4 flex flex-col gap-3">

          <div className={`rounded-2xl p-5 border flex items-center gap-4
            ${demoGps ? "bg-blue-50 border-blue-100"
              : gpsStatus === "active" ? "bg-green-50 border-green-100"
              : gpsStatus === "error" ? "bg-red-50 border-red-100"
              : "bg-amber-50 border-amber-100"}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
              ${demoGps ? "bg-blue-100"
                : gpsStatus === "active" ? "bg-green-100"
                : gpsStatus === "error" ? "bg-red-100"
                : "bg-amber-100"}`}
            >
              <svg className={`w-6 h-6
                ${demoGps ? "text-blue-600"
                  : gpsStatus === "active" ? "text-green-600"
                  : gpsStatus === "error" ? "text-red-500"
                  : "text-amber-500"}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className={`font-bold text-sm
                ${demoGps ? "text-blue-700"
                  : gpsStatus === "active" ? "text-green-700"
                  : gpsStatus === "error" ? "text-red-600"
                  : "text-amber-600"}`}
              >
                {demoGps ? "시연 위치 전송 중"
                  : gpsStatus === "active" ? "GPS 수신 중"
                  : gpsStatus === "error" ? "GPS 오류"
                  : "GPS 신호 잡는 중..."}
              </p>
              {coords && (
                <p className="text-gray-500 text-xs mt-0.5">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}
              {gpsStatus === "error" && !demoGps && (
                <p className="text-red-400 text-xs mt-0.5">위치 권한을 허용해 주세요</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              latestCoordsRef.current = null;
              prevLatLngRef.current = null;
              setCoords(null);
              setDemoGps((enabled) => !enabled);
            }}
            className={`h-12 w-full rounded-xl border text-sm font-black transition-colors ${
              demoGps
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-[#cbd5e1] bg-white text-[#334155]"
            }`}
          >
            {demoGps ? "실제 GPS로 전환" : "시연 위치 사용"}
          </button>

          {/* 전송 횟수 */}
          <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#1e3b8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="text-gray-500 text-sm">위치 전송 횟수</span>
            </div>
            <span className="font-black text-[#1e3b8a] text-lg">{sendCount}회</span>
          </div>

          {/* 속도 */}
          {coords && (
            <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1e3b8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-gray-500 text-sm">현재 속도</span>
              </div>
              <span className="font-black text-[#1e3b8a] text-lg">
                {(coords.speed * 3.6).toFixed(0)} km/h
              </span>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* 운행 종료 버튼 */}
        <div className="px-5 pb-12">
          <button
            onClick={handleStop}
            disabled={stopping}
            className="w-full py-5 rounded-2xl bg-red-500 text-white font-black text-lg shadow-lg shadow-red-200 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {stopping ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>운행 종료 중...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>운행 종료</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
