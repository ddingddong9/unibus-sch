import { lazy, Suspense, useMemo, useState } from "react";
import Campus3DScene, {
  campusData,
  type CampusInitialView,
  type CampusLiveBus,
} from "../campus3d/Campus3DScene";
import { projectCoordinate } from "../campus3d/campus-geometry";
import { stationCorridorData } from "../campus3d/station-corridor";
import type { CampusStop, Point2D } from "../campus3d/types";

const StationShuttle3DScene = lazy(() => import("../campus3d/StationShuttle3DScene"));

interface Shuttle3DMapProps {
  sceneMode: "campus" | "station";
  routePath: [number, number][];
  stops: Array<{ id: string; name: string; position: { lat: number; lng: number } }>;
  buses: Array<{
    id: string;
    label: string;
    position: { lat: number; lng: number };
    heading?: number;
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
  const projectionOrigin = sceneMode === "station" ? stationCorridorData.origin : campusData.origin;
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
    })),
    [stops],
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
      };
    }),
    [buses, projectedRoute, projectionOrigin],
  );
  const initialView = useMemo<CampusInitialView | null>(() => {
    const points = projectedRoute.length > 1
      ? projectedRoute
      : projectedStops.map((stop) => projectCoordinate(stop.latitude, stop.longitude, campusData.origin));
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
  }, [projectedRoute, projectedStops]);

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

  if (sceneMode === "station") {
    return (
      <Suspense fallback={<div className="grid h-full place-items-center bg-[#e8edf1] text-sm font-bold text-[#1e3a8a]">신창역 3D 지도를 준비 중입니다</div>}>
        <StationShuttle3DScene
          routePath={projectedRoute}
          routeStops={projectedStops}
          liveBuses={liveBuses}
          initialView={initialView}
          followBusId={followBusId}
          selectedStopId={selectedStopId}
          onFollowBus={setFollowBusId}
          onSelectStop={handleSelectStop}
          resetVersion={0}
        />
      </Suspense>
    );
  }

  return (
    <Campus3DScene
      isNight={false}
      isRunning
      autoRotate={false}
      showRoute
      selectedBuildingId={null}
      focusTarget={null}
      routePath={projectedRoute}
      routeStops={projectedStops}
      liveBuses={liveBuses.length > 0 ? liveBuses : undefined}
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
  );
}
