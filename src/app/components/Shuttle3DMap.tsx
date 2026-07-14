import { lazy, Suspense, useMemo, useState } from "react";
import { MapPin, Route } from "lucide-react";
import Campus3DScene, {
  campusData,
  type CampusInitialView,
  type CampusLiveBus,
} from "../campus3d/Campus3DScene";
import { projectCoordinate } from "../campus3d/campus-geometry";
import type { CampusStop, Point2D } from "../campus3d/types";
import { stationCorridorData } from "../campus3d/station-corridor";

const StationShuttle3DScene = lazy(() => import("../campus3d/StationShuttle3DScene"));

interface Shuttle3DMapProps {
  sceneMode: "campus" | "station";
  routePath: [number, number][];
  stops: Array<{ id: string; name: string; position: { lat: number; lng: number }; departureLabel?: string }>;
  buses: Array<{
    id: string;
    label: string;
    position: { lat: number; lng: number };
    heading?: number;
    etaLabel?: string;
  }>;
  onSelectStop?: (stopId: string) => void;
}

function projectBusToRoute(point: Point2D, path: Point2D[]) {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestPoint = point;
  let bestProgress = 0;
  let cumulative = 0;

  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const lengthSquared = dx * dx + dz * dz;
    const length = Math.sqrt(lengthSquared);
    const ratio = lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((point[0] - from[0]) * dx + (point[1] - from[1]) * dz) / lengthSquared));
    const projected: Point2D = [from[0] + dx * ratio, from[1] + dz * ratio];
    const distance = Math.hypot(point[0] - projected[0], point[1] - projected[1]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPoint = projected;
      bestProgress = cumulative + length * ratio;
    }
    cumulative += length;
  }

  return { point: bestPoint, progress: bestProgress };
}

export default function Shuttle3DMap({ sceneMode, routePath, stops, buses, onSelectStop }: Shuttle3DMapProps) {
  const [followBusId, setFollowBusId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [stationView, setStationView] = useState<"campus" | "journey">("journey");
  const projectionOrigin = campusData.origin;
  const projectedRoute = useMemo<Point2D[]>(
    () => routePath.map(([lng, lat]) => projectCoordinate(lat, lng, projectionOrigin)),
    [projectionOrigin, routePath],
  );
  const projectedStops = useMemo<CampusStop[]>(
    () => stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      latitude: stop.position.lat,
      longitude: stop.position.lng,
      departureLabel: stop.departureLabel,
    })),
    [stops],
  );
  const stationProjectedRoute = useMemo<Point2D[]>(
    () => routePath.map(([lng, lat]) => projectCoordinate(lat, lng, stationCorridorData.origin)),
    [routePath],
  );
  const liveBuses = useMemo<CampusLiveBus[]>(
    () => buses.map((bus) => {
      const rawPosition = projectCoordinate(bus.position.lat, bus.position.lng, projectionOrigin);
      const projected = projectBusToRoute(rawPosition, projectedRoute);
      return {
        id: bus.id,
        label: bus.label,
        position: projected.point,
        heading: bus.heading,
        routeProgress: projected.progress,
        etaLabel: bus.etaLabel,
      };
    }),
    [buses, projectedRoute, projectionOrigin],
  );
  const stationLiveBuses = useMemo<CampusLiveBus[]>(
    () => buses.map((bus) => {
      const rawPosition = projectCoordinate(bus.position.lat, bus.position.lng, stationCorridorData.origin);
      const projected = projectBusToRoute(rawPosition, stationProjectedRoute);
      return {
        id: bus.id,
        label: bus.label,
        position: projected.point,
        heading: bus.heading,
        routeProgress: projected.progress,
        etaLabel: bus.etaLabel,
      };
    }),
    [buses, stationProjectedRoute],
  );
  const rearGateStop = stops.find((stop) => /후문|김승우/.test(stop.name));
  const hyang3Stop = stops.find((stop) => /향3|향설생활관\s*3/.test(stop.name));
  const mainGateStop = stops.find((stop) => /정문/.test(stop.name));
  const selectedStop = stops.find((stop) => stop.id === selectedStopId);
  const rearGateLat = rearGateStop?.position.lat;
  const rearGateLng = rearGateStop?.position.lng;
  const hyang3Lat = hyang3Stop?.position.lat;
  const hyang3Lng = hyang3Stop?.position.lng;
  const mainGateLat = mainGateStop?.position.lat;
  const mainGateLng = mainGateStop?.position.lng;
  const selectedStopLat = selectedStop?.position.lat;
  const selectedStopLng = selectedStop?.position.lng;
  const campusStopFocus = useMemo(() => {
    if (selectedStopLat == null || selectedStopLng == null) return null;
    const point = projectCoordinate(selectedStopLat, selectedStopLng, campusData.origin);
    return { x: point[0], z: point[1], height: 0 };
  }, [selectedStopLat, selectedStopLng]);
  const initialView = useMemo<CampusInitialView | null>(() => {
    if (sceneMode === "campus") {
      const rearGatePoint = rearGateLat != null && rearGateLng != null
        ? projectCoordinate(rearGateLat, rearGateLng, campusData.origin)
        : projectCoordinate(36.77276, 126.933816, campusData.origin);
      const hyang3Point = hyang3Lat != null && hyang3Lng != null
        ? projectCoordinate(hyang3Lat, hyang3Lng, campusData.origin)
        : projectCoordinate(36.768228, 126.935383, campusData.origin);
      const mainGatePoint = mainGateLat != null && mainGateLng != null
        ? projectCoordinate(mainGateLat, mainGateLng, campusData.origin)
        : projectCoordinate(36.769014, 126.927978, campusData.origin);
      const framingPoints = [rearGatePoint, hyang3Point, mainGatePoint];
      const xs = framingPoints.map(([x]) => x);
      const zs = framingPoints.map(([, z]) => z);
      const target: Point2D = [
        (Math.min(...xs) + Math.max(...xs)) / 2,
        (Math.min(...zs) + Math.max(...zs)) / 2,
      ];
      const outwardX = rearGatePoint[0] - target[0];
      const outwardZ = rearGatePoint[1] - target[1];
      const outwardLength = Math.hypot(outwardX, outwardZ) || 1;
      const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
      const distance = Math.max(2_650, span * 3.9);

      return {
        target,
        distance,
        cameraPosition: [
          rearGatePoint[0] + (outwardX / outwardLength) * 440,
          rearGatePoint[1] + (outwardZ / outwardLength) * 440,
        ],
        cameraHeight: distance * 0.82,
      };
    }

    if (rearGateLat != null && rearGateLng != null) {
      const target = projectCoordinate(rearGateLat, rearGateLng, campusData.origin);
      const eastGate = projectCoordinate(36.77314, 126.93348, campusData.origin);
      const gateSideX = eastGate[0] - target[0];
      const gateSideZ = eastGate[1] - target[1];
      const gateSideLength = Math.hypot(gateSideX, gateSideZ) || 1;
      const unitX = gateSideX / gateSideLength;
      const unitZ = gateSideZ / gateSideLength;

      return {
        target,
        distance: 720,
        cameraPosition: [
          eastGate[0] + unitX * 260 - unitZ * 80,
          eastGate[1] + unitZ * 260 + unitX * 80,
        ],
        cameraHeight: 260,
      };
    }

    const points = projectedRoute;
    if (points.length === 0) return null;
    const xs = points.map(([x]) => x);
    const zs = points.map(([, z]) => z);
    const width = Math.max(...xs) - Math.min(...xs);
    const depth = Math.max(...zs) - Math.min(...zs);
    const span = Math.max(width, depth);
    return {
      target: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2],
      distance: Math.max(680, Math.min(5600, span * (span > 1200 ? 2.6 : 1.12))),
    };
  }, [
    hyang3Lat,
    hyang3Lng,
    mainGateLat,
    mainGateLng,
    projectedRoute,
    rearGateLat,
    rearGateLng,
    sceneMode,
  ]);
  const stationJourneyView = useMemo<CampusInitialView | null>(() => {
    if (stationProjectedRoute.length === 0) return null;
    const xs = stationProjectedRoute.map(([x]) => x);
    const zs = stationProjectedRoute.map(([, z]) => z);
    const width = Math.max(...xs) - Math.min(...xs);
    const depth = Math.max(...zs) - Math.min(...zs);
    return {
      target: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2],
      distance: Math.max(1900, Math.max(width, depth) * 1.55),
    };
  }, [stationProjectedRoute]);

  if (projectedRoute.length < 2) {
    return (
      <div className="grid h-full place-items-center bg-[#e8edf1] px-8 text-center">
        <div>
          <p className="text-sm font-extrabold text-[#0f172a]">3D 경로를 준비할 수 없습니다</p>
          <p className="mt-1 text-xs text-[#64748b]">관리자 노선 관리에서 경로를 저장해 주세요.</p>
        </div>
      </div>
    );
  }

  const handleSelectStop = (stop: CampusStop) => {
    setSelectedStopId(stop.id);
    setFollowBusId(null);
    onSelectStop?.(stop.id);
  };

  return (
    <div className="relative h-full w-full">
      {sceneMode === "station" && stationView === "journey" ? (
        <Suspense fallback={<div className="grid h-full place-items-center bg-[#e8edf1] text-xs font-bold text-[#1e3a8a]">신창역 노선을 준비 중입니다</div>}>
          <StationShuttle3DScene
            routePath={stationProjectedRoute}
            routeStops={projectedStops}
            liveBuses={stationLiveBuses}
            initialView={stationJourneyView}
            followBusId={followBusId}
            selectedStopId={selectedStopId}
            onFollowBus={setFollowBusId}
            onSelectStop={handleSelectStop}
            resetVersion={0}
          />
        </Suspense>
      ) : (
        <Campus3DScene
          isNight={false}
          isRunning
          autoRotate={false}
          showRoute
          selectedBuildingId={null}
          focusTarget={campusStopFocus}
          routePath={projectedRoute}
          routeStops={projectedStops}
          liveBuses={liveBuses}
          initialView={initialView}
          followBusId={followBusId}
          simulationSpeed={1}
          weather="clear"
          renderQuality="balanced"
          isTouring={false}
          onFollowBus={setFollowBusId}
          selectedStopId={selectedStopId}
          onSelectStop={handleSelectStop}
          resetVersion={0}
          onSelectBuilding={() => undefined}
        />
      )}

      {sceneMode === "station" ? (
        <div className="absolute left-4 top-[136px] z-10 grid grid-cols-2 rounded-lg border border-white/85 bg-white/95 p-1 shadow-[0_8px_22px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <button
            type="button"
            aria-pressed={stationView === "campus"}
            onClick={() => { setStationView("campus"); setFollowBusId(null); }}
            className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-extrabold ${stationView === "campus" ? "bg-[#1e3a8a] text-white" : "text-[#64748b]"}`}
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            후문
          </button>
          <button
            type="button"
            aria-pressed={stationView === "journey"}
            onClick={() => { setStationView("journey"); setFollowBusId(null); }}
            className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-extrabold ${stationView === "journey" ? "bg-[#1e3a8a] text-white" : "text-[#64748b]"}`}
          >
            <Route className="h-3.5 w-3.5" aria-hidden="true" />
            신창역 노선
          </button>
        </div>
      ) : null}
    </div>
  );
}
