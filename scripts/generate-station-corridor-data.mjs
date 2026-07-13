import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = { lat: 36.7702, lng: 126.9423 };
const STATION = { lat: 36.76963, lng: 126.95081 };
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];
const BBOX = "36.7667,126.9327,36.7745,126.9520";
const REFERENCE_ROUTE = [
  { lat: 36.7697643, lng: 126.9507385 },
  { lat: 36.7697065, lng: 126.9495377 },
  { lat: 36.7696199, lng: 126.9493389 },
  { lat: 36.7679666, lng: 126.946024 },
  { lat: 36.7683294, lng: 126.9430263 },
  { lat: 36.7688242, lng: 126.9401374 },
  { lat: 36.7695452, lng: 126.9378038 },
  { lat: 36.7710363, lng: 126.9362936 },
  { lat: 36.773333, lng: 126.9337622 },
  { lat: 36.7728242, lng: 126.933887 },
];

const query = `[out:json][timeout:40];
(
  way[building](${BBOX});
  way[highway](${BBOX});
  way[railway](${BBOX});
  way[public_transport](${BBOX});
  way[leisure](${BBOX});
  way[natural=water](${BBOX});
  way[amenity~"parking|bus_station"](${BBOX});
);
out geom;`;

let source;
for (const overpassUrl of OVERPASS_URLS) {
  try {
    const response = await fetch(overpassUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "UNIBUS-station-corridor/1.0",
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) continue;
    source = await response.json();
    break;
  } catch {
    // Try the next public Overpass endpoint.
  }
}
if (!source) throw new Error("OpenStreetMap data request failed on every Overpass endpoint");
const metersPerLongitude = 111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const project = ({ lat, lon, lng }) => [
  Number((((lon ?? lng) - ORIGIN.lng) * metersPerLongitude).toFixed(2)),
  Number((-(lat - ORIGIN.lat) * 110_540).toFixed(2)),
];
const route = REFERENCE_ROUTE.map(project);
const stationPoint = project(STATION);

function distanceToSegment(point, from, to) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const lengthSquared = dx * dx + dz * dz;
  const ratio = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - from[0]) * dx + (point[1] - from[1]) * dz) / lengthSquared));
  return Math.hypot(point[0] - (from[0] + dx * ratio), point[1] - (from[1] + dz * ratio));
}

function distanceToRoute(points) {
  let minimum = Number.POSITIVE_INFINITY;
  for (const point of points) {
    for (let index = 1; index < route.length; index += 1) {
      minimum = Math.min(minimum, distanceToSegment(point, route[index - 1], route[index]));
    }
  }
  return minimum;
}

function cleanGeometry(element) {
  const points = (element.geometry ?? []).map(project);
  if (points.length > 2) {
    const first = points[0];
    const last = points.at(-1);
    if (first[0] === last[0] && first[1] === last[1]) points.pop();
  }
  return points;
}

function deterministicHeight(element) {
  const tags = element.tags ?? {};
  const explicit = Number.parseFloat(tags.height);
  if (Number.isFinite(explicit)) return Math.min(Math.max(explicit, 3), 36);
  const levels = Number.parseFloat(tags["building:levels"]);
  if (Number.isFinite(levels)) return Math.min(Math.max(levels * 3.2, 3.5), 36);
  if (tags.building === "apartments") return 18 + (element.id % 3) * 2;
  if (tags.building === "university" || tags.building === "dormitory") return 14 + (element.id % 3) * 2;
  if (tags.building === "house") return 7 + (element.id % 2) * 1.5;
  return 8 + (element.id % 4) * 1.6;
}

function roadWidth(kind) {
  if (["trunk", "primary"].includes(kind)) return 9;
  if (["secondary", "tertiary"].includes(kind)) return 7;
  if (["residential", "service", "unclassified"].includes(kind)) return 4.8;
  return 2;
}

const elements = source.elements ?? [];
const geometries = elements.map((element) => ({ element, points: cleanGeometry(element) }));
const buildings = geometries
  .filter(({ element, points }) => element.tags?.building && points.length >= 3 && distanceToRoute(points) <= 125)
  .map(({ element, points }) => ({
    id: String(element.id),
    name: element.tags.name ?? "경로 주변 건물",
    points,
    height: Number(deterministicHeight(element).toFixed(1)),
    kind: element.tags.building,
  }));
const roads = geometries
  .filter(({ element, points }) => element.tags?.highway && points.length >= 2 && distanceToRoute(points) <= 90)
  .map(({ element, points }) => ({
    id: String(element.id),
    name: element.tags.name ?? null,
    points,
    kind: element.tags.highway,
    width: roadWidth(element.tags.highway),
  }));
const areas = geometries
  .filter(({ element, points }) => (
    element.tags?.leisure || element.tags?.natural === "water" || ["parking", "bus_station"].includes(element.tags?.amenity)
  ) && points.length >= 3 && distanceToRoute(points) <= 135)
  .map(({ element, points }) => ({
    id: String(element.id),
    name: element.tags.name ?? null,
    points,
    kind: element.tags.natural === "water" ? "water" : element.tags.leisure ?? element.tags.amenity,
  }));
const railways = geometries
  .filter(({ element, points }) => element.tags?.railway === "rail" && points.length >= 2 && distanceToRoute([stationPoint, ...points]) <= 420)
  .filter(({ points }) => points.some((point) => Math.hypot(point[0] - stationPoint[0], point[1] - stationPoint[1]) <= 430))
  .map(({ element, points }) => ({ id: String(element.id), name: element.tags.name ?? null, points, kind: "rail", width: 1.5 }));
const platforms = geometries
  .filter(({ element, points }) => element.tags?.railway === "platform" && points.length >= 3)
  .map(({ element, points }) => ({ id: String(element.id), name: element.tags.name ?? element.tags.ref ?? null, points, kind: "platform" }));

const output = {
  attribution: "Map data © OpenStreetMap contributors, ODbL 1.0",
  generatedAt: new Date().toISOString(),
  origin: ORIGIN,
  boundary: [],
  buildings,
  roads,
  areas,
  railways,
  platforms,
  station: STATION,
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "src/app/campus3d/station-corridor-data.json");
await writeFile(outputPath, `${JSON.stringify(output)}\n`, "utf8");
console.log(`Generated station corridor with ${buildings.length} buildings, ${roads.length} roads, ${railways.length} rail lines, and ${platforms.length} platforms.`);
console.log(outputPath);
