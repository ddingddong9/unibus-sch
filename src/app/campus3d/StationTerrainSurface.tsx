import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { getStationTerrainHeight, stationTerrainData } from "./station-terrain";

const StationTerrainSurface = memo(function StationTerrainSurface() {
  const geometry = useMemo(() => {
    const size = stationTerrainData.size + 1800;
    const resolution = stationTerrainData.resolution + 52;
    const positions = new Float32Array(resolution * resolution * 3);
    const colors = new Float32Array(resolution * resolution * 3);
    const lowColor = new THREE.Color("#567c5b");
    const highColor = new THREE.Color("#8caf75");
    const minHeight = Math.min(...stationTerrainData.heights);
    const maxHeight = Math.max(...stationTerrainData.heights);

    for (let row = 0; row < resolution; row += 1) {
      for (let column = 0; column < resolution; column += 1) {
        const index = row * resolution + column;
        const offset = index * 3;
        const x = -size / 2 + (column / (resolution - 1)) * size;
        const z = -size / 2 + (row / (resolution - 1)) * size;
        const height = getStationTerrainHeight(x, z);
        const color = lowColor.clone().lerp(highColor, (height - minHeight) / Math.max(maxHeight - minHeight, 1));
        positions[offset] = x;
        positions[offset + 1] = height;
        positions[offset + 2] = z;
        colors[offset] = color.r;
        colors[offset + 1] = color.g;
        colors[offset + 2] = color.b;
      }
    }

    const indices: number[] = [];
    for (let row = 0; row < resolution - 1; row += 1) {
      for (let column = 0; column < resolution - 1; column += 1) {
        const topLeft = row * resolution + column;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + resolution;
        const bottomRight = bottomLeft + 1;
        indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
      }
    }

    const terrain = new THREE.BufferGeometry();
    terrain.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    terrain.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    terrain.setIndex(indices);
    terrain.computeVertexNormals();
    return terrain;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.98} metalness={0} />
    </mesh>
  );
});

export default StationTerrainSurface;
