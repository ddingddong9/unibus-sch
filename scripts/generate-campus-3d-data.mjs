import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CAMPUS_WAY_ID = 415747260;
const ORIGIN = { lat: 36.76995, lng: 126.93155 };
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const query = `[out:json][timeout:40];
way(${CAMPUS_WAY_ID})->.campusWay;
.campusWay map_to_area->.campus;
(
  .campusWay;
  way(area.campus)[building];
  way(area.campus)[highway];
  way(area.campus)[leisure];
  way(area.campus)[natural=water];
);
out geom;`;

const response = await fetch(OVERPASS_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "User-Agent": "UNIBUS-campus-prototype/1.0",
  },
  body: new URLSearchParams({ data: query }),
});

if (!response.ok) {
  throw new Error(`OpenStreetMap data request failed: ${response.status}`);
}

const source = await response.json();
const metersPerLongitude = 111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const project = ({ lat, lon }) => [
  Number(((lon - ORIGIN.lng) * metersPerLongitude).toFixed(2)),
  Number((-(lat - ORIGIN.lat) * 110_540).toFixed(2)),
];

const cleanGeometry = (element) => {
  const points = (element.geometry ?? []).map(project);
  if (points.length > 2) {
    const [firstX, firstZ] = points[0];
    const [lastX, lastZ] = points.at(-1);
    if (firstX === lastX && firstZ === lastZ) points.pop();
  }
  return points;
};

const deterministicHeight = (element) => {
  const tags = element.tags ?? {};
  const explicitHeight = Number.parseFloat(tags.height);
  if (Number.isFinite(explicitHeight)) return Math.min(Math.max(explicitHeight, 3), 48);

  const levels = Number.parseFloat(tags["building:levels"]);
  if (Number.isFinite(levels)) return Math.min(Math.max(levels * 3.4, 3.5), 48);

  const name = tags.name ?? "";
  if (/생활관|학성사|글로벌빌리지/.test(name)) return 28 + (element.id % 3) * 3;
  if (/도서관|유니토피아|의료과학|공과대학/.test(name)) return 20 + (element.id % 3) * 2;
  if (/체육관|공연장/.test(name)) return 12;
  return 10 + (element.id % 4) * 2.2;
};

const roadWidth = (type) => {
  if (["primary", "secondary", "tertiary"].includes(type)) return 8;
  if (["residential", "service", "unclassified"].includes(type)) return 5.5;
  if (["pedestrian", "living_street"].includes(type)) return 3.8;
  return 1.8;
};

const elements = source.elements ?? [];
const boundary = elements.find((element) => element.id === CAMPUS_WAY_ID);
const buildings = elements
  .filter((element) => element.tags?.building && element.id !== CAMPUS_WAY_ID)
  .map((element) => ({
    id: String(element.id),
    name: element.tags.name ?? "캠퍼스 건물",
    points: cleanGeometry(element),
    height: Number(deterministicHeight(element).toFixed(1)),
    kind: element.tags.building,
  }))
  .filter((building) => building.points.length >= 3);

const roads = elements
  .filter((element) => element.tags?.highway)
  .map((element) => ({
    id: String(element.id),
    name: element.tags.name ?? null,
    points: cleanGeometry(element),
    kind: element.tags.highway,
    width: roadWidth(element.tags.highway),
  }))
  .filter((road) => road.points.length >= 2);

const areas = elements
  .filter((element) => element.tags?.leisure || element.tags?.natural === "water")
  .map((element) => ({
    id: String(element.id),
    name: element.tags.name ?? null,
    points: cleanGeometry(element),
    kind: element.tags.natural === "water" ? "water" : element.tags.leisure,
  }))
  .filter((area) => area.points.length >= 3);

const data = {
  attribution: "Map data © OpenStreetMap contributors, ODbL 1.0",
  generatedAt: new Date().toISOString(),
  origin: ORIGIN,
  boundary: boundary ? cleanGeometry(boundary) : [],
  buildings,
  roads,
  areas,
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "src/app/campus3d/campus-data.json");
await writeFile(outputPath, `${JSON.stringify(data)}\n`, "utf8");

console.log(`Generated ${buildings.length} buildings, ${roads.length} roads, and ${areas.length} areas.`);
console.log(outputPath);
