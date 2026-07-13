import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight, terrainData } from "./terrain";

const TerrainSurface = memo(function TerrainSurface({ isNight }: { isNight: boolean }) {
  const geometry = useMemo(() => {
    const { heights, resolution: sourceResolution, size: sourceSize } = terrainData;
    const size = sourceSize + 2800;
    const resolution = sourceResolution + 84;
    const positions = new Float32Array(resolution * resolution * 3);
    const colors = new Float32Array(resolution * resolution * 3);
    const lowColor = new THREE.Color(isNight ? "#111c1a" : "#9eaa8b");
    const highColor = new THREE.Color(isNight ? "#26332f" : "#c3c7ab");
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);

    for (let row = 0; row < resolution; row += 1) {
      for (let column = 0; column < resolution; column += 1) {
        const index = row * resolution + column;
        const offset = index * 3;
        const x = -size / 2 + (column / (resolution - 1)) * size;
        const z = -size / 2 + (row / (resolution - 1)) * size;
        const height = getTerrainHeight(x, z);
        positions[offset] = x;
        positions[offset + 1] = height;
        positions[offset + 2] = z;
        const ratio = (height - minHeight) / Math.max(maxHeight - minHeight, 1);
        const color = lowColor.clone().lerp(highColor, ratio);
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
  }, [isNight]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.98} metalness={0} />
    </mesh>
  );
});

export default TerrainSurface;
