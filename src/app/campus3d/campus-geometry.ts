import type { CampusBuilding, CampusData, CampusRoad, CampusStop, Point2D } from "./types";

const VEHICLE_ROADS = new Set([
  "primary",
  "secondary",
  "tertiary",
  "unclassified",
  "residential",
  "living_street",
  "service",
]);

export const CAMPUS_STOPS: CampusStop[] = [
  { id: "rear-gate", name: "후문", latitude: 36.77276, longitude: 126.933816 },
  { id: "hyang-3", name: "향설생활관 3", latitude: 36.768228, longitude: 126.935383 },
  { id: "hyang-1", name: "향설생활관 1", latitude: 36.767905, longitude: 126.932505 },
  { id: "library", name: "향설도서관", latitude: 36.768856, longitude: 126.931303 },
  { id: "main-gate", name: "정문", latitude: 36.769014, longitude: 126.927978 },
];

// East-campus road centerline checked against Google/TMap and Naver maps in July 2026.
const ROUTE_SEGMENT_OVERRIDES: Record<string, Pick<CampusStop, "latitude" | "longitude">[]> = {
  "rear-gate:hyang-3": [
    { latitude: 36.7726108, longitude: 126.9340996 },
    { latitude: 36.7721243, longitude: 126.9344026 },
    { latitude: 36.7717476, longitude: 126.9346231 },
    { latitude: 36.7715051, longitude: 126.9347296 },
    { latitude: 36.7711003, longitude: 126.9347818 },
    { latitude: 36.7708549, longitude: 126.9348346 },
    { latitude: 36.7704282, longitude: 126.934925 },
    { latitude: 36.7697665, longitude: 126.9351504 },
    { latitude: 36.7694796, longitude: 126.9353292 },
    { latitude: 36.7692444, longitude: 126.935475 },
    { latitude: 36.7690092, longitude: 126.9356096 },
    { latitude: 36.7688101, longitude: 126.9357329 },
    { latitude: 36.7686965, longitude: 126.935788 },
    { latitude: 36.76856, longitude: 126.935722 },
    { latitude: 36.7684558, longitude: 126.9354662 },
  ],
};

export const CAMPUS_OUTER_ROAD = [
  { latitude: 36.76938, longitude: 126.927631 },
  { latitude: 36.7697, longitude: 126.927521 },
  { latitude: 36.770127, longitude: 126.928039 },
  { latitude: 36.770792, longitude: 126.928952 },
  { latitude: 36.771585, longitude: 126.929795 },
  { latitude: 36.773278, longitude: 126.93132 },
  { latitude: 36.774595, longitude: 126.932422 },
  { latitude: 36.774798, longitude: 126.93261 },
  { latitude: 36.774053, longitude: 126.933208 },
  { latitude: 36.773641, longitude: 126.93354 },
  { latitude: 36.773328, longitude: 126.933792 },
  { latitude: 36.773166, longitude: 126.933923 },
  { latitude: 36.772936, longitude: 126.934107 },
  { latitude: 36.772808, longitude: 126.933885 },
];

export function projectCoordinate(
  latitude: number,
  longitude: number,
  origin: CampusData["origin"],
): Point2D {
  const metersPerLongitude = 111_320 * Math.cos((origin.lat * Math.PI) / 180);
  return [
    (longitude - origin.lng) * metersPerLongitude,
    -(latitude - origin.lat) * 110_540,
  ];
}

export function polygonCenter(points: Point2D[]): Point2D {
  if (points.length === 0) return [0, 0];
  const total = points.reduce(
    (sum, point) => [sum[0] + point[0], sum[1] + point[1]] as Point2D,
    [0, 0] as Point2D,
  );
  return [total[0] / points.length, total[1] / points.length];
}

function distanceSquared(a: Point2D, b: Point2D) {
  const x = a[0] - b[0];
  const z = a[1] - b[1];
  return x * x + z * z;
}

interface GraphEdge {
  to: string;
  weight: number;
}

const pointKey = ([x, z]: Point2D) => `${x.toFixed(2)},${z.toFixed(2)}`;
const keyPoint = (key: string): Point2D => key.split(",").map(Number) as Point2D;

function buildRoadGraph(roads: CampusRoad[]) {
  const graph = new Map<string, GraphEdge[]>();
  for (const road of roads) {
    if (!VEHICLE_ROADS.has(road.kind)) continue;
    for (let index = 1; index < road.points.length; index += 1) {
      const from = pointKey(road.points[index - 1]);
      const to = pointKey(road.points[index]);
      const weight = Math.sqrt(distanceSquared(road.points[index - 1], road.points[index]));
      graph.set(from, [...(graph.get(from) ?? []), { to, weight }]);
      graph.set(to, [...(graph.get(to) ?? []), { to: from, weight }]);
    }
  }
  return graph;
}

function closestNode(target: Point2D, keys: string[]) {
  let nearest = keys[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const key of keys) {
    const distance = distanceSquared(target, keyPoint(key));
    if (distance < nearestDistance) {
      nearest = key;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function shortestPath(graph: Map<string, GraphEdge[]>, start: string, end: string): Point2D[] {
  const distances = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, string>();
  const pending = new Set(graph.keys());

  while (pending.size > 0) {
    let current: string | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const key of pending) {
      const distance = distances.get(key) ?? Number.POSITIVE_INFINITY;
      if (distance < bestDistance) {
        current = key;
        bestDistance = distance;
      }
    }
    if (!current || current === end) break;
    pending.delete(current);
    for (const edge of graph.get(current) ?? []) {
      const nextDistance = bestDistance + edge.weight;
      if (nextDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, nextDistance);
        previous.set(edge.to, current);
      }
    }
  }

  if (!distances.has(end)) return [keyPoint(start), keyPoint(end)];
  const path = [end];
  let cursor = end;
  while (cursor !== start) {
    const parent = previous.get(cursor);
    if (!parent) break;
    path.push(parent);
    cursor = parent;
  }
  return path.reverse().map(keyPoint);
}

export function createCampusRoute(data: CampusData) {
  const graph = buildRoadGraph(data.roads);
  const keys = [...graph.keys()];
  const stopPoints = CAMPUS_STOPS.map((stop) => projectCoordinate(stop.latitude, stop.longitude, data.origin));
  const orderedStops = [...CAMPUS_STOPS, CAMPUS_STOPS[0]];
  const route: Point2D[] = [];

  for (let index = 1; index < orderedStops.length; index += 1) {
    const fromStop = orderedStops[index - 1];
    const toStop = orderedStops[index];
    const fromPoint = stopPoints[(index - 1) % stopPoints.length];
    const toPoint = stopPoints[index % stopPoints.length];
    const override = ROUTE_SEGMENT_OVERRIDES[`${fromStop.id}:${toStop.id}`];
    const segment = override
      ? [
          fromPoint,
          ...override.map((point) => projectCoordinate(point.latitude, point.longitude, data.origin)),
          toPoint,
        ]
      : shortestPath(graph, closestNode(fromPoint, keys), closestNode(toPoint, keys));
    const segmentStartsAtRouteEnd = route.length > 0 && distanceSquared(route[route.length - 1], segment[0]) < 0.01;
    route.push(...(segmentStartsAtRouteEnd ? segment.slice(1) : segment));
  }
  if (route.length > 1 && distanceSquared(route[route.length - 1], route[0]) >= 0.01) {
    route.push(route[0]);
  }
  return route;
}

export function buildingCategory(building: CampusBuilding) {
  if (/생활관|학성사|글로벌빌리지/.test(building.name)) return "생활관";
  if (/도서관/.test(building.name)) return "도서관";
  if (/체육관|공연장/.test(building.name)) return "문화·체육";
  if (/대학본부|국제교류/.test(building.name)) return "행정";
  return "교육·연구";
}
