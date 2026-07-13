import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ORIGIN = { lat: 36.7702, lng: 126.9423 };
const SIZE_METERS = 2600;
const RESOLUTION = 81;
const TILE_ZOOM = 15;
const TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
const metersPerLongitude = 111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const tileCache = new Map();

function unproject(x, z) {
  return { lat: ORIGIN.lat - z / 110_540, lng: ORIGIN.lng + x / metersPerLongitude };
}

function tilePosition(lat, lng) {
  const scale = 2 ** TILE_ZOOM;
  const radians = (lat * Math.PI) / 180;
  const worldX = ((lng + 180) / 360) * scale;
  const worldY = (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * scale;
  return {
    tileX: Math.floor(worldX),
    tileY: Math.floor(worldY),
    pixelX: Math.min(255, Math.max(0, Math.floor((worldX % 1) * 256))),
    pixelY: Math.min(255, Math.max(0, Math.floor((worldY % 1) * 256))),
  };
}

async function getTile(tileX, tileY) {
  const key = `${tileX}/${tileY}`;
  const cached = tileCache.get(key);
  if (cached) return cached;
  const request = (async () => {
    const response = await fetch(`${TILE_URL}/${TILE_ZOOM}/${tileX}/${tileY}.png`);
    if (!response.ok) throw new Error(`Terrain tile request failed: ${response.status} (${key})`);
    return sharp(Buffer.from(await response.arrayBuffer())).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  })();
  tileCache.set(key, request);
  return request;
}

async function sampleElevation(x, z) {
  const { lat, lng } = unproject(x, z);
  const { tileX, tileY, pixelX, pixelY } = tilePosition(lat, lng);
  const { data, info } = await getTile(tileX, tileY);
  const offset = (pixelY * info.width + pixelX) * info.channels;
  return data[offset] * 256 + data[offset + 1] + data[offset + 2] / 256 - 32_768;
}

const rawHeights = [];
for (let row = 0; row < RESOLUTION; row += 1) {
  const z = -SIZE_METERS / 2 + (row / (RESOLUTION - 1)) * SIZE_METERS;
  const samples = [];
  for (let column = 0; column < RESOLUTION; column += 1) {
    const x = -SIZE_METERS / 2 + (column / (RESOLUTION - 1)) * SIZE_METERS;
    samples.push(sampleElevation(x, z));
  }
  rawHeights.push(...await Promise.all(samples));
}

const smoothed = rawHeights.map((height, index) => {
  const row = Math.floor(index / RESOLUTION);
  const column = index % RESOLUTION;
  let total = height * 4;
  let weight = 4;
  for (const [rowOffset, columnOffset] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nextRow = row + rowOffset;
    const nextColumn = column + columnOffset;
    if (nextRow < 0 || nextRow >= RESOLUTION || nextColumn < 0 || nextColumn >= RESOLUTION) continue;
    total += rawHeights[nextRow * RESOLUTION + nextColumn];
    weight += 1;
  }
  return total / weight;
});
const centerIndex = Math.floor(RESOLUTION / 2) * RESOLUTION + Math.floor(RESOLUTION / 2);
const baseElevation = smoothed[centerIndex];
const heights = smoothed.map((height) => Number((height - baseElevation).toFixed(2)));
const sourceMin = Math.min(...smoothed);
const sourceMax = Math.max(...smoothed);
const output = {
  source: "Mapzen Terrarium elevation tiles hosted by AWS Open Data",
  attribution: "Elevation data: Mapzen/AWS Open Data",
  generatedAt: new Date().toISOString(),
  origin: ORIGIN,
  size: SIZE_METERS,
  resolution: RESOLUTION,
  baseElevation: Number(baseElevation.toFixed(2)),
  sourceRange: [Number(sourceMin.toFixed(2)), Number(sourceMax.toFixed(2))],
  heights,
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "src/app/campus3d/station-terrain-data.json");
await writeFile(outputPath, `${JSON.stringify(output)}\n`, "utf8");
console.log(`Generated ${RESOLUTION}x${RESOLUTION} station terrain from ${tileCache.size} elevation tiles.`);
console.log(outputPath);
