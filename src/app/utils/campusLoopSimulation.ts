export interface CampusLoopSimulationStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

export interface CampusLoopSimulationBus {
  id: string;
  label: string;
  position: { lat: number; lng: number };
  heading: number;
  speed: number;
  timestamp: string;
  etaLabel: string;
  isSimulation: true;
}

export interface CampusLoopSimulationResult {
  buses: CampusLoopSimulationBus[];
  stopDepartures: Map<string, string>;
}

interface MetricPoint {
  x: number;
  y: number;
}

interface RouteMetric {
  path: [number, number][];
  points: MetricPoint[];
  cumulative: number[];
  totalMeters: number;
  latitudeOrigin: number;
  longitudeOrigin: number;
}

const EARTH_METERS_PER_DEGREE = 111_320;
const DEFAULT_INTERVAL_MINUTES = 10;
const DEFAULT_LOOP_DURATION_MINUTES = 30;
const VEHICLE_COUNT = 3;

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function toMetric(
  point: { lat: number; lng: number },
  latitudeOrigin: number,
  longitudeOrigin: number,
): MetricPoint {
  return {
    x: (point.lng - longitudeOrigin) * EARTH_METERS_PER_DEGREE * Math.cos((latitudeOrigin * Math.PI) / 180),
    y: (point.lat - latitudeOrigin) * EARTH_METERS_PER_DEGREE,
  };
}

function createRouteMetric(inputPath: [number, number][]): RouteMetric | null {
  if (inputPath.length < 2) return null;
  const path = [...inputPath];
  const latitudeOrigin = path.reduce((sum, [, lat]) => sum + lat, 0) / path.length;
  const longitudeOrigin = path.reduce((sum, [lng]) => sum + lng, 0) / path.length;
  const first = toMetric({ lat: path[0][1], lng: path[0][0] }, latitudeOrigin, longitudeOrigin);
  const lastPoint = path[path.length - 1];
  const last = toMetric({ lat: lastPoint[1], lng: lastPoint[0] }, latitudeOrigin, longitudeOrigin);
  if (Math.hypot(first.x - last.x, first.y - last.y) > 8) path.push(path[0]);

  const points = path.map(([lng, lat]) => toMetric({ lat, lng }, latitudeOrigin, longitudeOrigin));
  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulative.push(cumulative[index - 1] + Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    ));
  }
  const totalMeters = cumulative[cumulative.length - 1];
  if (totalMeters <= 0) return null;
  return { path, points, cumulative, totalMeters, latitudeOrigin, longitudeOrigin };
}

function projectToRoute(point: { lat: number; lng: number }, route: RouteMetric) {
  const metricPoint = toMetric(point, route.latitudeOrigin, route.longitudeOrigin);
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;
  let progressMeters = 0;

  for (let index = 1; index < route.points.length; index += 1) {
    const from = route.points[index - 1];
    const to = route.points[index];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((metricPoint.x - from.x) * dx + (metricPoint.y - from.y) * dy) / lengthSquared));
    const projectedX = from.x + dx * ratio;
    const projectedY = from.y + dy * ratio;
    const distanceSquared = (metricPoint.x - projectedX) ** 2 + (metricPoint.y - projectedY) ** 2;
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      progressMeters = route.cumulative[index - 1] + Math.sqrt(lengthSquared) * ratio;
    }
  }
  return progressMeters;
}

function sampleRoute(route: RouteMetric, distanceMeters: number) {
  const distance = ((distanceMeters % route.totalMeters) + route.totalMeters) % route.totalMeters;
  let index = route.cumulative.findIndex((value) => value >= distance);
  if (index <= 0) index = 1;
  const fromDistance = route.cumulative[index - 1];
  const segmentDistance = route.cumulative[index] - fromDistance || 1;
  const ratio = (distance - fromDistance) / segmentDistance;
  const [fromLng, fromLat] = route.path[index - 1];
  const [toLng, toLat] = route.path[index];
  return {
    position: {
      lat: fromLat + (toLat - fromLat) * ratio,
      lng: fromLng + (toLng - fromLng) * ratio,
    },
    heading: (Math.atan2(toLng - fromLng, toLat - fromLat) * 180 / Math.PI + 360) % 360,
  };
}

function nextStopEta(
  busDistance: number,
  stops: Array<CampusLoopSimulationStop & { progressMeters: number }>,
  route: RouteMetric,
  durationMinutes: number,
) {
  const candidates = stops.map((stop) => {
    let distance = stop.progressMeters - busDistance;
    if (distance <= 8) distance += route.totalMeters;
    return { stop, distance };
  });
  candidates.sort((left, right) => left.distance - right.distance);
  const next = candidates[0];
  const minutes = Math.max(1, Math.ceil((next.distance / route.totalMeters) * durationMinutes));
  return `${next.stop.name} ${minutes}분`;
}

export function simulateCampusLoop(
  path: [number, number][],
  stops: CampusLoopSimulationStop[],
  nowMs: number,
  intervalMinutes = DEFAULT_INTERVAL_MINUTES,
): CampusLoopSimulationResult {
  const route = createRouteMetric(path);
  if (!route || stops.length === 0) return { buses: [], stopDepartures: new Map() };

  const safeIntervalMinutes = Math.max(1, intervalMinutes);
  const durationMinutes = Math.max(DEFAULT_LOOP_DURATION_MINUTES, safeIntervalMinutes * VEHICLE_COUNT);
  const intervalMs = safeIntervalMinutes * 60_000;
  const durationMs = durationMinutes * 60_000;
  const serviceStart = new Date(nowMs);
  serviceStart.setHours(6, 0, 0, 0);
  const anchor = serviceStart.getTime();
  const latestDepartureIndex = Math.floor((nowMs - anchor) / intervalMs);
  const projectedStops = [...stops]
    .sort((left, right) => left.order - right.order)
    .map((stop) => ({ ...stop, progressMeters: projectToRoute(stop, route) }));

  const buses = Array.from({ length: VEHICLE_COUNT }, (_, offset) => {
    const departureIndex = latestDepartureIndex - offset;
    const departureAt = anchor + departureIndex * intervalMs;
    const elapsed = ((nowMs - departureAt) % durationMs + durationMs) % durationMs;
    const progress = elapsed / durationMs;
    const distance = progress * route.totalMeters;
    const sample = sampleRoute(route, distance);
    const slot = ((departureIndex % VEHICLE_COUNT) + VEHICLE_COUNT) % VEHICLE_COUNT;
    return {
      id: `campus-simulation-${slot + 1}`,
      label: `학내순환 ${slot + 1}호`,
      position: sample.position,
      heading: sample.heading,
      speed: route.totalMeters / (durationMs / 1000),
      timestamp: new Date(nowMs).toISOString(),
      etaLabel: nextStopEta(distance, projectedStops, route, durationMinutes),
      isSimulation: true as const,
    };
  }).sort((left, right) => left.id.localeCompare(right.id));

  const stopDepartures = new Map<string, string>();
  projectedStops.forEach((stop) => {
    const offsetMs = (stop.progressMeters / route.totalMeters) * durationMs;
    const nextIndex = Math.ceil((nowMs - anchor - offsetMs) / intervalMs);
    const arrivalAt = anchor + nextIndex * intervalMs + offsetMs;
    const dwellMs = stop.progressMeters <= 8 ? 0 : 45_000;
    stopDepartures.set(stop.id, `출발 ${timeFormatter.format(new Date(arrivalAt + dwellMs))}`);
  });

  return { buses, stopDepartures };
}
