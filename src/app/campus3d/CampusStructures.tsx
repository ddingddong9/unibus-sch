import { memo, useMemo } from "react";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { CAMPUS_STOPS, polygonCenter, projectCoordinate } from "./campus-geometry";
import type { CampusArea, CampusData, Point2D } from "./types";

interface CampusStructuresProps {
  data: CampusData;
  route: Point2D[];
  isNight: boolean;
}

interface AreaMetrics {
  center: Point2D;
  width: number;
  depth: number;
  rotation: number;
}

function getAreaMetrics(points: Point2D[]): AreaMetrics {
  const center = polygonCenter(points);
  let longest = { length: 0, dx: 1, dz: 0 };
  for (let index = 0; index < points.length; index += 1) {
    const from = points[index];
    const to = points[(index + 1) % points.length];
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.hypot(dx, dz);
    if (length > longest.length) longest = { length, dx, dz };
  }
  const ux = longest.dx / longest.length;
  const uz = longest.dz / longest.length;
  const vx = -uz;
  const vz = ux;
  const local = points.map(([x, z]) => {
    const offsetX = x - center[0];
    const offsetZ = z - center[1];
    return [offsetX * ux + offsetZ * uz, offsetX * vx + offsetZ * vz] as Point2D;
  });
  const xs = local.map(([x]) => x);
  const zs = local.map(([, z]) => z);
  return {
    center,
    width: Math.max(...xs) - Math.min(...xs),
    depth: Math.max(...zs) - Math.min(...zs),
    rotation: -Math.atan2(uz, ux),
  };
}

function routeHeading(route: Point2D[], target: Point2D) {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestHeading = 0;
  for (let index = 1; index < route.length; index += 1) {
    const from = route[index - 1];
    const to = route[index];
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const lengthSquared = dx * dx + dz * dz || 1;
    const projection = Math.max(0, Math.min(1, ((target[0] - from[0]) * dx + (target[1] - from[1]) * dz) / lengthSquared));
    const nearestX = from[0] + dx * projection;
    const nearestZ = from[1] + dz * projection;
    const distance = (target[0] - nearestX) ** 2 + (target[1] - nearestZ) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestHeading = Math.atan2(dx, dz);
    }
  }
  return bestHeading;
}

const CampusGate = memo(function CampusGate({
  position,
  rotation,
  variant,
  isNight,
}: {
  position: Point2D;
  rotation: number;
  variant: "main" | "rear";
  isNight: boolean;
}) {
  const isMain = variant === "main";
  const width = isMain ? 38 : 22;
  const height = isMain ? 16 : 7.5;
  const archGeometry = useMemo(() => {
    if (!isMain) return null;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-width / 2, 1, 0),
      new THREE.Vector3(-width * 0.28, height * 0.76, 0),
      new THREE.Vector3(0, height, 0),
      new THREE.Vector3(width * 0.28, height * 0.76, 0),
      new THREE.Vector3(width / 2, 1, 0),
    ], false, "centripetal");
    return new THREE.TubeGeometry(curve, 48, 0.85, 8, false);
  }, [height, isMain, width]);

  const structureColor = isNight ? "#d8e5f0" : "#f8fafc";
  return (
    <group position={[position[0], 0.5, position[1]]} rotation={[0, rotation, 0]}>
      {isMain && archGeometry ? (
        <>
          <mesh geometry={archGeometry} position={[0, 0, -2.3]} castShadow>
            <meshStandardMaterial color={structureColor} metalness={0.12} roughness={0.48} />
          </mesh>
          <mesh geometry={archGeometry} position={[0, 0, 2.3]} castShadow>
            <meshStandardMaterial color={structureColor} metalness={0.12} roughness={0.48} />
          </mesh>
          <mesh position={[0, height * 0.73, 0]} castShadow>
            <boxGeometry args={[18, 2.5, 5.6]} />
            <meshStandardMaterial color={structureColor} roughness={0.42} />
          </mesh>
        </>
      ) : (
        <>
          {[-width / 2, width / 2].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, height / 2, 0]} castShadow>
                <boxGeometry args={[3.8, height, 5.2]} />
                <meshStandardMaterial color={isNight ? "#747b80" : "#b8b5ad"} roughness={0.9} />
              </mesh>
              <mesh position={[0, height + 0.35, 0]} castShadow>
                <boxGeometry args={[4.6, 0.7, 6]} />
                <meshStandardMaterial color={isNight ? "#c7d1da" : "#e9e7e1"} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, height - 1, 0]} castShadow>
            <boxGeometry args={[width - 2.5, 2.3, 2.2]} />
            <meshStandardMaterial color={isNight ? "#343c43" : "#4b5357"} metalness={0.2} />
          </mesh>
          <group position={[width / 2 + 5.5, 0, -6.5]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[7, 4.4, 6]} />
              <meshStandardMaterial color={structureColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, 3, 3.05]}>
              <planeGeometry args={[5.4, 1.5]} />
              <meshStandardMaterial color="#5ba8c9" emissive="#2a789c" emissiveIntensity={isNight ? 0.65 : 0.1} />
            </mesh>
          </group>
        </>
      )}
      <Html position={[0, height + 4.5, 0]} center distanceFactor={330} zIndexRange={[14, 0]}>
        <div className="whitespace-nowrap border border-white/30 bg-slate-950/82 px-2 py-1 text-[10px] font-black text-white shadow-md backdrop-blur-md">
          {isMain ? "순천향대학교 정문" : "순천향대학교 후문"}
        </div>
      </Html>
    </group>
  );
});

const FountainFeature = memo(function FountainFeature({ area, isNight }: { area: CampusArea; isNight: boolean }) {
  const center = useMemo(() => polygonCenter(area.points), [area.points]);
  return (
    <group position={[center[0], 0.45, center[1]]}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[4.8, 5.7, 1.3, 28]} />
        <meshStandardMaterial color={isNight ? "#5d6f79" : "#d8ddd9"} roughness={0.66} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[3.9, 3.9, 0.32, 28]} />
        <meshStandardMaterial color="#5dc5e6" emissive="#3ba8d0" emissiveIntensity={isNight ? 0.8 : 0.16} metalness={0.18} />
      </mesh>
      {[[-2.4, 0], [2.4, 0], [0, -2.4], [0, 2.4]].map(([x, z], index) => (
        <Line
          key={index}
          points={[[x, 1.6, z], [x * 0.42, 7.5, z * 0.42], [0, 2, 0]]}
          color={isNight ? "#a8ecff" : "#d9f7ff"}
          lineWidth={2.2}
          transparent
          opacity={0.86}
        />
      ))}
    </group>
  );
});

const ShuttleCanopy = memo(function ShuttleCanopy({ area, isNight }: { area: CampusArea; isNight: boolean }) {
  const metrics = useMemo(() => getAreaMetrics(area.points), [area.points]);
  const width = Math.min(Math.max(metrics.width * 0.56, 20), 34);
  return (
    <group position={[metrics.center[0], 0.4, metrics.center[1]]} rotation={[0, metrics.rotation, 0]}>
      <mesh position={[0, 5.8, 0]} castShadow>
        <boxGeometry args={[width, 0.75, 7.5]} />
        <meshStandardMaterial color={isNight ? "#9ec7de" : "#d9edf5"} metalness={0.34} roughness={0.32} />
      </mesh>
      {[-width / 2 + 1.5, width / 2 - 1.5].flatMap((x) => [-2.7, 2.7].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 2.9, z]} castShadow>
          <cylinderGeometry args={[0.28, 0.34, 5.8, 8]} />
          <meshStandardMaterial color="#495964" metalness={0.48} roughness={0.38} />
        </mesh>
      )))}
      <mesh position={[0, 1.35, -3.2]}>
        <boxGeometry args={[width - 4, 2.5, 0.35]} />
        <meshStandardMaterial color={isNight ? "#245c7a" : "#4f9aba"} emissive="#2e7da1" emissiveIntensity={isNight ? 0.6 : 0.05} />
      </mesh>
    </group>
  );
});

const OutdoorTheater = memo(function OutdoorTheater({ position, isNight }: { position: Point2D; isNight: boolean }) {
  return (
    <group position={[position[0], 0.5, position[1]]} rotation={[0, -0.85, 0]}>
      {[12, 16, 20].map((radius, index) => (
        <mesh key={radius} position={[0, index * 0.72, 2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[radius, 1.25, 6, 48, Math.PI]} />
          <meshStandardMaterial color={isNight ? "#4c5660" : index % 2 === 0 ? "#d7d3c8" : "#c6c0b3"} roughness={0.92} />
        </mesh>
      ))}
      <mesh position={[0, 1.2, -7]} castShadow>
        <boxGeometry args={[18, 2.4, 9]} />
        <meshStandardMaterial color={isNight ? "#27333c" : "#ebe8df"} roughness={0.76} />
      </mesh>
      <mesh position={[0, 8.8, -10]} castShadow>
        <boxGeometry args={[22, 0.8, 12]} />
        <meshStandardMaterial color={isNight ? "#45515a" : "#f4f2ed"} metalness={0.22} roughness={0.48} />
      </mesh>
      {[-9.5, 9.5].map((x) => (
        <mesh key={x} position={[x, 4.8, -10]}>
          <cylinderGeometry args={[0.35, 0.45, 8, 8]} />
          <meshStandardMaterial color="#59666d" metalness={0.35} />
        </mesh>
      ))}
    </group>
  );
});

function FieldLight({ x, z, isNight }: { x: number; z: number; isNight: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 14, 6]} />
        <meshStandardMaterial color="#596268" metalness={0.45} />
      </mesh>
      <mesh position={[0, 14, 0]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[2.4, 0.7, 0.7]} />
        <meshStandardMaterial color="#e9f3f6" emissive="#fff3be" emissiveIntensity={isNight ? 1.5 : 0.08} />
      </mesh>
    </group>
  );
}

const FieldDetails = memo(function FieldDetails({ area, isNight }: { area: CampusArea; isNight: boolean }) {
  const metrics = useMemo(() => getAreaMetrics(area.points), [area.points]);
  const width = Math.max(metrics.width - 4, 8);
  const depth = Math.max(metrics.depth - 4, 8);
  const isTennis = area.name === "테니스장";
  const isMajor = area.name === "대운동장" || area.name === "소운동장" || isTennis;
  const lineColor = isNight ? "#c9dfd2" : "#f3f5e9";
  const rectangle = [
    [-width / 2, 0.42, -depth / 2],
    [width / 2, 0.42, -depth / 2],
    [width / 2, 0.42, depth / 2],
    [-width / 2, 0.42, depth / 2],
    [-width / 2, 0.42, -depth / 2],
  ] as [number, number, number][];

  return (
    <group position={[metrics.center[0], 0, metrics.center[1]]} rotation={[0, metrics.rotation, 0]}>
      <Line points={rectangle} color={lineColor} lineWidth={1.25} transparent opacity={0.82} />
      {isMajor ? (
        <>
          <Line points={[[0, 0.44, -depth / 2], [0, 0.44, depth / 2]]} color={lineColor} lineWidth={1} transparent opacity={0.78} />
          <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.min(width, depth) * 0.095, Math.min(width, depth) * 0.105, 40]} />
            <meshBasicMaterial color={lineColor} transparent opacity={0.78} side={THREE.DoubleSide} />
          </mesh>
          {isTennis ? (
            <mesh position={[0, 1.25, 0]}>
              <boxGeometry args={[0.12, 2.4, depth * 0.82]} />
              <meshStandardMaterial color="#e9edf0" transparent opacity={0.82} />
            </mesh>
          ) : null}
          {[
            [-width / 2, -depth / 2],
            [width / 2, -depth / 2],
            [-width / 2, depth / 2],
            [width / 2, depth / 2],
          ].map(([x, z]) => <FieldLight key={`${x}-${z}`} x={x} z={z} isNight={isNight} />)}
        </>
      ) : null}
    </group>
  );
});

const AreaOutline = memo(function AreaOutline({ area, isNight }: { area: CampusArea; isNight: boolean }) {
  if (!['parking', 'bus_station'].includes(area.kind)) return null;
  return (
    <Line
      points={[...area.points, area.points[0]].map(([x, z]) => [x, 0.46, z])}
      color={area.kind === "bus_station" ? "#4ea4d1" : isNight ? "#6f7c83" : "#f8fafc"}
      lineWidth={area.kind === "bus_station" ? 2 : 0.75}
      transparent
      opacity={0.76}
    />
  );
});

export default function CampusStructures({ data, route, isNight }: CampusStructuresProps) {
  const mainGate = projectCoordinate(CAMPUS_STOPS[4].latitude, CAMPUS_STOPS[4].longitude, data.origin);
  const rearGate = projectCoordinate(CAMPUS_STOPS[0].latitude, CAMPUS_STOPS[0].longitude, data.origin);
  const fountain = data.areas.find((area) => area.kind === "water");
  const shuttleStation = data.areas.find((area) => area.kind === "bus_station");
  const theater = data.buildings.find((building) => building.name === "야외 공연장");

  return (
    <group>
      <CampusGate position={mainGate} rotation={routeHeading(route, mainGate)} variant="main" isNight={isNight} />
      <CampusGate position={rearGate} rotation={routeHeading(route, rearGate)} variant="rear" isNight={isNight} />
      {fountain ? <FountainFeature area={fountain} isNight={isNight} /> : null}
      {shuttleStation ? <ShuttleCanopy area={shuttleStation} isNight={isNight} /> : null}
      {theater ? <OutdoorTheater position={polygonCenter(theater.points)} isNight={isNight} /> : null}
      {data.areas.map((area) => (
        <AreaOutline key={`outline-${area.id}`} area={area} isNight={isNight} />
      ))}
      {data.areas.filter((area) => area.kind === "pitch").map((area) => (
        <FieldDetails key={`field-${area.id}`} area={area} isNight={isNight} />
      ))}
    </group>
  );
}
