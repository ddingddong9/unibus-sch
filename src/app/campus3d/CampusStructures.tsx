import { memo, useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { polygonCenter } from "./campus-geometry";
import { CAMPUS_LANDMARKS, getCampusLandmarkPoint } from "./campus-landmarks";
import type { CampusArea, CampusData, Point2D } from "./types";
import { getTerrainHeight } from "./terrain";

interface CampusStructuresProps {
  data: CampusData;
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

const WestGate = memo(function WestGate({
  position,
  rotation,
  isNight,
}: {
  position: Point2D;
  rotation: number;
  isNight: boolean;
}) {
  const stone = isNight ? "#6f7779" : "#aaa9a2";
  const paleStone = isNight ? "#879196" : "#c5c4bc";
  const glass = isNight ? "#67b9cb" : "#9fcbd0";
  return (
    <group position={[position[0], getTerrainHeight(position[0], position[1]) + 0.35, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[-24, 2.25, 0]} castShadow>
        <boxGeometry args={[17, 4.5, 8]} />
        <meshStandardMaterial color={paleStone} roughness={0.82} />
      </mesh>
      <mesh position={[-15.2, 1.8, 0]} castShadow>
        <boxGeometry args={[1.2, 3.6, 8]} />
        <meshStandardMaterial color={glass} metalness={0.16} roughness={0.34} />
      </mesh>
      <mesh position={[-38, 1.75, 0]} castShadow>
        <boxGeometry args={[11, 3.5, 6]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      <mesh position={[19, 8.3, 0]} castShadow>
        <boxGeometry args={[4.5, 16.6, 6]} />
        <meshStandardMaterial color={stone} roughness={0.88} />
      </mesh>
      <mesh position={[10.8, 5.8, 0]} castShadow>
        <boxGeometry args={[3.2, 11.6, 5]} />
        <meshStandardMaterial color={stone} roughness={0.88} />
      </mesh>
      <mesh position={[30, 2, 0]} castShadow>
        <boxGeometry args={[17.5, 4, 7]} />
        <meshStandardMaterial color={paleStone} roughness={0.86} />
      </mesh>
      {[16.3, 21.7].map((x) => (
        <mesh key={x} position={[x, 8.3, -3.04]}>
          <planeGeometry args={[1.05, 11.8]} />
          <meshStandardMaterial color={isNight ? "#d8e6e7" : "#e8ece8"} />
        </mesh>
      ))}
    </group>
  );
});

interface SegmentedBeamProps {
  points: [number, number, number][];
  width: number;
  depth: number;
  isNight: boolean;
}

const SegmentedBeam = memo(function SegmentedBeam({ points, width, depth, isNight }: SegmentedBeamProps) {
  const segments = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), false, "centripetal");
    const samples = curve.getPoints(24);
    return samples.slice(1).map((to, index) => {
      const from = samples[index];
      const midpoint = from.clone().add(to).multiplyScalar(0.5);
      const direction = to.clone().sub(from);
      return {
        midpoint,
        length: direction.length() + 0.18,
        quaternion: new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          direction.normalize(),
        ),
      };
    });
  }, [points]);

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh key={index} position={segment.midpoint} quaternion={segment.quaternion} castShadow>
          <boxGeometry args={[width, depth, segment.length]} />
          <meshStandardMaterial color={isNight ? "#d7e3e8" : "#f5f6f3"} metalness={0.14} roughness={0.38} />
        </mesh>
      ))}
    </group>
  );
});

const HyangseolEastGate = memo(function HyangseolEastGate({
  position,
  rotation,
  isNight,
}: {
  position: Point2D;
  rotation: number;
  isNight: boolean;
}) {
  const baseHeight = getTerrainHeight(position[0], position[1]);
  const ribOffsets = [-3.2, -1.6, 0, 1.6, 3.2];

  return (
    <group position={[position[0], baseHeight, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[27, 5.6, 0]} castShadow>
        <boxGeometry args={[4.5, 11.2, 18]} />
        <meshStandardMaterial color={isNight ? "#d6e1e5" : "#f2f3ef"} roughness={0.5} />
      </mesh>
      <mesh position={[-11, 4.7, 0]} castShadow>
        <boxGeometry args={[4.2, 9.4, 11]} />
        <meshStandardMaterial color={isNight ? "#d6e1e5" : "#f2f3ef"} roughness={0.5} />
      </mesh>
      <mesh position={[-31, 3.8, -18]} castShadow>
        <boxGeometry args={[4, 7.6, 14]} />
        <meshStandardMaterial color={isNight ? "#d6e1e5" : "#f2f3ef"} roughness={0.5} />
      </mesh>
      {ribOffsets.map((offset) => (
        <SegmentedBeam
          key={`main-rib-${offset}`}
          points={[[27, 10.5, offset], [18, 11.25, offset], [4, 11.6, offset], [-7, 10.7, offset], [-11, 9.5, offset]]}
          width={0.72}
          depth={0.68}
          isNight={isNight}
        />
      ))}
      {[-1.8, 0, 1.8].map((offset) => (
        <SegmentedBeam
          key={`side-rib-${offset}`}
          points={[[-9 + offset, 9.7, 0], [-15 + offset, 9.5, -7], [-23 + offset, 8.9, -13], [-31 + offset, 7.7, -18]]}
          width={0.68}
          depth={0.65}
          isNight={isNight}
        />
      ))}
      <SegmentedBeam
        points={[[28, 11.4, -4.25], [17, 12.2, -4.25], [2, 12.45, -4.25], [-11, 10.4, -4.25]]}
        width={1.25}
        depth={1.55}
        isNight={isNight}
      />
      <mesh position={[27, 5.5, -9.05]}>
        <planeGeometry args={[2.5, 5.4]} />
        <meshStandardMaterial color={isNight ? "#67b9cc" : "#287ca0"} emissive="#216d8c" emissiveIntensity={isNight ? 0.45 : 0.04} />
      </mesh>
    </group>
  );
});

const FountainFeature = memo(function FountainFeature({ area, isNight }: { area: CampusArea; isNight: boolean }) {
  const center = useMemo(() => polygonCenter(area.points), [area.points]);
  return (
    <group position={[center[0], getTerrainHeight(center[0], center[1]) + 0.45, center[1]]}>
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
    <group position={[metrics.center[0], getTerrainHeight(metrics.center[0], metrics.center[1]) + 0.4, metrics.center[1]]} rotation={[0, metrics.rotation, 0]}>
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
    <group position={[position[0], getTerrainHeight(position[0], position[1]) + 0.5, position[1]]} rotation={[0, -0.85, 0]}>
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
    <group position={[metrics.center[0], getTerrainHeight(metrics.center[0], metrics.center[1]), metrics.center[1]]} rotation={[0, metrics.rotation, 0]}>
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
      points={[...area.points, area.points[0]].map(([x, z]) => [x, getTerrainHeight(x, z) + 0.46, z])}
      color={area.kind === "bus_station" ? "#4ea4d1" : isNight ? "#6f7c83" : "#f8fafc"}
      lineWidth={area.kind === "bus_station" ? 2 : 0.75}
      transparent
      opacity={0.76}
    />
  );
});

export default function CampusStructures({ data, isNight }: CampusStructuresProps) {
  const westGate = getCampusLandmarkPoint(CAMPUS_LANDMARKS.westGate, data.origin);
  const hyangseolEastGate = getCampusLandmarkPoint(CAMPUS_LANDMARKS.hyangseolEastGate, data.origin);
  const fountain = data.areas.find((area) => area.kind === "water");
  const shuttleStation = data.areas.find((area) => area.kind === "bus_station");
  const theater = data.buildings.find((building) => building.name === "야외 공연장");

  return (
    <group>
      <WestGate position={westGate} rotation={CAMPUS_LANDMARKS.westGate.rotation} isNight={isNight} />
      <HyangseolEastGate position={hyangseolEastGate} rotation={CAMPUS_LANDMARKS.hyangseolEastGate.rotation} isNight={isNight} />
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
