import { lazy, Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Box, Bus, ChevronDown, ChevronUp, Map as MapIcon, MapPin, Route as RouteIcon, Train } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import NaverMapComponent from "../components/NaverMapComponent";
import { api } from "../services/api";
import { supabase } from "../services/supabase";
import { estimateStopArrivals } from "../utils/shuttleEta";
import { simulateCampusLoop, simulateStationShuttle } from "../utils/campusLoopSimulation";
import { formatServiceTime, getNextShuttleService, getServiceRuleSummary } from "../utils/shuttleSchedule";
import { getStationShuttleMap } from "../utils/stationShuttleMap";

const loadShuttle3DMap = () => import("../components/Shuttle3DMap");
const Shuttle3DMap = lazy(loadShuttle3DMap);

const CAMPUS_STOPS = [
  { id: "rear-gate", nameKo: "후문", nameEn: "Rear Gate", lat: 36.772760, lng: 126.933816, order: 1 },
  { id: "hyang3", nameKo: "향3", nameEn: "Hyang Hall 3", lat: 36.768228, lng: 126.935383, order: 2 },
  { id: "hyang1", nameKo: "향1", nameEn: "Hyang Hall 1", lat: 36.767905, lng: 126.932505, order: 3 },
  { id: "library", nameKo: "도서관", nameEn: "Library", lat: 36.768856, lng: 126.931303, order: 4 },
  { id: "main-gate", nameKo: "정문", nameEn: "Main Gate", lat: 36.769014, lng: 126.927978, order: 5 },
];

const CAMPUS_CENTER = { lat: 36.7694, lng: 126.9322 };
const CAMPUS_VIEWPORT_POINTS = [
  { lat: 36.772760, lng: 126.933816 },
  { lat: 36.768228, lng: 126.935383 },
  { lat: 36.769014, lng: 126.927978 },
  { lat: 36.770130, lng: 126.936000 },
];
const CAMPUS_FIT_BOUNDS_OPTIONS = {
  top: 140,
  right: 44,
  bottom: 344,
  left: 44,
  maxZoom: 17,
  zoomOffset: 1,
};

interface BusMarker {
  id: string;
  position: { lat: number; lng: number };
  heading: number;
  label: string;
  speed: number;
  timestamp: string;
  servicePhase?: string | null;
  plannedDepartureAt?: string | null;
  etaLabel?: string;
  isSimulation?: boolean;
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
type MapMode = "2d" | "3d";

function hasStationSignal(route: any) {
  if (route.shuttleVariant && route.shuttleVariant !== "campus_loop") return true;
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
  if (route.shuttleVariant === "campus_to_station") return "to-station";
  if (route.shuttleVariant === "station_to_campus" || route.shuttleVariant === "station_to_campus_loop") return "from-station";
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
  if (route.shuttleVariant === "station_to_campus_loop") return true;
  if (route.shuttleVariant === "station_to_campus" || route.shuttleVariant === "campus_to_station") return false;
  const stops = route.stops || [];
  const rearGateIndex = stops.findIndex((stop: any) => /후문/.test(stop.name || ""));
  return /학내순환|순환|연결/.test(`${route.name || ""} ${route.description || ""}`) || (
    rearGateIndex >= 0 && rearGateIndex < stops.length - 1
  );
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

function formatDepartureCountdown(departureAt: Date | undefined, nowMs: number) {
  if (!departureAt) return "시간표 확인";
  const remainingMinutes = Math.max(0, Math.ceil((departureAt.getTime() - nowMs) / 60_000));
  if (remainingMinutes <= 1) return "곧 출발";
  if (remainingMinutes < 60) return `${remainingMinutes}분 남음`;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간 남음`;
}

const formatStationRouteName = (name?: string | null) => name || "신창역 셔틀";

const formatStationServiceLabel = (label?: string) =>
  label?.replace(/김승우\s*라운지/g, "후문");

export default function CampusShuttleWrapper() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();

  const [mode, setMode] = useState<ShuttleMode>("campus");
  const [mapMode, setMapMode] = useState<MapMode>("2d");
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [stationRouteId, setStationRouteId] = useState<string | null>(null);
  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [locationsByBus, setLocationsByBus] = useState<Map<string, any>>(new Map());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [focusLocation, setFocusLocation] = useState<FocusLocation | null>(null);
  const [fitBoundsKey, setFitBoundsKey] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [campusStops, setCampusStops] = useState<ShuttleStop[]>(CAMPUS_STOPS);
  const [stationStops, setStationStops] = useState<ShuttleStop[]>([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isPreparing3d, setIsPreparing3d] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [simulationTick, setSimulationTick] = useState(() => Date.now());
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
  const campusLoopRouteIds = useMemo(
    () => new Set(campusRoutes.filter((route) => !hasStationSignal(route)).map((route) => route.id)),
    [campusRoutes]
  );
  const selectedStationRoute = useMemo(
    () => stationRoutes.find((route) => route.id === stationRouteId) || stationRoutes[0] || null,
    [stationRouteId, stationRoutes]
  );
  const stationDepartureRoute = useMemo(
    () => stationRoutes.find((route) => routeDirection(route) === "to-station") || stationRoutes[0] || null,
    [stationRoutes],
  );
  const stationRouteIds = useMemo(
    () => new Set(stationRoutes.map((route) => route.id)),
    [stationRoutes]
  );
  const campusLoopRoute = useMemo(
    () => campusRoutes.find((route) => route.shuttleVariant === "campus_loop") || null,
    [campusRoutes],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pageVisible) return;
    setSimulationTick(Date.now());
    const timer = window.setInterval(() => setSimulationTick(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [pageVisible]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const routes = await api.getRoutes();
        setAllRoutes(routes);
        const station = routes.filter((route: any) => route.type === "campus" && route.isActive && hasStationSignal(route));
        const departureRoute = station.find((route: any) => routeDirection(route) === "to-station") || station[0];
        setStationRouteId((current) => current || departureRoute?.id || null);
      } catch (error) {
        console.warn("셔틀 노선 불러오기 실패:", error);
      }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setPageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
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
        const stationMap = getStationShuttleMap(
          path || [],
          formatRouteStops(stops || selectedStationRoute.stops || []),
          routeDirection(selectedStationRoute),
        );
        setRoutePath(stationMap.path);
        setStationStops(stationMap.stops);
        setFocusLocation(null);
      })
      .catch((error) => {
        console.warn("신창역 셔틀 경로 불러오기 실패:", error);
        setRoutePath([]);
        setStationStops(getStationShuttleMap(
          [],
          formatRouteStops(selectedStationRoute.stops || []),
          routeDirection(selectedStationRoute),
        ).stops);
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
    if (!pageVisible) return;
    fetchInitial();
    const channel = supabase
      .channel(`shuttle-tracking-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_latest_state" },
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
      .subscribe();
    const busRefreshTimer = window.setInterval(() => {
      api.getBuses().then(setAllBuses).catch(() => {});
    }, 15_000);

    return () => {
      window.clearInterval(busRefreshTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchInitial, pageVisible]);

  const enableUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("이 브라우저에서는 현재 위치를 사용할 수 없습니다");
      return;
    }

    setLocationEnabled(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(nextLocation);
        setFocusLocation({ ...nextLocation, zoom: 18, key: Date.now() });
        setLocationError(null);
      },
      () => setLocationError("현재 위치 권한을 허용하면 내 위치를 지도에서 볼 수 있습니다"),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!locationEnabled) return;
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      () => setLocationError("현재 위치 권한을 허용하면 내 위치를 지도에서 볼 수 있습니다"),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationEnabled]);

  const visibleBuses = useMemo<BusMarker[]>(() => {
    return allBuses
      .filter((bus: any) => {
        if (bus.type !== "campus" || bus.status !== "active" || !bus.isRunning) return false;
        const routeId = bus.currentRoute?.id;
        if (mode === "station") return routeId && stationRouteIds.has(routeId);
        return !routeId || campusLoopRouteIds.has(routeId) || !stationRouteIds.has(routeId);
      })
      .map((bus: any) => {
        const location = locationsByBus.get(bus.id);
        if (!location) return null;
        return {
          id: bus.id,
          position: { lat: location.lat, lng: location.lng },
          heading: location.heading ?? 0,
          label: bus.name,
          speed: Number(location.speed) || 0,
          timestamp: location.timestamp,
          servicePhase: bus.activeTrip?.servicePhase,
          plannedDepartureAt: bus.activeTrip?.plannedDepartureAt,
        };
      })
      .filter(Boolean) as BusMarker[];
  }, [allBuses, locationsByBus, mode, campusLoopRouteIds, stationRouteIds]);

  const activeStops = useMemo(
    () => mode === "station" ? stationStops : campusStops,
    [campusStops, mode, stationStops],
  );
  const selectedStationDirection = selectedStationRoute ? routeDirection(selectedStationRoute) : "to-station";
  const campusSimulation = useMemo(
    () => mode === "campus"
      ? simulateCampusLoop(
          routePath,
          campusStops.map((stop) => ({
            id: stop.id,
            name: stop.nameKo,
            lat: stop.lat,
            lng: stop.lng,
            order: stop.order,
          })),
          simulationTick,
          campusLoopRoute?.intervalMinutes ?? 10,
        )
      : { buses: [], stopDepartures: new Map<string, string>() },
    [campusLoopRoute?.intervalMinutes, campusStops, mode, routePath, simulationTick],
  );
  const stationSimulation = useMemo(
    () => mode === "station"
      ? simulateStationShuttle(
          routePath,
          stationStops.map((stop) => ({
            id: stop.id,
            name: stop.nameKo,
            lat: stop.lat,
            lng: stop.lng,
            order: stop.order,
          })),
          simulationTick,
        )
      : { buses: [], stopDepartures: new Map<string, string>() },
    [mode, routePath, simulationTick, stationStops],
  );
  const usingCampusSimulation = mode === "campus" && visibleBuses.length === 0;
  const usingStationSimulation = mode === "station" && visibleBuses.length === 0;
  const usingSimulation = usingCampusSimulation || usingStationSimulation;
  const effectiveBuses = useMemo<BusMarker[]>(
    () => {
      if (visibleBuses.length > 0) return visibleBuses;
      return mode === "campus" ? campusSimulation.buses : stationSimulation.buses;
    },
    [campusSimulation.buses, mode, stationSimulation.buses, visibleBuses],
  );
  const mapStops = useMemo(() => activeStops.map((stop) => ({
    id: stop.id,
    name: stop.nameKo,
    position: { lat: stop.lat, lng: stop.lng },
  })), [activeStops]);
  const sceneStops = useMemo(() => mapStops.map((stop) => ({
    ...stop,
    departureLabel: usingCampusSimulation
      ? campusSimulation.stopDepartures.get(stop.id)
      : usingStationSimulation ? stationSimulation.stopDepartures.get(stop.id) : undefined,
  })), [campusSimulation.stopDepartures, mapStops, stationSimulation.stopDepartures, usingCampusSimulation, usingStationSimulation]);
  const mapCenter = activeStops[0] ? { lat: activeStops[0].lat, lng: activeStops[0].lng } : CAMPUS_CENTER;
  const arrivalEstimates = useMemo(
    () => estimateStopArrivals(
      routePath,
      activeStops.map((stop) => ({ id: stop.id, order: stop.order, lat: stop.lat, lng: stop.lng })),
      effectiveBuses,
      {
        loop: mode === "campus",
        fallbackSpeedMps: mode === "campus" ? 6.2 : 9.5,
        nowMs: usingSimulation ? simulationTick : clockTick,
      },
    ),
    [activeStops, clockTick, effectiveBuses, mode, routePath, simulationTick, usingSimulation],
  );
  const displayBuses = useMemo(() => {
    if (mode !== "station") return effectiveBuses;
    const destination = activeStops[activeStops.length - 1];
    const destinationEstimate = destination ? arrivalEstimates.get(destination.id) : null;
    return effectiveBuses.map((bus) => ({
      ...bus,
      etaLabel: formatStationServiceLabel(bus.etaLabel),
      label: !bus.etaLabel && destinationEstimate?.busId === bus.id && destinationEstimate.minutes
        ? `${destination?.nameKo === "신창역" ? "신창역" : "후문"} 약 ${destinationEstimate.minutes}분`
        : bus.label,
    }));
  }, [activeStops, arrivalEstimates, effectiveBuses, mode]);
  const stopsWithArrival = useMemo(() => activeStops.map((stop) => ({
    ...stop,
    estimate: arrivalEstimates.get(stop.id) ?? null,
  })), [activeStops, arrivalEstimates]);

  const selectedStationService = selectedStationRoute ? getNextShuttleService(selectedStationRoute, new Date(clockTick)) : null;
  const stationOffset = selectedStationRoute?.departureOffsetMinutes ?? 10;
  const stationWait = selectedStationRoute?.boardingWaitMinutes ?? 5;
  const selectedStationEventTime = selectedStationService
    ? formatServiceTime(selectedStationService.eventAt, selectedStationService.dayOffset) : null;
  const stationDeparture = selectedStationService
    ? formatServiceTime(selectedStationService.departureAt, selectedStationService.dayOffset) : null;
  const stationCountdown = formatDepartureCountdown(selectedStationService?.departureAt, clockTick);

  const handleBusClick = useCallback((busId: string) => {
    const bus = displayBuses.find((item) => item.id === busId);
    if (!bus) return;
    setFocusLocation({ lat: bus.position.lat, lng: bus.position.lng, zoom: 18, key: Date.now() });
  }, [displayBuses]);

  const prepare3DMap = useCallback(() => {
    void loadShuttle3DMap().catch((error) => {
      console.warn("3D 캠퍼스 미리 불러오기 실패:", error);
    });
  }, []);

  const handleMapModeChange = useCallback(async (nextMode: MapMode) => {
    if (nextMode === mapMode || isPreparing3d) return;

    if (nextMode === "3d") {
      setIsPreparing3d(true);
      try {
        await loadShuttle3DMap();
      } catch (error) {
        console.warn("3D 캠퍼스 불러오기 실패:", error);
        return;
      } finally {
        setIsPreparing3d(false);
      }
    }

    setMapMode(nextMode);
    if (nextMode === "2d" && mode === "campus") {
      setFitBoundsKey((key) => key + 1);
    }
    setSheetExpanded(false);
  }, [isPreparing3d, mapMode, mode]);

  const handleDragStart = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    currentDragY.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const rawDelta = e.clientY - dragStartY.current;
    const delta = sheetExpanded ? Math.max(0, rawDelta) : Math.min(0, rawDelta);
    currentDragY.current = delta;
    setDragY(delta);
  };
  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetExpanded && currentDragY.current > 60) setSheetExpanded(false);
    if (!sheetExpanded && currentDragY.current < -40) setSheetExpanded(true);
    currentDragY.current = 0;
    setDragY(0);
  };
  const compact3d = mapMode === "3d" && !sheetExpanded;

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-center relative size-full">
      <div className="bg-[#f6f6f8] overflow-hidden relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full max-w-[430px]" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence initial={false} mode="sync">
            {mapMode === "2d" ? (
              <motion.div
                key="shuttle-map-2d"
                className="absolute inset-0"
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.018 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "50% 42%" }}
              >
                <NaverMapComponent
                  center={mapCenter}
                  zoom={16}
                  buses={displayBuses}
                  stops={mapStops}
                  userLocation={userLocation}
                  focusLocation={focusLocation}
                  fitBoundsKey={fitBoundsKey}
                  autoFitBounds
                  fitBoundsOptions={CAMPUS_FIT_BOUNDS_OPTIONS}
                  fitBoundsPoints={mode === "campus" ? CAMPUS_VIEWPORT_POINTS : undefined}
                  routePath={routePath}
                  onBusClick={handleBusClick}
                  onLocateRequest={enableUserLocation}
                />
              </motion.div>
            ) : (
              <motion.div
                key="shuttle-map-3d"
                className="absolute inset-0"
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.018 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.985 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "50% 42%" }}
              >
                <Suspense fallback={<div className="grid h-full place-items-center bg-[#e8edf1] text-sm font-bold text-[#1e3a8a]">3D 캠퍼스를 준비 중입니다</div>}>
                  <Shuttle3DMap
                    key={`${mode}-${selectedStationRoute?.id ?? "campus"}-${fitBoundsKey}`}
                    sceneMode={mode}
                    routePath={routePath}
                    stops={sceneStops}
                    buses={displayBuses}
                    onSelectStop={(stopId) => {
                      const stop = activeStops.find((item) => item.id === stopId);
                      if (stop) setFocusLocation({ lat: stop.lat, lng: stop.lng, zoom: 18, key: Date.now() });
                    }}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
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
                    setFocusLocation(null);
                    if (item.key === "station" && stationDepartureRoute) {
                      setStationRouteId(stationDepartureRoute.id);
                    }
                    setFitBoundsKey((key) => key + 1);
                    setSheetExpanded(false);
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

        <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+88px)] z-20 flex overflow-hidden rounded-xl border border-white/90 bg-white/94 p-1 shadow-[0_8px_22px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          {([
            { key: "2d", label: "2D 지도", icon: MapIcon },
            { key: "3d", label: "3D 캠퍼스", icon: Box },
          ] as const).map((item) => (
            <button
              key={item.key}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-pressed={mapMode === item.key}
              aria-busy={item.key === "3d" && isPreparing3d}
              disabled={isPreparing3d}
              onPointerEnter={item.key === "3d" ? prepare3DMap : undefined}
              onPointerDown={item.key === "3d" ? prepare3DMap : undefined}
              onFocus={item.key === "3d" ? prepare3DMap : undefined}
              onClick={() => void handleMapModeChange(item.key)}
              className={`grid h-9 w-9 place-items-center rounded-lg transition-colors disabled:cursor-wait ${mapMode === item.key ? "bg-[#1e3a8a] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}
            >
              <item.icon className={`h-4 w-4 ${item.key === "3d" && isPreparing3d ? "animate-pulse" : ""}`} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-start overflow-hidden rounded-t-[24px] bg-white shadow-[0px_-12px_40px_0px_rgba(0,0,0,0.12)]"
          style={{
            height: sheetExpanded ? "68dvh" : compact3d ? "164px" : "320px",
            transform: `translateY(${dragY}px)`,
            transition: isDragging.current
              ? "none"
              : "height 0.38s cubic-bezier(0.32,0.72,0,1), transform 0.32s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div
            className="relative flex h-8 w-full shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <div className="h-1 w-10 shrink-0 rounded-full bg-[rgba(30,58,138,0.24)]" />
          </div>

          {compact3d ? (
            <button
              type="button"
              aria-label="상세 안내 펼치기"
              aria-expanded={false}
              onClick={() => setSheetExpanded(true)}
              className="mx-4 flex h-12 w-[calc(100%-2rem)] shrink-0 items-center gap-3 rounded-lg border border-[rgba(30,58,138,0.16)] bg-white px-3 text-left shadow-sm"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1e3a8a] text-white">
                {mode === "station" ? <MapPin className="size-4" /> : <Bus className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-extrabold text-[#1e3a8a]">
                  {mode === "station"
                    ? `${selectedStationDirection === "to-station" ? "후문" : "신창역"} ${stationCountdown}`
                    : "학내순환 운행 중"}
                </span>
                <span className="block truncate text-[10px] font-semibold text-[rgba(30,58,138,0.65)]">
                  {mode === "station"
                    ? `${selectedStationDirection === "to-station" ? "열차 출발" : "열차 도착"} ${selectedStationEventTime || "--:--"}`
                    : campusLoopRoute ? getServiceRuleSummary(campusLoopRoute) : "10분 간격 출발"}
                </span>
              </span>
              <ChevronUp className="size-4 shrink-0 text-[#1e3a8a]" />
            </button>
          ) : <div className="relative min-h-0 w-full flex-1 overflow-auto overscroll-contain">
            <div className="relative flex w-full flex-col items-start gap-3 px-[22px] pb-[104px]">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div>
                  <p className="font-['Public_Sans'] font-extrabold text-[#1e3a8a] text-[20px] tracking-[-0.4px] leading-[28px]">
                    {mode === "station" ? "신창역 셔틀" : "학내순환"}
                  </p>
                  <p className="font-['Public_Sans'] text-[rgba(30,58,138,0.65)] text-[12px] leading-[18px]">
                    {mode === "station"
                      ? "후문과 신창역을 오가는 셔틀입니다"
                      : campusLoopRoute ? getServiceRuleSummary(campusLoopRoute) : "교내 정류장을 순환하는 셔틀입니다"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFitBoundsKey((key) => key + 1)}
                    className="rounded-full bg-[rgba(30,58,138,0.05)] px-3 py-[7px] transition-all hover:bg-[rgba(30,58,138,0.1)] active:scale-95"
                  >
                    <span className="font-['Public_Sans'] text-[12px] font-bold leading-4 text-[#1e3a8a]">{t("전체보기", "View All")}</span>
                  </button>
                  <button
                    type="button"
                    title={sheetExpanded ? "안내 접기" : "상세 안내 펼치기"}
                    aria-label={sheetExpanded ? "안내 접기" : "상세 안내 펼치기"}
                    aria-expanded={sheetExpanded}
                    onClick={() => setSheetExpanded((expanded) => !expanded)}
                    className="grid size-8 place-items-center rounded-lg border border-[rgba(30,58,138,0.18)] bg-white text-[#1e3a8a] transition-colors hover:bg-[rgba(30,58,138,0.05)]"
                  >
                    {sheetExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                  </button>
                </div>
              </div>

              {locationError && (
                <div className="w-full rounded-[14px] bg-[#1e3a8a] px-4 py-3 text-[12px] font-semibold text-white">
                  {locationError}
                </div>
              )}

              {mode === "station" && (
                <div className="w-full space-y-3">
                  <div className="overflow-hidden rounded-lg bg-[#1e3a8a] text-white shadow-[0_12px_30px_rgba(30,58,138,0.2)]">
                    <div className="flex items-start gap-3 p-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-[#1e3a8a]">
                        {selectedStationDirection === "to-station" ? <MapPin className="h-5 w-5" /> : <Train className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-white/70">
                          {selectedStationDirection === "to-station" ? "후문 출발" : "신창역 출발"}
                        </p>
                        <p className="mt-0.5 text-[24px] font-black leading-8">{stationCountdown}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold text-white/70">
                          {selectedStationDirection === "to-station" ? "열차 출발" : "열차 도착"}
                        </p>
                        <p className="mt-1 text-[17px] font-black">
                          {selectedStationEventTime || "--:--"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/20 bg-[#1e3a8a] px-4 py-2.5 text-[11px]">
                      <span className="truncate pr-3 font-bold text-white/90">
                        {selectedStationRoute ? formatStationRouteName(selectedStationRoute.name) : "신창역 셔틀 노선을 추가해 주세요"}
                      </span>
                      <span className="shrink-0 font-extrabold text-white">
                        {stationDeparture || "--:--"} 출발
                      </span>
                    </div>
                  </div>

                  {sheetExpanded && selectedStationRoute && (
                    <p className="px-1 text-[11px] font-semibold text-[rgba(30,58,138,0.68)]">
                      {selectedStationDirection === "to-station"
                        ? `열차 출발 ${stationOffset}분 전에 후문에서 출발합니다`
                        : `열차 도착 ${stationWait}분 후 출발 · ${continuesCampusLoop(selectedStationRoute) ? "후문 도착 후 학내순환 1회" : "후문 종착"}`}
                    </p>
                  )}

                  {sheetExpanded && stationRoutes.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {stationRoutes.map((route) => (
                        <button
                          key={route.id}
                          onClick={() => setStationRouteId(route.id)}
                          className={`shrink-0 rounded-full px-4 py-2 font-['Public_Sans'] text-[12px] font-bold transition-all ${
                            selectedStationRoute?.id === route.id
                              ? "bg-[#1e3a8a] text-white"
                              : "border border-[rgba(30,58,138,0.18)] bg-white text-[#1e3a8a]"
                          }`}
                        >
                          {formatStationRouteName(route.name)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {mode === "campus" && !sheetExpanded && (
                <button
                  type="button"
                  onClick={() => setSheetExpanded(true)}
                  className="flex w-full items-center gap-3 rounded-lg border border-[rgba(30,58,138,0.16)] bg-white p-3 text-left transition-colors hover:bg-[rgba(30,58,138,0.04)]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1e3a8a] text-white">
                    <Bus className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-extrabold text-[#1e3a8a]">학내순환 운행 안내</span>
                    <span className="block truncate text-[11px] font-semibold text-[rgba(30,58,138,0.65)]">
                      {campusLoopRoute ? getServiceRuleSummary(campusLoopRoute) : "10분 간격 출발"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[10px] font-bold text-[rgba(30,58,138,0.5)]">정류장</span>
                    <span className="block text-[16px] font-black text-[#1e3a8a]">{activeStops.length}개</span>
                  </span>
                </button>
              )}

              {sheetExpanded && <div className="relative flex w-full shrink-0 flex-col items-start gap-3 scrollbar-hide">
                {stopsWithArrival.length === 0 ? (
                  <div className="w-full rounded-[18px] border border-dashed border-[rgba(30,58,138,0.24)] p-6 text-center">
                    <MapPin className="mx-auto mb-2 h-6 w-6 text-[rgba(30,58,138,0.5)]" />
                    <p className="font-['Public_Sans'] text-[13px] font-semibold text-[rgba(30,58,138,0.7)]">
                      표시할 정류장이 없습니다
                    </p>
                    <p className="mt-1 font-['Public_Sans'] text-[12px] text-[rgba(30,58,138,0.5)]">
                      관리자 노선 관리에서 정류장 위치를 저장하면 여기에 표시됩니다.
                    </p>
                  </div>
                ) : (
                  stopsWithArrival.map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => setFocusLocation({ lat: stop.lat, lng: stop.lng, zoom: 18, key: Date.now() })}
                      className={`relative w-full shrink-0 rounded-[16px] border border-[rgba(30,58,138,0.1)] bg-white text-left transition-all active:scale-[0.99] ${
                        !stop.estimate?.minutes ? "opacity-80" : ""
                      }`}
                    >
                      <div className="flex items-center gap-[14px] p-[16px] w-full">
                        <div
                          className={`${
                            stop.estimate?.state === "arriving" ? "bg-[#1e3a8a]" : "border border-[rgba(30,58,138,0.18)] bg-white"
                          } relative rounded-[12px] shrink-0 size-[46px] flex items-center justify-center ${
                            stop.estimate?.state === "arriving" ? "shadow-[0px_4px_6px_-1px_rgba(30,58,138,0.2)]" : ""
                          }`}
                        >
                          {mode === "station" ? (
                            <RouteIcon className={`w-5 h-5 ${stop.estimate?.state === "arriving" ? "text-white" : "text-[#1e3a8a]"}`} />
                          ) : (
                            <Bus className={`w-5 h-5 ${stop.estimate?.state === "arriving" ? "text-white" : "text-[#1e3a8a]"}`} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[16px] leading-[24px] truncate">
                            {t(stop.nameKo, stop.nameEn)}
                          </p>
                          <p className="font-['Public_Sans'] font-medium text-[rgba(30,58,138,0.62)] text-[11px] leading-[16.5px]">
                            {stop.estimate?.busLabel
                              ? `${stop.estimate.busLabel} · ${stop.order}번째 정류장`
                              : `${mode === "station" ? "신창역 셔틀" : "학내순환"} · ${stop.order}번째 정류장`}
                          </p>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className={`font-['Public_Sans'] font-bold text-[10px] tracking-[0.25px] uppercase ${
                            stop.estimate?.state === "arriving" ? "text-[#1e3a8a]" : "text-[rgba(30,58,138,0.48)]"
                          }`}>
                            {stop.estimate?.state === "arriving"
                              ? "곧 도착"
                              : stop.estimate?.state === "stale" ? "위치 지연" : "예상 시간"}
                          </div>
                          <div className={`font-['Public_Sans'] font-extrabold text-[16px] leading-[24px] ${
                            !stop.estimate?.minutes ? "text-[rgba(30,58,138,0.48)]" : "text-[#1e3a8a]"
                          }`}>
                            {stop.estimate?.state === "arriving" && stop.estimate.minutes === 1
                              ? "잠시 후"
                              : stop.estimate?.minutes ? `약 ${stop.estimate.minutes}분` : "--"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>}

            </div>
          </div>}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
