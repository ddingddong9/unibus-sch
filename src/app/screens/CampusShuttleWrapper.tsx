import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Bus, Clock, MapPin, Route as RouteIcon, Train } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import NaverMapComponent from "../components/NaverMapComponent";
import { api } from "../services/api";
import { supabase } from "../services/supabase";

const CAMPUS_STOPS = [
  { id: "rear-gate", nameKo: "후문", nameEn: "Rear Gate", lat: 36.772760, lng: 126.933816, order: 1 },
  { id: "hyang3", nameKo: "향3", nameEn: "Hyang Hall 3", lat: 36.768228, lng: 126.935383, order: 2 },
  { id: "hyang1", nameKo: "향1", nameEn: "Hyang Hall 1", lat: 36.767905, lng: 126.932505, order: 3 },
  { id: "library", nameKo: "도서관", nameEn: "Library", lat: 36.768856, lng: 126.931303, order: 4 },
  { id: "main-gate", nameKo: "정문", nameEn: "Main Gate", lat: 36.769014, lng: 126.927978, order: 5 },
];

const CAMPUS_CENTER = { lat: 36.7694, lng: 126.9322 };

interface BusMarker {
  id: string;
  position: { lat: number; lng: number };
  heading: number;
  label: string;
}

interface FocusLocation {
  lat: number;
  lng: number;
  zoom?: number;
  key: number;
}

interface ShuttleStop {
  id: string;
  nameKo: string;
  nameEn: string;
  lat: number;
  lng: number;
  order: number;
}

type ShuttleMode = "campus" | "station";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

function getArrivalMinutes(stopLat: number, stopLng: number, buses: BusMarker[]): number | null {
  if (buses.length === 0) return null;
  const minDist = Math.min(
    ...buses.map((bus) => haversineKm(bus.position.lat, bus.position.lng, stopLat, stopLng))
  );
  return Math.max(1, Math.round(minDist / 0.25));
}

function hasStationSignal(route: any) {
  const text = [
    route.name,
    route.description,
    route.region,
    ...(route.stops || []).map((stop: any) => stop.name),
  ]
    .filter(Boolean)
    .join(" ");
  return /신창|순천향대역|순천향대학교역/.test(text);
}

function hasRearGateSignal(text = "") {
  return /후문|학교|순천향/.test(text);
}

function routeDirection(route: any): "to-station" | "from-station" {
  const stops = route.stops || [];
  const first = stops[0]?.name || "";
  const last = stops[stops.length - 1]?.name || "";
  if (/신창|역/.test(first)) return "from-station";
  if (/신창|역/.test(last)) return "to-station";
  if (/후문.*신창|학교.*신창/.test(route.name || "")) return "to-station";
  if (/신창.*후문|신창.*학교/.test(route.name || "")) return "from-station";
  return hasRearGateSignal(first) ? "to-station" : "from-station";
}

function continuesCampusLoop(route: any) {
  const stops = route.stops || [];
  const rearGateIndex = stops.findIndex((stop: any) => /후문/.test(stop.name || ""));
  return /학내순환|순환|연결/.test(`${route.name || ""} ${route.description || ""}`) || (
    rearGateIndex >= 0 && rearGateIndex < stops.length - 1
  );
}

function parseTimes(schedule?: string | null) {
  return (schedule || "")
    .split(/[,\n]/)
    .map((time) => time.trim())
    .filter(Boolean)
    .filter((time) => /^\d{1,2}:\d{2}$/.test(time));
}

function parseOffsetMinutes(route: any) {
  const text = `${route.duration || ""} ${route.description || ""}`;
  const match = text.match(/(\d{1,2})\s*분/);
  return match ? Number(match[1]) : 10;
}

function minusMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  date.setMinutes(date.getMinutes() - minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function nextTime(times: string[]) {
  if (times.length === 0) return null;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return times.find((time) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute >= current;
  }) || times[0];
}

function formatRouteStops(stops: any[]): ShuttleStop[] {
  return stops
    .filter((stop: any) => stop.lat != null && stop.lng != null)
    .map((stop: any, index: number) => ({
      id: stop.id || `stop-${index + 1}`,
      nameKo: stop.name || `정류장 ${index + 1}`,
      nameEn: stop.name || `Stop ${index + 1}`,
      lat: Number(stop.lat),
      lng: Number(stop.lng),
      order: stop.order || index + 1,
    }));
}

export default function CampusShuttleWrapper() {
  const { t } = useLanguage();

  const [mode, setMode] = useState<ShuttleMode>("campus");
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [stationRouteId, setStationRouteId] = useState<string | null>(null);
  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [locationsByBus, setLocationsByBus] = useState<Map<string, any>>(new Map());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focusLocation, setFocusLocation] = useState<FocusLocation | null>(null);
  const [fitBoundsKey, setFitBoundsKey] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [campusStops, setCampusStops] = useState<ShuttleStop[]>(CAMPUS_STOPS);
  const [stationStops, setStationStops] = useState<ShuttleStop[]>([]);
  const [sheetVisible, setSheetVisible] = useState(true);
  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  const campusRoutes = useMemo(
    () => allRoutes.filter((route) => route.type === "campus" && route.isActive),
    [allRoutes]
  );
  const stationRoutes = useMemo(
    () => campusRoutes.filter(hasStationSignal),
    [campusRoutes]
  );
  const selectedStationRoute = useMemo(
    () => stationRoutes.find((route) => route.id === stationRouteId) || stationRoutes[0] || null,
    [stationRouteId, stationRoutes]
  );
  const stationRouteIds = useMemo(
    () => new Set(stationRoutes.map((route) => route.id)),
    [stationRoutes]
  );

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const routes = await api.getRoutes();
        setAllRoutes(routes);
        const station = routes.filter((route: any) => route.type === "campus" && route.isActive && hasStationSignal(route));
        setStationRouteId((current) => current || station[0]?.id || null);
      } catch (error) {
        console.warn("셔틀 노선 불러오기 실패:", error);
      }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (mode !== "campus") return;
    localStorage.removeItem("campus_route_path");
    localStorage.removeItem("campus_route_path_v2");
    localStorage.removeItem("campus_route_path_v3");
    localStorage.removeItem("campus_route_path_v5");

    api.getCampusRoutePath()
      .then(({ path, stops }) => {
        setRoutePath(path?.length > 0 ? path : []);
        if (stops?.length > 0) setCampusStops(formatRouteStops(stops));
      })
      .catch((error) => console.warn("학내순환 경로 불러오기 실패:", error));
  }, [mode]);

  useEffect(() => {
    if (mode !== "station") return;
    if (!selectedStationRoute?.id) {
      setRoutePath([]);
      setStationStops([]);
      return;
    }
    api.getRoutePath(selectedStationRoute.id)
      .then(({ path, stops }) => {
        setRoutePath(path || []);
        setStationStops(formatRouteStops(stops || selectedStationRoute.stops || []));
      })
      .catch((error) => {
        console.warn("신창역 셔틀 경로 불러오기 실패:", error);
        setRoutePath([]);
        setStationStops(formatRouteStops(selectedStationRoute.stops || []));
      });
  }, [mode, selectedStationRoute]);

  const fetchInitial = useCallback(async () => {
    try {
      const [buses, locations] = await Promise.all([api.getBuses(), api.getBusLocations()]);
      setAllBuses(buses);
      setLocationsByBus(new Map(locations.map((location: any) => [location.busId, location])));
      setLocationError(null);
    } catch {
      setLocationError("실시간 위치를 불러올 수 없습니다");
    }
  }, []);

  useEffect(() => {
    fetchInitial();
    const channel = supabase
      .channel(`shuttle-tracking-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bus_locations" },
        (payload) => {
          const row = payload.new as any;
          setLocationsByBus((previous) => {
            const next = new Map(previous);
            next.set(row.bus_id, {
              busId: row.bus_id,
              lat: row.latitude,
              lng: row.longitude,
              speed: row.speed,
              heading: row.heading,
              timestamp: row.timestamp,
            });
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "buses" },
        () => fetchInitial()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitial]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("위치 권한 없음:", err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const visibleBuses = useMemo<BusMarker[]>(() => {
    return allBuses
      .filter((bus: any) => {
        if (bus.type !== "campus" || bus.status !== "active") return false;
        const routeId = bus.currentRoute?.id;
        if (mode === "station") return routeId && stationRouteIds.has(routeId);
        return !routeId || !stationRouteIds.has(routeId);
      })
      .map((bus: any) => {
        const location = locationsByBus.get(bus.id);
        if (!location) return null;
        return {
          id: bus.id,
          position: { lat: location.lat, lng: location.lng },
          heading: location.heading ?? 0,
          label: bus.name,
        };
      })
      .filter(Boolean) as BusMarker[];
  }, [allBuses, locationsByBus, mode, stationRouteIds]);

  const activeStops = mode === "station" ? stationStops : campusStops;
  const mapStops = activeStops.map((stop) => ({
    id: stop.id,
    name: stop.nameKo,
    position: { lat: stop.lat, lng: stop.lng },
  }));
  const mapCenter = activeStops[0] ? { lat: activeStops[0].lat, lng: activeStops[0].lng } : CAMPUS_CENTER;

  const stopsWithArrival = activeStops.map((stop) => {
    const arrival = getArrivalMinutes(stop.lat, stop.lng, visibleBuses);
    const status = arrival === null ? "waiting" : arrival <= 2 ? "arriving" : "scheduled";
    return { ...stop, arrival, status };
  });

  const selectedStationDirection = selectedStationRoute ? routeDirection(selectedStationRoute) : "to-station";
  const selectedStationTimes = selectedStationRoute ? parseTimes(selectedStationRoute.schedule) : [];
  const selectedStationNextTime = nextTime(selectedStationTimes);
  const stationOffset = selectedStationRoute ? parseOffsetMinutes(selectedStationRoute) : 10;
  const stationDeparture = selectedStationNextTime && selectedStationDirection === "to-station"
    ? minusMinutes(selectedStationNextTime, stationOffset)
    : selectedStationNextTime;

  const handleBusClick = useCallback((busId: string) => {
    const bus = visibleBuses.find((item) => item.id === busId);
    if (!bus) return;
    setFocusLocation({ lat: bus.position.lat, lng: bus.position.lng, zoom: 18, key: Date.now() });
  }, [visibleBuses]);

  const handleDragStart = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    currentDragY.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = Math.max(0, e.clientY - dragStartY.current);
    currentDragY.current = delta;
    setDragY(delta);
  };
  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (currentDragY.current > 80) setSheetVisible(false);
    currentDragY.current = 0;
    setDragY(0);
  };

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-center relative size-full">
      <div className="bg-[#f6f6f8] overflow-hidden relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full max-w-[430px]" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 w-full h-full">
          <NaverMapComponent
            center={mapCenter}
            zoom={mode === "station" ? 14 : 16}
            buses={visibleBuses}
            stops={mapStops}
            userLocation={userLocation}
            focusLocation={focusLocation}
            fitBoundsKey={fitBoundsKey}
            routePath={routePath}
            onBusClick={handleBusClick}
          />
        </div>

        <div className="absolute left-0 right-0 top-0 z-20 pt-safe">
          <div className="mx-4 mt-4 rounded-[20px] bg-white/95 backdrop-blur-md border border-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] p-2">
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "campus", label: "학내순환" },
                { key: "station", label: "신창역 셔틀" },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setMode(item.key);
                    setFitBoundsKey((key) => key + 1);
                    setSheetVisible(true);
                  }}
                  className={`h-10 rounded-[14px] font-['Public_Sans'] text-[13px] font-bold transition-all ${
                    mode === item.key
                      ? "bg-[#1e3a8a] text-white shadow-sm"
                      : "text-[#64748b] hover:bg-[#f1f5f9]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!sheetVisible && (
          <button
            onClick={() => setSheetVisible(true)}
            className="absolute bottom-[104px] left-1/2 z-30 -translate-x-1/2 rounded-full bg-[#1e3a8a] px-4 py-2 text-white text-[13px] font-bold shadow-lg"
          >
            정류장 보기
          </button>
        )}

        <div
          className="absolute bg-white bottom-0 content-stretch flex flex-col items-start left-0 right-0 rounded-tl-[32px] rounded-tr-[32px] shadow-[0px_-12px_40px_0px_rgba(0,0,0,0.12)] max-h-[66vh] overflow-hidden z-20"
          style={{
            transform: sheetVisible ? `translateY(${dragY}px)` : "translateY(120%)",
            transition: isDragging.current ? "none" : "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div
            className="content-stretch flex h-[36px] items-center justify-center py-[18px] relative shrink-0 w-full cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <div className="bg-[#e2e8f0] h-[5px] rounded-[9999px] shrink-0 w-[48px]" />
          </div>

          <div className="relative shrink-0 w-full overflow-auto">
            <div className="content-stretch flex flex-col gap-[16px] items-start pb-[104px] px-[22px] relative w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div>
                  <p className="font-['Public_Sans'] font-extrabold text-[#0f172a] text-[20px] tracking-[-0.4px] leading-[28px]">
                    {mode === "station" ? "신창역 셔틀" : "학내순환"}
                  </p>
                  <p className="font-['Public_Sans'] text-[#64748b] text-[12px] leading-[18px]">
                    {mode === "station"
                      ? "관리자 노선 관리의 신창역 셔틀 정류장과 경로를 사용합니다"
                      : "교내 정류장을 순환하는 셔틀입니다"}
                  </p>
                </div>
                <button
                  onClick={() => setFitBoundsKey((key) => key + 1)}
                  className="bg-[rgba(30,58,138,0.05)] px-[12px] py-[7px] rounded-[9999px] hover:bg-[rgba(30,58,138,0.1)] active:scale-95 transition-all"
                >
                  <p className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[12px] leading-[16px]">{t("전체보기", "View All")}</p>
                </button>
              </div>

              {locationError && (
                <div className="w-full rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-600">
                  {locationError}
                </div>
              )}

              {mode === "station" && (
                <div className="w-full space-y-3">
                  <div className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-[14px] bg-[#1e3a8a] text-white">
                        {selectedStationDirection === "to-station" ? <Train className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-['Public_Sans'] text-[15px] font-extrabold text-[#0f172a]">
                          {selectedStationRoute?.name || "신창역 셔틀 노선을 추가해 주세요"}
                        </p>
                        <p className="font-['Public_Sans'] text-[12px] text-[#64748b]">
                          {selectedStationRoute
                            ? selectedStationDirection === "to-station"
                              ? `지하철 출발 ${stationOffset}분 전 후문 출발`
                              : continuesCampusLoop(selectedStationRoute) ? "후문 도착 후 학내순환 연결" : "후문 종착"
                            : "관리자 > 버스 노선 관리에서 신창역 정류장이 포함된 셔틀버스 노선을 만들면 표시됩니다"}
                        </p>
                      </div>
                    </div>
                    {selectedStationRoute && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-[14px] bg-white p-3">
                          <p className="font-['Public_Sans'] text-[11px] font-bold uppercase tracking-[0.3px] text-[#94a3b8]">
                            {selectedStationDirection === "to-station" ? "후문 출발" : "신창역 출발"}
                          </p>
                          <p className="mt-1 font-['Public_Sans'] text-[22px] font-black text-[#1e3a8a]">
                            {stationDeparture || "--:--"}
                          </p>
                        </div>
                        <div className="rounded-[14px] bg-white p-3">
                          <p className="font-['Public_Sans'] text-[11px] font-bold uppercase tracking-[0.3px] text-[#94a3b8]">
                            {selectedStationDirection === "to-station" ? "지하철 출발" : "운행 방식"}
                          </p>
                          <p className="mt-1 font-['Public_Sans'] text-[16px] font-black text-[#0f172a] leading-[28px]">
                            {selectedStationDirection === "to-station"
                              ? selectedStationNextTime || "--:--"
                              : continuesCampusLoop(selectedStationRoute) ? "순환 연결" : "후문 종착"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {stationRoutes.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {stationRoutes.map((route) => (
                        <button
                          key={route.id}
                          onClick={() => setStationRouteId(route.id)}
                          className={`shrink-0 rounded-full px-4 py-2 font-['Public_Sans'] text-[12px] font-bold transition-all ${
                            selectedStationRoute?.id === route.id
                              ? "bg-[#1e3a8a] text-white"
                              : "bg-[#f1f5f9] text-[#64748b]"
                          }`}
                        >
                          {route.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="content-stretch flex flex-col gap-[12px] items-start max-h-[280px] overflow-y-auto scrollbar-hide relative shrink-0 w-full">
                {stopsWithArrival.length === 0 ? (
                  <div className="w-full rounded-[18px] border border-dashed border-[#cbd5e1] p-6 text-center">
                    <MapPin className="mx-auto mb-2 h-6 w-6 text-[#94a3b8]" />
                    <p className="font-['Public_Sans'] text-[13px] font-semibold text-[#64748b]">
                      표시할 정류장이 없습니다
                    </p>
                    <p className="mt-1 font-['Public_Sans'] text-[12px] text-[#94a3b8]">
                      관리자 노선 관리에서 정류장 위치를 저장하면 여기에 표시됩니다.
                    </p>
                  </div>
                ) : (
                  stopsWithArrival.map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => setFocusLocation({ lat: stop.lat, lng: stop.lng, zoom: 18, key: Date.now() })}
                      className={`bg-[rgba(248,250,252,0.5)] relative rounded-[16px] shrink-0 w-full border border-[#f1f5f9] text-left transition-all active:scale-[0.99] ${
                        stop.status === "waiting" ? "opacity-80" : ""
                      }`}
                    >
                      <div className="flex items-center gap-[14px] p-[16px] w-full">
                        <div
                          className={`${
                            stop.status === "arriving" ? "bg-[#1e3a8a]" : "bg-[#e2e8f0]"
                          } relative rounded-[12px] shrink-0 size-[46px] flex items-center justify-center ${
                            stop.status === "arriving" ? "shadow-[0px_4px_6px_-1px_rgba(30,58,138,0.2)]" : ""
                          }`}
                        >
                          {mode === "station" ? (
                            <RouteIcon className={`w-5 h-5 ${stop.status === "arriving" ? "text-white" : "text-[#64748b]"}`} />
                          ) : (
                            <Bus className={`w-5 h-5 ${stop.status === "arriving" ? "text-white" : "text-[#64748b]"}`} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] leading-[24px] truncate">
                            {t(stop.nameKo, stop.nameEn)}
                          </p>
                          <p className="font-['Public_Sans'] font-medium text-[#64748b] text-[11px] leading-[16.5px]">
                            {mode === "station" ? "신창역 셔틀" : "학내순환"} · {stop.order}번째 정류장
                          </p>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className={`font-['Public_Sans'] font-bold text-[10px] tracking-[0.25px] uppercase ${
                            stop.status === "arriving" ? "text-[#059669]" : "text-[#94a3b8]"
                          }`}>
                            {stop.status === "arriving" ? "도착 예정" : "예상 시간"}
                          </div>
                          <div className={`font-['Public_Sans'] font-extrabold text-[16px] leading-[24px] ${
                            stop.status === "waiting" ? "text-[#94a3b8]" : "text-[#0f172a]"
                          }`}>
                            {stop.arrival === null ? "--" : `${stop.arrival}분`}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="w-full rounded-[16px] bg-[#f8fafc] px-4 py-3">
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Clock className="h-4 w-4" />
                  <p className="font-['Public_Sans'] text-[12px] font-semibold">
                    {mode === "station"
                      ? "출발 시간과 정류장 위치는 관리자 노선 관리에서 수정한 값과 연동됩니다."
                      : "지도와 정류장은 관리자에서 저장한 학내순환 경로를 사용합니다."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
