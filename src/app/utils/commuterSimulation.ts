export interface CommuterSimulationBus {
  position: { lat: number; lng: number };
  heading: number;
  etaMins: number;
  isSimulation: true;
}

interface MetricPoint { x: number; y: number }

const METERS_PER_DEGREE = 111_320;

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

export function parseDurationMinutes(duration?: string) {
  const matched = String(duration || "").match(/(\d+)/);
  return matched ? Math.max(10, Number(matched[1])) : 70;
}

export function simulateCommuterBus(
  routeId: string,
  path: [number, number][],
  nowMs: number,
  durationMinutes: number,
): CommuterSimulationBus | null {
  if (path.length < 2) return null;
  const latitudeOrigin = path.reduce((sum, [, lat]) => sum + lat, 0) / path.length;
  const longitudeOrigin = path.reduce((sum, [lng]) => sum + lng, 0) / path.length;
  const points: MetricPoint[] = path.map(([lng, lat]) => ({
    x: (lng - longitudeOrigin) * METERS_PER_DEGREE * Math.cos(latitudeOrigin * Math.PI / 180),
    y: (lat - latitudeOrigin) * METERS_PER_DEGREE,
  }));
  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulative.push(cumulative[index - 1] + Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    ));
  }
  const totalMeters = cumulative[cumulative.length - 1];
  if (totalMeters <= 0) return null;

  const tripMs = Math.max(10, durationMinutes) * 60_000;
  const staggerMs = (hash(routeId) % 60) / 100 * tripMs;
  const elapsed = (nowMs + staggerMs) % tripMs;
  const progress = elapsed / tripMs;
  const distance = progress * totalMeters;
  let segment = cumulative.findIndex((value) => value >= distance);
  if (segment <= 0) segment = 1;
  const segmentLength = cumulative[segment] - cumulative[segment - 1] || 1;
  const ratio = (distance - cumulative[segment - 1]) / segmentLength;
  const [fromLng, fromLat] = path[segment - 1];
  const [toLng, toLat] = path[segment];

  return {
    position: {
      lat: fromLat + (toLat - fromLat) * ratio,
      lng: fromLng + (toLng - fromLng) * ratio,
    },
    heading: (Math.atan2(toLng - fromLng, toLat - fromLat) * 180 / Math.PI + 360) % 360,
    etaMins: Math.max(1, Math.ceil((tripMs - elapsed) / 60_000)),
    isSimulation: true,
  };
}
