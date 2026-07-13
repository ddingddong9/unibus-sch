export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface EtaBus {
  id: string;
  label: string;
  position: RouteCoordinate;
  speed?: number | null;
  timestamp?: string | null;
}

export interface EtaStop extends RouteCoordinate {
  id: string;
  order: number;
}

export type ArrivalState = "arriving" | "scheduled" | "waiting" | "stale";

export interface StopArrivalEstimate {
  busId: string | null;
  busLabel: string | null;
  minutes: number | null;
  distanceMeters: number | null;
  state: ArrivalState;
}

interface MetricPoint {
  x: number;
  y: number;
}

interface RouteProjection {
  progressMeters: number;
  distanceFromRouteMeters: number;
}

interface RouteMetric {
  points: MetricPoint[];
  cumulative: number[];
  totalMeters: number;
  latitudeOrigin: number;
  longitudeOrigin: number;
}

const EARTH_METERS_PER_DEGREE = 111_320;
const LOCATION_STALE_MS = 45_000;
const MAX_ROUTE_SNAP_METERS = 220;

function toMetric(point: RouteCoordinate, latitudeOrigin: number, longitudeOrigin: number): MetricPoint {
  return {
    x: (point.lng - longitudeOrigin) * EARTH_METERS_PER_DEGREE * Math.cos((latitudeOrigin * Math.PI) / 180),
    y: (point.lat - latitudeOrigin) * EARTH_METERS_PER_DEGREE,
  };
}

function createRouteMetric(path: [number, number][]): RouteMetric | null {
  if (path.length < 2) return null;
  const latitudeOrigin = path.reduce((sum, [, lat]) => sum + lat, 0) / path.length;
  const longitudeOrigin = path.reduce((sum, [lng]) => sum + lng, 0) / path.length;
  const points = path.map(([lng, lat]) => toMetric({ lat, lng }, latitudeOrigin, longitudeOrigin));
  const cumulative = [0];

  for (let index = 1; index < points.length; index += 1) {
    cumulative.push(cumulative[index - 1] + Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    ));
  }

  return {
    points,
    cumulative,
    totalMeters: cumulative[cumulative.length - 1],
    latitudeOrigin,
    longitudeOrigin,
  };
}

function projectToRoute(point: RouteCoordinate, route: RouteMetric): RouteProjection {
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

  return {
    progressMeters,
    distanceFromRouteMeters: Math.sqrt(nearestDistanceSquared),
  };
}

function isFresh(timestamp?: string | null) {
  if (!timestamp) return false;
  const updatedAt = new Date(timestamp).getTime();
  return Number.isFinite(updatedAt) && Date.now() - updatedAt <= LOCATION_STALE_MS;
}

function isClosedRoute(path: [number, number][], route: RouteMetric) {
  if (path.length < 3) return false;
  const first = route.points[0];
  const last = route.points[route.points.length - 1];
  return Math.hypot(first.x - last.x, first.y - last.y) <= 40;
}

export function estimateStopArrivals(
  path: [number, number][],
  stops: EtaStop[],
  buses: EtaBus[],
  options: { loop?: boolean; fallbackSpeedMps?: number } = {},
): Map<string, StopArrivalEstimate> {
  const route = createRouteMetric(path);
  const estimates = new Map<string, StopArrivalEstimate>();
  const fallbackSpeed = Math.max(2.5, options.fallbackSpeedMps ?? 6.2);

  if (!route || route.totalMeters <= 0) {
    stops.forEach((stop) => estimates.set(stop.id, {
      busId: null,
      busLabel: null,
      minutes: null,
      distanceMeters: null,
      state: "waiting",
    }));
    return estimates;
  }

  const loop = options.loop ?? isClosedRoute(path, route);
  const projectedBuses = buses.map((bus) => ({
    bus,
    fresh: isFresh(bus.timestamp),
    projection: projectToRoute(bus.position, route),
  }));

  stops.forEach((stop) => {
    const stopProjection = projectToRoute(stop, route);
    let best: StopArrivalEstimate | null = null;
    let hasStaleBus = false;

    projectedBuses.forEach(({ bus, fresh, projection }) => {
      if (!fresh) {
        hasStaleBus = true;
        return;
      }
      if (projection.distanceFromRouteMeters > MAX_ROUTE_SNAP_METERS) return;

      let remainingMeters = stopProjection.progressMeters - projection.progressMeters;
      if (loop && remainingMeters < -15) remainingMeters += route.totalMeters;
      if (!loop && remainingMeters < -25) return;
      remainingMeters = Math.max(0, remainingMeters);

      const reportedSpeed = Number(bus.speed);
      const effectiveSpeed = Number.isFinite(reportedSpeed) && reportedSpeed >= 1.4
        ? Math.min(22, Math.max(fallbackSpeed * 0.65, reportedSpeed))
        : fallbackSpeed;
      const minutes = Math.max(1, Math.ceil((remainingMeters / effectiveSpeed + 20) / 60));
      const estimate: StopArrivalEstimate = {
        busId: bus.id,
        busLabel: bus.label,
        minutes,
        distanceMeters: Math.round(remainingMeters),
        state: remainingMeters <= 140 || minutes <= 2 ? "arriving" : "scheduled",
      };

      if (!best || (estimate.distanceMeters ?? Infinity) < (best.distanceMeters ?? Infinity)) best = estimate;
    });

    estimates.set(stop.id, best ?? {
      busId: null,
      busLabel: null,
      minutes: null,
      distanceMeters: null,
      state: hasStaleBus ? "stale" : "waiting",
    });
  });

  return estimates;
}
