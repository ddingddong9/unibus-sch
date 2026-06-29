export interface MotionPoint {
  lat: number;
  lng: number;
}

export interface RouteTrack {
  points: MotionPoint[];
  cumulativeMeters: number[];
  lengthMeters: number;
}

const EARTH_RADIUS_METERS = 6371000;

const toRad = (value: number) => (value * Math.PI) / 180;

const toDeg = (value: number) => (value * 180) / Math.PI;

export function distanceMeters(a: MotionPoint, b: MotionPoint) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function bearingDegrees(from: MotionPoint, to: MotionPoint) {
  const dLng = toRad(to.lng - from.lng);
  const fromLat = toRad(from.lat);
  const toLat = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function interpolatePoint(from: MotionPoint, to: MotionPoint, t: number): MotionPoint {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

export function normalizePath(points: MotionPoint[]) {
  const result: MotionPoint[] = [];
  for (const point of points) {
    const previous = result[result.length - 1];
    if (!previous || distanceMeters(previous, point) > 0.5) {
      result.push(point);
    }
  }
  return result;
}

export function createRouteTrack(points: MotionPoint[], spacingMeters = 6): RouteTrack {
  const path = normalizePath(points);
  if (path.length < 2) {
    return {
      points: path,
      cumulativeMeters: path.map(() => 0),
      lengthMeters: 0,
    };
  }

  const cumulativeMeters = [0];
  for (let i = 1; i < path.length; i += 1) {
    cumulativeMeters[i] = cumulativeMeters[i - 1] + distanceMeters(path[i - 1], path[i]);
  }

  const lengthMeters = cumulativeMeters[cumulativeMeters.length - 1];
  if (lengthMeters <= spacingMeters) {
    return { points: path, cumulativeMeters, lengthMeters };
  }

  const sampled: MotionPoint[] = [];
  for (let distance = 0; distance < lengthMeters; distance += spacingMeters) {
    sampled.push(samplePath(path, cumulativeMeters, distance));
  }
  sampled.push(path[path.length - 1]);

  const sampledCumulative = [0];
  for (let i = 1; i < sampled.length; i += 1) {
    sampledCumulative[i] = sampledCumulative[i - 1] + distanceMeters(sampled[i - 1], sampled[i]);
  }

  return {
    points: sampled,
    cumulativeMeters: sampledCumulative,
    lengthMeters: sampledCumulative[sampledCumulative.length - 1],
  };
}

export function sampleTrack(track: RouteTrack, distance: number): MotionPoint {
  return samplePath(track.points, track.cumulativeMeters, distance);
}

export function headingAtDistance(track: RouteTrack, distance: number, lookAheadMeters = 12) {
  const from = sampleTrack(track, distance);
  const to = sampleTrack(track, Math.min(distance + lookAheadMeters, track.lengthMeters));
  if (distanceMeters(from, to) < 0.5) {
    const behind = sampleTrack(track, Math.max(distance - lookAheadMeters, 0));
    return bearingDegrees(behind, from);
  }
  return bearingDegrees(from, to);
}

function samplePath(points: MotionPoint[], cumulativeMeters: number[], distance: number): MotionPoint {
  if (points.length === 0) return { lat: 0, lng: 0 };
  if (points.length === 1 || distance <= 0) return points[0];

  const total = cumulativeMeters[cumulativeMeters.length - 1];
  if (distance >= total) return points[points.length - 1];

  let low = 0;
  let high = cumulativeMeters.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (cumulativeMeters[mid] < distance) low = mid + 1;
    else high = mid;
  }

  const index = Math.max(1, low);
  const segmentStart = cumulativeMeters[index - 1];
  const segmentLength = cumulativeMeters[index] - segmentStart;
  const t = segmentLength > 0 ? (distance - segmentStart) / segmentLength : 0;
  return interpolatePoint(points[index - 1], points[index], t);
}
