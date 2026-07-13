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

function pointInPolygon(point: Point2D, polygon: Point2D[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [x, z] = polygon[index];
    const [previousX, previousZ] = polygon[previous];
    const intersects =
      z > point[1] !== previousZ > point[1] &&
      point[0] < ((previousX - x) * (point[1] - z)) / (previousZ - z || Number.EPSILON) + x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceSquared(a: Point2D, b: Point2D) {
  const x = a[0] - b[0];
  const z = a[1] - b[1];
  return x * x + z * z;
}

export function createTreePositions(data: CampusData, count = 210): Point2D[] {
  const xs = data.boundary.map(([x]) => x);
  const zs = data.boundary.map(([, z]) => z);
  const bounds = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
  const buildingCenters = data.buildings.map((building) => {
    const center = polygonCenter(building.points);
    return {
      center,
      radius: Math.max(10, ...building.points.map((point) => Math.sqrt(distanceSquared(point, center)))),
    };
  });

  let seed = 20_260_713;
  const random = () => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };

  const positions: Point2D[] = [];
  let attempts = 0;
  while (positions.length < count && attempts < count * 30) {
    attempts += 1;
    const candidate: Point2D = [
      bounds.minX + random() * (bounds.maxX - bounds.minX),
      bounds.minZ + random() * (bounds.maxZ - bounds.minZ),
    ];
    if (!pointInPolygon(candidate, data.boundary)) continue;
    if (buildingCenters.some(({ center, radius }) => distanceSquared(candidate, center) < (radius + 8) ** 2)) continue;
    positions.push(candidate);
  }
  return positions;
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
  const orderedStops = [...stopPoints, stopPoints[0]];
  const route: Point2D[] = [];

  for (let index = 1; index < orderedStops.length; index += 1) {
    const start = closestNode(orderedStops[index - 1], keys);
    const end = closestNode(orderedStops[index], keys);
    const segment = shortestPath(graph, start, end);
    route.push(...(route.length > 0 ? segment.slice(1) : segment));
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
