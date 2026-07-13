import terrainDataSource from "./terrain-data.json";
import * as THREE from "three";

interface TerrainData {
  source: string;
  attribution: string;
  generatedAt: string;
  origin: { lat: number; lng: number };
  size: number;
  resolution: number;
  baseElevation: number;
  sourceRange: [number, number];
  heights: number[];
}

export const terrainData = terrainDataSource as TerrainData;

export function getTerrainHeight(x: number, z: number) {
  const { size, resolution, heights } = terrainData;
  const normalizedX = Math.min(1, Math.max(0, x / size + 0.5));
  const normalizedZ = Math.min(1, Math.max(0, z / size + 0.5));
  const gridX = normalizedX * (resolution - 1);
  const gridZ = normalizedZ * (resolution - 1);
  const x0 = Math.floor(gridX);
  const z0 = Math.floor(gridZ);
  const x1 = Math.min(x0 + 1, resolution - 1);
  const z1 = Math.min(z0 + 1, resolution - 1);
  const tx = gridX - x0;
  const tz = gridZ - z0;
  const top = THREE.MathUtils.lerp(heights[z0 * resolution + x0], heights[z0 * resolution + x1], tx);
  const bottom = THREE.MathUtils.lerp(heights[z1 * resolution + x0], heights[z1 * resolution + x1], tx);
  return THREE.MathUtils.lerp(top, bottom, tz);
}
