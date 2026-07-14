import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../imports/svg-odbnwpa57u";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { simulateCampusLoop } from "../utils/campusLoopSimulation";
import { estimateStopArrivals } from "../utils/shuttleEta";

interface HomeStop {
  id: string;
  nameKo: string;
  lat: number;
  lng: number;
  order: number;
}

interface HomeBus {
  id: string;
  label: string;
  position: { lat: number; lng: number };
  speed: number;
  timestamp: string;
}

// 학내 순환 정류장 목록
const CAMPUS_STOPS = [
  { id: "rear-gate", nameKo: "후문",   lat: 36.772760, lng: 126.933816, order: 1 },
  { id: "hyang3",    nameKo: "향3",    lat: 36.768228, lng: 126.935383, order: 2 },
  { id: "hyang1",    nameKo: "향1",    lat: 36.767905, lng: 126.932505, order: 3 },
  { id: "library",   nameKo: "도서관", lat: 36.768856, lng: 126.930700, order: 4 },
  { id: "main-gate", nameKo: "정문",   lat: 36.769014, lng: 126.927978, order: 5 },
] satisfies HomeStop[];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatRouteStops(stops: any[]): HomeStop[] {
  return stops
    .filter((stop) => Number.isFinite(Number(stop.lat)) && Number.isFinite(Number(stop.lng)))
    .map((stop, index) => ({
      id: stop.id || `stop-${index + 1}`,
      nameKo: stop.name || `정류장 ${index + 1}`,
      lat: Number(stop.lat),
      lng: Number(stop.lng),
      order: Number(stop.order) || index + 1,
    }));
}

export default function HomeWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeBuses, setActiveBuses] = useState<HomeBus[]>([]);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [campusStops, setCampusStops] = useState<HomeStop[]>(CAMPUS_STOPS);
  const [clockTick, setClockTick] = useState(() => Date.now());

  // 사용자 GPS 위치 → 가장 가까운 정류장 계산
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("ready");
      },
      () => setLocationStatus("unavailable"),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 5_000 },
    );
  }, []);

  useEffect(() => {
    api.getCampusRoutePath()
      .then((routeDetail) => {
        setRoutePath(routeDetail.path || []);
        const savedStops = formatRouteStops(routeDetail.stops || []);
        if (savedStops.length > 0) setCampusStops(savedStops);
      })
      .catch((error) => console.warn("홈 노선 정보 불러오기 실패:", error));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  // 활성 버스 위치 fetch
  const fetchBuses = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [allBuses, locations] = await Promise.all([
        api.getBuses(),
        api.getBusLocations(),
      ]);
      const activeById = new Map(
        allBuses
          .filter((bus: any) => bus.type === "campus" && bus.status === "active" && bus.isRunning)
          .map((bus: any) => [bus.id, bus]),
      );
      const buses = locations
        .filter((location: any) => {
          if (!activeById.has(location.busId)) return false;
          const updatedAt = new Date(location.timestamp).getTime();
          return Number.isFinite(updatedAt) && Date.now() - updatedAt <= 45_000;
        })
        .map((location: any) => ({
          id: location.busId,
          label: activeById.get(location.busId)?.name || "학내순환",
          position: { lat: Number(location.lat), lng: Number(location.lng) },
          speed: Number(location.speed) || 0,
          timestamp: location.timestamp,
        }));
      setActiveBuses(buses);
    } catch {
      // 실패 시 유지
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 30000);
    return () => clearInterval(interval);
  }, [fetchBuses]);

  const nearestStop = useMemo(() => {
    if (!userLocation || campusStops.length === 0) return null;
    return campusStops.reduce((nearest, stop) => (
      haversineKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng)
        < haversineKm(userLocation.lat, userLocation.lng, nearest.lat, nearest.lng) ? stop : nearest
    ));
  }, [campusStops, userLocation]);
  const nearestStopLabel = nearestStop?.nameKo
    ?? (locationStatus === "checking" ? t("위치 확인 중", "Locating...") : t("위치 권한 필요", "Location unavailable"));
  const simulation = useMemo(
    () => simulateCampusLoop(
      routePath,
      campusStops.map((stop) => ({
        id: stop.id,
        name: stop.nameKo,
        lat: stop.lat,
        lng: stop.lng,
        order: stop.order,
      })),
      clockTick,
      10,
    ),
    [campusStops, clockTick, routePath],
  );
  const displayBuses = activeBuses.length > 0 ? activeBuses : simulation.buses;
  const targetStop = nearestStop ?? campusStops[0];
  const arrivalEstimates = useMemo(
    () => estimateStopArrivals(
      routePath,
      campusStops.map((stop) => ({ id: stop.id, order: stop.order, lat: stop.lat, lng: stop.lng })),
      displayBuses,
      { loop: true, fallbackSpeedMps: 6.2, nowMs: clockTick },
    ),
    [campusStops, clockTick, displayBuses, routePath],
  );
  const nextArrival = targetStop ? arrivalEstimates.get(targetStop.id)?.minutes ?? null : null;
  const busActive = displayBuses.length > 0;
  const miniMap = useMemo(() => {
    const source = routePath.length > 1
      ? routePath.filter((_, index) => index % Math.max(1, Math.ceil(routePath.length / 100)) === 0)
      : campusStops.map((stop) => [stop.lng, stop.lat] as [number, number]);
    const lastRoutePoint = routePath[routePath.length - 1];
    if (lastRoutePoint && source[source.length - 1] !== lastRoutePoint) source.push(lastRoutePoint);
    if (source.length === 0) return { path: "", stops: [], buses: [] };
    const lngs = source.map(([lng]) => lng);
    const lats = source.map(([, lat]) => lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const project = (lng: number, lat: number) => ({
      x: 16 + ((lng - minLng) / (maxLng - minLng || 1)) * 288,
      y: 12 + (1 - (lat - minLat) / (maxLat - minLat || 1)) * 76,
    });
    const routePoints = source.map(([lng, lat]) => project(lng, lat));
    return {
      path: routePoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" "),
      stops: campusStops.map((stop) => project(stop.lng, stop.lat)),
      buses: displayBuses.map((bus) => project(bus.position.lng, bus.position.lat)),
    };
  }, [campusStops, displayBuses, routePath]);

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-start relative size-full">
      <div className="bg-white content-stretch flex flex-col items-start overflow-y-auto scrollbar-hide pb-[120px] relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full" style={{ height: '100dvh' }}>

        {/* Header – sticky, no entrance animation */}
        <div className="sticky top-0 z-30 w-full pt-safe">
          <div className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] flex flex-row items-center w-full">
            <div className="content-stretch flex items-center justify-between pb-[12px] pt-[16px] px-[24px] relative w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0">
                <div className="flex flex-col font-['Public_Sans'] font-medium justify-center leading-[0] relative shrink-0 text-[#64748b] text-[12px] tracking-[0.6px] uppercase">
                  <p className="leading-[16px]"></p>
                </div>
                <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[24px]">
                  <p className="leading-[32px]">UNIBUS SCH</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/notice")}
                aria-label={t("공지사항 보기", "View notices")}
                className="bg-[#f1f5f9] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px] text-[#0f172a] hover:bg-[#e2e8f0] transition-colors active:scale-95"
              >
                <div className="h-[20px] relative shrink-0 w-[16px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                    <path d={svgPaths.p164b49c0} fill="currentColor" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────── */}
        <div
          key="home-content"
          className="w-full animate-[routeFade_180ms_ease-out]"
        >

              {/* Nearest Stop Card */}
              <div className="relative shrink-0 w-full animate-[routeLift_220ms_ease-out]">
                <div className="content-stretch flex flex-col items-start px-[24px] py-[16px] relative w-full">
                  <div
                    className="home-accent-gradient bg-[#1e3a8a] relative rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => navigate("/campus-shuttle")}
                  >
                    <div className="content-stretch flex flex-col items-start p-[24px] relative w-full">
                      <div className="home-accent-circle absolute bg-[rgba(255,255,255,0.1)] right-[-16px] rounded-[9999px] size-[128px] top-[-16px]" />
                      <div className="home-accent-circle absolute bg-[rgba(255,255,255,0.05)] bottom-[-32px] left-[-32px] rounded-[9999px] size-[128px]" />

                      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full z-10">
                        <div className="content-stretch flex gap-[8px] items-center opacity-90 relative shrink-0 w-full">
                          <div className="h-[11.667px] relative shrink-0 w-[9.333px]">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 11.6667">
                              <path d={svgPaths.p3d8f00c0} fill="white" />
                            </svg>
                          </div>
                          <div className="flex flex-col font-['Public_Sans'] font-medium justify-center leading-[0] text-[12px] text-white tracking-[1.2px] uppercase">
                            <p className="leading-[16px]">{t("가장 가까운 정류장", "Nearest Stop")}</p>
                          </div>
                        </div>

                        <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[20px] text-white w-full">
                          <p className="leading-[28px]">{nearestStopLabel}</p>
                        </div>

                        <div className="content-stretch flex items-end justify-between pt-[12px] relative shrink-0 w-full">
                          <div className="content-stretch flex flex-col items-start relative shrink-0">
                            <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[14px] text-white opacity-80">
                              <p className="leading-[20px]">{t("운행 현황", "Service Status")}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {isRefreshing && routePath.length === 0 ? (
                                <span className="font-['Public_Sans'] font-bold text-[16px] text-white/70">{t("확인 중...", "Checking...")}</span>
                              ) : busActive ? (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                                  <div className="flex items-baseline gap-1">
                                    <span className="font-['Public_Sans'] font-black text-[20px] text-white leading-[28px]">
                                      {nextArrival ? `${nextArrival}분` : t("운행 중", "In Service")}
                                    </span>
                                    {nextArrival && (
                                      <span className="font-['Public_Sans'] font-bold text-[14px] text-white/80">
                                        {t("후 도착", "to arrive")}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-white/40" />
                                  <span className="font-['Public_Sans'] font-black text-[20px] text-white/70 leading-[28px]">{t("운행 없음", "No Service")}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); navigate("/campus-shuttle"); }}
                            aria-label={t("셔틀버스 지도 보기", "View shuttle map")}
                            className="content-stretch flex items-center justify-center p-[4px] relative rounded-[9999px] shrink-0 size-[48px] border-4 border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.4)] transition-all active:scale-95"
                          >
                            <div className="h-[22.167px] relative shrink-0 w-[18.667px]">
                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 22.1667">
                                <path d={svgPaths.p5416200} fill="white" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions – stagger */}
              <div className="relative shrink-0 w-full animate-[routeLift_260ms_ease-out]">
                <div className="content-stretch flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full">
                  {[
                    {
                      path: "/campus-shuttle",
                      icon: svgPaths.p2d903e00,
                      viewBox: "0 0 25.6667 21",
                      title: t("셔틀버스", "Shuttle"),
                      sub: t("학내순환 · 신창역 셔틀", "Campus loop · Sinchang shuttle"),
                    },
                    {
                      path: "/commuter-bus",
                      icon: svgPaths.p285d3c40,
                      viewBox: "0 0 23.3333 18.6667",
                      title: t("통학버스", "Commuter Bus"),
                      sub: t("인천, 서울, 경기", "Incheon, Seoul, Gyeonggi"),
                    },
                    {
                      path: "/notice",
                      icon: svgPaths.p3106d480,
                      viewBox: "0 0 23.3333 18.6667",
                      title: t("공지사항", "Notice"),
                      sub: t("운행 변경 및 업데이트", "Schedule changes & updates"),
                      extra: "mb-[32px]",
                    },
                  ].map((action) => (
                    <button
                      key={action.path + action.title}
                      onClick={() => navigate(action.path)}
                      className={`bg-white content-stretch flex items-center justify-between p-[21px] relative rounded-[16px] shrink-0 w-full border border-[#e2e8f0] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-all active:scale-[0.98] ${action.extra ?? ""}`}
                    >
                      <div className="flex gap-[16px] items-center">
                        <div className="home-accent-gradient bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]">
                          <div className="h-[21px] relative shrink-0 w-[25.667px]">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={action.viewBox}>
                              <path d={action.icon} fill="white" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[16px]">
                            <p className="leading-[24px]">{action.title}</p>
                          </div>
                          <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[#64748b] text-[14px]">
                            <p className="leading-[17.5px]">{action.sub}</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[12px] relative shrink-0 w-[7.4px]">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.4 12">
                          <path d={svgPaths.p28c84800} fill="#94A3B8" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Tracking */}
              <div className="relative shrink-0 w-full mb-4 animate-[routeLift_280ms_ease-out]">
                <div className="content-stretch flex flex-col gap-[12px] items-start px-[24px] py-[16px] relative w-full">
                  <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[18px] w-full">
                    <p className="leading-[28px]">{t("실시간 추적", "Live Tracking")}</p>
                  </div>

                  <button
                    onClick={() => navigate("/campus-shuttle")}
                    aria-label={t("학내순환 실시간 위치 보기", "View live campus loop positions")}
                    className="bg-[#eef3ff] content-stretch flex flex-col h-[128px] items-start justify-center overflow-hidden relative rounded-[16px] shrink-0 w-full border border-[#dbe4f5] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.04)] hover:bg-[#e8eefb] transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 opacity-80">
                      <div className="absolute left-[12%] top-[-10px] h-[150px] w-[1px] rotate-[28deg] bg-white/80" />
                      <div className="absolute left-[45%] top-[-20px] h-[170px] w-[1px] -rotate-[18deg] bg-white/70" />
                      <div className="absolute right-[14%] top-[-10px] h-[150px] w-[1px] rotate-[12deg] bg-white/80" />
                    </div>
                    {miniMap.path && (
                      <svg
                        className="absolute inset-0 h-full w-full"
                        viewBox="0 0 320 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path d={miniMap.path} fill="none" stroke="rgba(30,58,138,0.14)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={miniMap.path} fill="none" stroke="#1e3a8a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        {miniMap.stops.map((point, index) => (
                          <circle key={`home-stop-${index}`} cx={point.x} cy={point.y} r="3" fill="white" stroke="#1e3a8a" strokeWidth="1.8" />
                        ))}
                        {miniMap.buses.map((point, index) => (
                          <g key={`home-bus-${index}`} transform={`translate(${point.x} ${point.y})`}>
                            <circle r="9" fill="rgba(30,58,138,0.16)" />
                            <circle r="5" fill="#1e3a8a" stroke="white" strokeWidth="2" />
                          </g>
                        ))}
                      </svg>
                    )}

                    <div className="absolute backdrop-blur-[4px] bg-white/90 left-[10px] top-[10px] rounded-[8px] px-[10px] py-[7px] text-left shadow-sm">
                      <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[12px] leading-[16px]">
                        {t("학내순환", "Campus Loop")}
                      </p>
                      <p className="font-['Public_Sans'] font-medium text-[#64748b] text-[10px] leading-[14px]">
                        {busActive
                          ? t(`${displayBuses.length}대 운행 중`, `${displayBuses.length} buses in service`)
                          : t("운행 정보 없음", "No live service")}
                      </p>
                    </div>

                    <div className="absolute backdrop-blur-[4px] bg-white/90 bottom-[8px] content-stretch flex flex-col items-start px-[9px] py-[5px] right-[8px] rounded-[8px] shadow-sm">
                      <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#1e293b] text-[10px]">
                        <p className="leading-[15px]">{t("전체 지도 보기", "OPEN MAP")}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
        </div>
        {/* ── End content ────────────────────────── */}

      </div>

      <BottomNav />
    </div>
  );
}
