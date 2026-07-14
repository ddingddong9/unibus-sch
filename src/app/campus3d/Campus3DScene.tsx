import { Component, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Sky, Stars } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import campusDataSource from "./campus-data.json";
import {
  CAMPUS_STOPS,
  createCampusRoute,
  polygonCenter,
  projectCoordinate,
} from "./campus-geometry";
import type { CampusArea, CampusBuilding, CampusData, CampusRoad, CampusStop, Point2D } from "./types";
import CampusStructures from "./CampusStructures";
import TerrainSurface from "./TerrainSurface";
import { CAMPUS_LANDMARKS, getCampusLandmarkPoint } from "./campus-landmarks";
import { getTerrainHeight } from "./terrain";
import { CampusPerformanceGovernor, type CampusPerformanceMetrics } from "./CampusPerformanceGovernor";

const campusData = campusDataSource as CampusData;
export type CampusWeather = "clear" | "cloudy" | "rain";
export type RenderQuality = "balanced" | "high";
export type RouteBehavior = "loop" | "pingpong";
export type BusSignalStatus = "live" | "stale" | "offline" | "simulation";
export interface CampusLiveBus {
  id: string;
  label: string;
  position: Point2D;
  heading?: number;
  routeProgress?: number;
  signalStatus?: BusSignalStatus;
  statusLabel?: string;
  etaLabel?: string;
}
export interface CampusInitialView {
  target: Point2D;
  distance: number;
  cameraPosition?: Point2D;
  cameraHeight?: number;
}
const MAJOR_BUILDINGS = new Set([
  "대학본부",
  "도서관",
  "유니토피아관",
  "공과대학",
  "학생회관",
  "의료과학대",
  "향설생활관3",
]);
const OVERVIEW_BUILDINGS = new Set(["도서관", "대학본부", "향설생활관3"]);

interface BuildingFootprint {
  width: number;
  depth: number;
  rotation: number;
}

function RoofMaterial({ variant, isNight }: { variant: "concrete" | "glass"; isNight: boolean }) {
  if (variant === "glass") {
    return <meshStandardMaterial color={isNight ? "#9cc8d8" : "#78aabb"} emissive="#4f9fbd" emissiveIntensity={isNight ? 0.4 : 0.04} metalness={0.26} roughness={0.34} />;
  }
  return <meshStandardMaterial color={isNight ? "#4b5e69" : "#d8dfe1"} roughness={0.72} metalness={0.12} />;
}

const MajorBuildingRoof = memo(function MajorBuildingRoof({
  name,
  footprint,
  isNight,
}: {
  name: string;
  footprint: BuildingFootprint;
  isNight: boolean;
}) {
  if (name === "도서관") {
    return (
      <group rotation={[0, footprint.rotation, 0]}>
        <mesh castShadow position={[0, 1.25, 0]}>
          <boxGeometry args={[Math.max(footprint.width * 0.62, 10), 2.5, Math.max(footprint.depth * 0.2, 5)]} />
          <RoofMaterial variant="glass" isNight={isNight} />
        </mesh>
        {[-0.32, 0.32].map((ratio) => (
          <mesh key={ratio} castShadow position={[footprint.width * ratio, 0.75, 0]}>
            <boxGeometry args={[Math.max(footprint.width * 0.12, 3), 1.5, Math.max(footprint.depth * 0.38, 6)]} />
            <RoofMaterial variant="concrete" isNight={isNight} />
          </mesh>
        ))}
      </group>
    );
  }

  if (name === "대학본부") {
    return (
      <group rotation={[0, footprint.rotation, 0]}>
        <mesh castShadow position={[0, 1.55, 0]}>
          <boxGeometry args={[Math.max(footprint.width * 0.2, 5), 3.1, Math.max(footprint.depth * 0.5, 8)]} />
          <RoofMaterial variant="glass" isNight={isNight} />
        </mesh>
        {[-0.3, 0.3].map((ratio) => (
          <mesh key={ratio} castShadow position={[footprint.width * ratio, 0.7, 0]}>
            <boxGeometry args={[Math.max(footprint.width * 0.18, 4), 1.4, Math.max(footprint.depth * 0.28, 5)]} />
            <RoofMaterial variant="concrete" isNight={isNight} />
          </mesh>
        ))}
      </group>
    );
  }

  if (name === "유니토피아관") {
    return (
      <group rotation={[0, footprint.rotation, 0]}>
        <mesh castShadow position={[0, 2.4, 0]}>
          <boxGeometry args={[Math.max(footprint.width * 0.34, 7), 4.8, Math.max(footprint.depth * 0.34, 7)]} />
          <RoofMaterial variant="glass" isNight={isNight} />
        </mesh>
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[Math.max(footprint.width * 0.58, 10), 1.1, Math.max(footprint.depth * 0.58, 10)]} />
          <RoofMaterial variant="concrete" isNight={isNight} />
        </mesh>
      </group>
    );
  }

  const unitCount = name === "공과대학" ? 3 : 2;
  const canopy = name === "학생회관";
  return (
    <group rotation={[0, footprint.rotation, 0]}>
      {canopy ? (
        <mesh castShadow position={[0, 0.65, footprint.depth * 0.18]}>
          <boxGeometry args={[Math.max(footprint.width * 0.68, 12), 1.3, Math.max(footprint.depth * 0.24, 5)]} />
          <RoofMaterial variant="glass" isNight={isNight} />
        </mesh>
      ) : Array.from({ length: unitCount }, (_, index) => {
        const offset = (index - (unitCount - 1) / 2) * Math.max(footprint.width * 0.22, 6);
        return (
          <mesh key={index} castShadow position={[offset, 0.9, 0]}>
            <boxGeometry args={[Math.max(footprint.width * 0.16, 4), 1.8, Math.max(footprint.depth * 0.28, 5)]} />
            <RoofMaterial variant={index === unitCount - 1 ? "glass" : "concrete"} isNight={isNight} />
          </mesh>
        );
      })}
    </group>
  );
});

interface Campus3DSceneProps {
  isNight: boolean;
  isRunning: boolean;
  autoRotate: boolean;
  showRoute: boolean;
  selectedBuildingId: string | null;
  focusTarget: { x: number; z: number; height: number } | null;
  routePath: Point2D[] | null;
  routeStops: CampusStop[] | null;
  followBusId: string | null;
  simulationSpeed: number;
  weather: CampusWeather;
  renderQuality: RenderQuality;
  isTouring: boolean;
  onFollowBus: (busId: string | null) => void;
  selectedStopId: string | null;
  onSelectStop: (stop: CampusStop) => void;
  resetVersion: number;
  onSelectBuilding: (building: CampusBuilding | null) => void;
  liveBuses?: CampusLiveBus[];
  initialView?: CampusInitialView | null;
  fallbackBusLabels?: string[];
  routeBehavior?: RouteBehavior;
  onPerformanceMetrics?: (metrics: CampusPerformanceMetrics) => void;
}

function shapeFromPoints(points: Point2D[]) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    // Extrusion uses local XY and is rotated onto XZ, so local Y must invert once.
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  return shape;
}

type TerrainPoint = [number, number, number];

function drapePathToTerrain(
  points: Point2D[],
  clearance: number,
  maxSegmentLength = 7,
): TerrainPoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    const [x, z] = points[0];
    return [[x, getTerrainHeight(x, z) + clearance, z]];
  }

  const terrainPoints: TerrainPoint[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const [fromX, fromZ] = points[index - 1];
    const [toX, toZ] = points[index];
    const distance = Math.hypot(toX - fromX, toZ - fromZ);
    const steps = Math.max(1, Math.ceil(distance / maxSegmentLength));

    for (let step = index === 1 ? 0 : 1; step <= steps; step += 1) {
      const progress = step / steps;
      const x = THREE.MathUtils.lerp(fromX, toX, progress);
      const z = THREE.MathUtils.lerp(fromZ, toZ, progress);
      terrainPoints.push([x, getTerrainHeight(x, z) + clearance, z]);
    }
  }
  return terrainPoints;
}

const PEDESTRIAN_ROAD_KINDS = new Set(["footway", "path", "steps", "cycleway"]);

function createRoadRibbonGeometry(roads: CampusRoad[], pedestrian: boolean) {
  const positions: number[] = [];
  const indices: number[] = [];
  const centerlinePositions: number[] = [];

  roads.forEach((road) => {
    if (PEDESTRIAN_ROAD_KINDS.has(road.kind) !== pedestrian) return;
    const sampled = drapePathToTerrain(road.points, pedestrian ? 0.52 : 0.68, pedestrian ? 4 : 5);
    if (sampled.length < 2) return;
    const vertexStart = positions.length / 3;
    const halfWidth = pedestrian
      ? Math.max(0.65, Math.min(road.width, 2.4) / 2)
      : Math.max(2.1, road.width / 2);

    sampled.forEach((point, index) => {
      const previous = sampled[Math.max(0, index - 1)];
      const next = sampled[Math.min(sampled.length - 1, index + 1)];
      const tangentX = next[0] - previous[0];
      const tangentZ = next[2] - previous[2];
      const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
      const sideX = -tangentZ / tangentLength;
      const sideZ = tangentX / tangentLength;
      const leftX = point[0] + sideX * halfWidth;
      const leftZ = point[2] + sideZ * halfWidth;
      const rightX = point[0] - sideX * halfWidth;
      const rightZ = point[2] - sideZ * halfWidth;
      const clearance = pedestrian ? 0.52 : 0.68;
      positions.push(
        leftX, getTerrainHeight(leftX, leftZ) + clearance, leftZ,
        rightX, getTerrainHeight(rightX, rightZ) + clearance, rightZ,
      );

      if (!pedestrian && index > 0) {
        centerlinePositions.push(
          previous[0], previous[1] + 0.12, previous[2],
          point[0], point[1] + 0.12, point[2],
        );
      }
    });

    for (let index = 0; index < sampled.length - 1; index += 1) {
      const left = vertexStart + index * 2;
      const right = left + 1;
      const nextLeft = left + 2;
      const nextRight = left + 3;
      indices.push(left, right, nextLeft, nextLeft, right, nextRight);
    }
  });

  const surface = new THREE.BufferGeometry();
  surface.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  surface.setIndex(indices);
  surface.computeVertexNormals();
  surface.computeBoundingSphere();

  const centerlines = new THREE.BufferGeometry();
  centerlines.setAttribute("position", new THREE.Float32BufferAttribute(centerlinePositions, 3));
  centerlines.computeBoundingSphere();
  return { surface, centerlines };
}

const CampusRoadNetwork = memo(function CampusRoadNetwork({ roads, isNight }: { roads: CampusRoad[]; isNight: boolean }) {
  const vehicle = useMemo(() => createRoadRibbonGeometry(roads, false), [roads]);
  const pedestrian = useMemo(() => createRoadRibbonGeometry(roads, true), [roads]);

  useEffect(() => () => {
    vehicle.surface.dispose();
    vehicle.centerlines.dispose();
    pedestrian.surface.dispose();
    pedestrian.centerlines.dispose();
  }, [pedestrian, vehicle]);

  return (
    <group>
      <mesh geometry={vehicle.surface} receiveShadow renderOrder={3}>
        <meshStandardMaterial color={isNight ? "#27323a" : "#596166"} roughness={0.94} metalness={0.02} />
      </mesh>
      <lineSegments geometry={vehicle.centerlines} renderOrder={4}>
        <lineBasicMaterial color={isNight ? "#6e7b82" : "#d8dde0"} transparent opacity={0.62} />
      </lineSegments>
      <mesh geometry={pedestrian.surface} receiveShadow renderOrder={2}>
        <meshStandardMaterial color={isNight ? "#59665f" : "#d8cfba"} roughness={0.98} />
      </mesh>
    </group>
  );
});

const AreaMesh = memo(function AreaMesh({ area, isNight }: { area: CampusArea; isNight: boolean }) {
  const geometry = useMemo(() => {
    const contour = area.points.map(([x, z]) => new THREE.Vector2(x, z));
    const faces = THREE.ShapeUtils.triangulateShape(contour, []);
    const positions = new Float32Array(area.points.length * 3);
    area.points.forEach(([x, z], index) => {
      const offset = index * 3;
      positions[offset] = x;
      positions[offset + 1] = getTerrainHeight(x, z) + 0.34;
      positions[offset + 2] = z;
    });
    const surface = new THREE.BufferGeometry();
    surface.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    surface.setIndex(faces.flat());
    surface.computeVertexNormals();
    return surface;
  }, [area.points]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const color = area.kind === "water"
    ? isNight ? "#123d52" : "#65b7d1"
    : area.kind === "pitch"
      ? isNight ? "#173e2b" : "#4f995e"
      : area.kind === "parking"
        ? isNight ? "#252e33" : "#afb6b6"
        : area.kind === "bus_station"
          ? isNight ? "#183546" : "#8fc0d5"
          : isNight ? "#233527" : "#8fb17b";

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.88} metalness={area.kind === "water" ? 0.15 : 0} />
    </mesh>
  );
});

function DistanceAwareHtml({
  position,
  distanceFactor,
  maxDistance,
  zIndexRange,
  children,
}: {
  position: [number, number, number];
  distanceFactor: number;
  maxDistance: number;
  zIndexRange: [number, number];
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const worldPosition = useMemo(() => new THREE.Vector3(...position), [position]);
  const frame = useRef(0);

  useFrame(({ camera }) => {
    frame.current += 1;
    if (frame.current % 8 !== 0 || !contentRef.current) return;
    const visible = camera.position.distanceTo(worldPosition) <= maxDistance;
    contentRef.current.style.opacity = visible ? "1" : "0";
    contentRef.current.style.pointerEvents = visible ? "auto" : "none";
  });

  return (
    <Html position={position} center occlude distanceFactor={distanceFactor} zIndexRange={zIndexRange}>
      <div ref={contentRef} className="transition-opacity duration-200">{children}</div>
    </Html>
  );
}

const BuildingMesh = memo(function BuildingMesh({
  building,
  selected,
  isNight,
  onSelect,
}: {
  building: CampusBuilding;
  selected: boolean;
  isNight: boolean;
  onSelect: (building: CampusBuilding) => void;
}) {
  const viewportWidth = useThree((state) => state.size.width);
  const terrainRange = useMemo(() => {
    const heights = building.points.map(([x, z]) => getTerrainHeight(x, z));
    return { min: Math.min(...heights), max: Math.max(...heights) };
  }, [building.points]);
  const foundationDepth = Math.max(5, terrainRange.max - terrainRange.min + 2.5);
  const geometry = useMemo(
    () => new THREE.ExtrudeGeometry(shapeFromPoints(building.points), {
      depth: building.height + foundationDepth,
      bevelEnabled: true,
      bevelSize: 0.65,
      bevelThickness: 0.7,
      bevelSegments: 1,
    }),
    [building.height, building.points, foundationDepth],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 32), [geometry]);
  const center = useMemo(() => polygonCenter(building.points), [building.points]);
  const baseHeight = terrainRange.max;
  const footprint = useMemo<BuildingFootprint>(() => {
    let longest = { length: 0, dx: 1, dz: 0 };
    building.points.forEach((point, index) => {
      const next = building.points[(index + 1) % building.points.length];
      const dx = next[0] - point[0];
      const dz = next[1] - point[1];
      const length = Math.hypot(dx, dz);
      if (length > longest.length) longest = { length, dx, dz };
    });
    const ux = longest.dx / longest.length;
    const uz = longest.dz / longest.length;
    const local = building.points.map(([x, z]) => {
      const dx = x - center[0];
      const dz = z - center[1];
      return [dx * ux + dz * uz, dx * -uz + dz * ux] as Point2D;
    });
    const xs = local.map(([x]) => x);
    const zs = local.map(([, z]) => z);
    return {
      width: Math.max(...xs) - Math.min(...xs),
      depth: Math.max(...zs) - Math.min(...zs),
      rotation: -Math.atan2(uz, ux),
    };
  }, [building.points, center]);
  const isMajor = MAJOR_BUILDINGS.has(building.name);
  const isOverviewBuilding = OVERVIEW_BUILDINGS.has(building.name);

  useEffect(() => () => {
    geometry.dispose();
    edges.dispose();
  }, [edges, geometry]);

  const baseColor = /생활관|학성사|글로벌/.test(building.name)
    ? isNight ? "#344854" : "#d8e0e2"
    : isNight ? "#263644" : "#eef1ed";

  return (
    <group>
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, baseHeight - foundationDepth + 0.2, 0]}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect(building);
        }}
        onPointerEnter={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        <meshStandardMaterial
          color={selected ? "#ffb547" : baseColor}
          emissive={isNight ? selected ? "#b65c08" : "#182d3a" : "#000000"}
          emissiveIntensity={isNight ? 0.55 : 0}
          roughness={0.68}
          metalness={0.06}
        />
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={selected ? "#e87912" : isNight ? "#50687a" : "#b2bcb8"} transparent opacity={0.72} />
        </lineSegments>
      </mesh>
      {building.height >= 12 ? [0.28, 0.52, 0.76].map((level) => (
        <Line
          key={level}
          points={[...building.points, building.points[0]].map(([x, z]) => [x, baseHeight + building.height * level, z])}
          color={isNight ? "#f6c76d" : "#8fa2a7"}
          lineWidth={selected ? 1.35 : 0.7}
          transparent
          opacity={isNight ? 0.68 : 0.48}
        />
      )) : null}
      {(selected || MAJOR_BUILDINGS.has(building.name)) ? (
        <DistanceAwareHtml
          position={[center[0], baseHeight + building.height + 5, center[1]]}
          distanceFactor={selected ? (viewportWidth < 640 ? 460 : 300) : (viewportWidth < 640 ? 640 : 420)}
          zIndexRange={[20, 0]}
          maxDistance={selected ? Number.POSITIVE_INFINITY : isOverviewBuilding ? 3400 : viewportWidth < 640 ? 1550 : 920}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(building);
            }}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-[13px] font-extrabold shadow-[0_6px_18px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
              selected
                ? "border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-[0_8px_22px_rgba(30,58,138,0.26)]"
                : "border-white/80 bg-white/94 text-[#0f172a] hover:border-[#1e3a8a]/30 hover:text-[#1e3a8a]"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-[#1e3a8a]"}`} />
            {building.name}
          </button>
        </DistanceAwareHtml>
      ) : null}
      {isMajor ? (
        <group position={[center[0], baseHeight + building.height + 0.7, center[1]]}>
          <MajorBuildingRoof name={building.name} footprint={footprint} isNight={isNight} />
        </group>
      ) : null}
    </group>
  );
});

function Rainfall({ quality }: { quality: RenderQuality }) {
  const points = useRef<THREE.Points>(null);
  const count = quality === "high" ? 1500 : 800;
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const seed = (index * 16807) % 2147483647;
      values[index * 3] = ((seed % 1000) / 1000 - 0.5) * 1500;
      values[index * 3 + 1] = 40 + ((seed * 13) % 500) / 500 * 520;
      values[index * 3 + 2] = (((seed * 31) % 1000) / 1000 - 0.5) * 1500;
    }
    return values;
  }, [count]);

  useFrame((_, delta) => {
    const attribute = points.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!attribute) return;
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      positions[offset] += delta * 7;
      positions[offset + 1] -= delta * 150;
      if (positions[offset + 1] < -10) positions[offset + 1] = 520;
    }
    attribute.needsUpdate = true;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d8efff" size={1.45} transparent opacity={0.72} depthWrite={false} sizeAttenuation />
    </points>
  );
}

interface RouteTrack {
  points: Point2D[];
  lengths: number[];
  total: number;
}

function createRouteTrack(points: Point2D[]): RouteTrack {
  const lengths: number[] = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const dx = points[index][0] - points[index - 1][0];
    const dz = points[index][1] - points[index - 1][1];
    total += Math.hypot(dx, dz);
    lengths.push(total);
  }
  return { points, lengths, total };
}

function sampleRoute(track: RouteTrack, distance: number, position: THREE.Vector3) {
  const { points, lengths, total } = track;
  if (points.length < 2 || lengths.length === 0 || total <= 0) {
    const fallback = points[0] ?? [0, 0];
    position.set(fallback[0], getTerrainHeight(fallback[0], fallback[1]) + 0.75, fallback[1]);
    return { angle: 0 };
  }
  const wrappedDistance = ((distance % total) + total) % total;
  let low = 0;
  let high = lengths.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (lengths[middle] < wrappedDistance) low = middle + 1;
    else high = middle;
  }
  const index = low;
  const segmentStart = index === 0 ? 0 : lengths[index - 1];
  const segmentLength = lengths[index] - segmentStart || 1;
  const progress = (wrappedDistance - segmentStart) / segmentLength;
  const from = points[index];
  const to = points[index + 1];
  const x = THREE.MathUtils.lerp(from[0], to[0], progress);
  const z = THREE.MathUtils.lerp(from[1], to[1], progress);
  position.set(x, getTerrainHeight(x, z) + 0.75, z);
  return {
    angle: Math.atan2(to[0] - from[0], to[1] - from[1]),
  };
}

function samplePingPongRoute(track: RouteTrack, distance: number, position: THREE.Vector3) {
  if (track.total <= 0) return { angle: 0 };
  const cycleLength = track.total * 2;
  const cycleDistance = ((distance % cycleLength) + cycleLength) % cycleLength;
  const returning = cycleDistance > track.total;
  const routeDistance = returning ? cycleLength - cycleDistance : cycleDistance;
  const sample = sampleRoute(track, Math.min(routeDistance, track.total - 0.001), position);
  return { angle: returning ? sample.angle + Math.PI : sample.angle };
}

function ShuttleBus({
  track,
  offset,
  running,
  label,
  followed,
  speedMultiplier,
  routeBehavior,
  controls,
  onFollow,
}: {
  track: RouteTrack;
  offset: number;
  running: boolean;
  label: string;
  followed: boolean;
  speedMultiplier: number;
  routeBehavior: RouteBehavior;
  controls: React.RefObject<OrbitControlsImpl | null>;
  onFollow: (busId: string | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const viewportWidth = useThree((state) => state.size.width);
  const distance = useRef(offset);
  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const targetEuler = useMemo(() => new THREE.Euler(), []);
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!group.current || track.points.length < 2) return;
    if (running) distance.current += delta * 10.5 * speedMultiplier;
    const sample = routeBehavior === "loop"
      ? sampleRoute(track, distance.current, targetPosition)
      : samplePingPongRoute(track, distance.current, targetPosition);
    group.current.position.copy(targetPosition);
    targetEuler.set(0, sample.angle, 0);
    targetQuaternion.setFromEuler(targetEuler);
    group.current.quaternion.slerp(targetQuaternion, 1 - Math.exp(-delta * 7));
    if (followed) {
      cameraPosition.set(
        targetPosition.x - Math.sin(sample.angle) * 42 + 18,
        targetPosition.y + 28,
        targetPosition.z - Math.cos(sample.angle) * 42 + 18,
      );
      cameraTarget.set(targetPosition.x, targetPosition.y + 3, targetPosition.z);
      camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 2.4));
      controls.current?.target.lerp(cameraTarget, 1 - Math.exp(-delta * 3.2));
      controls.current?.update();
    }
  });

  return (
    <group ref={group} scale={viewportWidth < 640 ? 1.82 : 1.5} onClick={(event) => { event.stopPropagation(); onFollow(followed ? null : label); }}>
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[3.1, 2.5, 7.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[3.18, 0.72, 7.5]} />
        <meshStandardMaterial color="#2563eb" roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.82, 0.08]}>
        <boxGeometry args={[3.22, 0.82, 5.55]} />
        <meshStandardMaterial color="#17324a" roughness={0.32} metalness={0.22} />
      </mesh>
      <mesh position={[0, 1.85, 3.72]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[2.65, 0.9, 0.12]} />
        <meshStandardMaterial color="#9ed8ef" emissive="#6dc6e8" emissiveIntensity={0.24} />
      </mesh>
      {[-1.62, 1.62].flatMap((z) => [-1.58, 1.58].map((x) => (
        <mesh key={`${x}-${z}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 12]} />
          <meshStandardMaterial color="#151a1f" roughness={0.82} />
        </mesh>
      )))}
      <Html position={[0, 6.6, 0]} center occlude distanceFactor={330} zIndexRange={[16, 0]}>
        <button type="button" onClick={(event) => { event.stopPropagation(); onFollow(followed ? null : label); }} className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-[12px] font-extrabold shadow-[0_8px_22px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:px-2.5 sm:py-1.5 sm:text-[10px] ${followed ? "border-[#1e3a8a] bg-[#1e3a8a] text-white" : "border-white/85 bg-white/95 text-[#1e3a8a]"}`}>
          <span className={`h-2 w-2 rounded-full ring-2 ring-white ${running ? "animate-pulse bg-[#22c55e]" : "bg-[#94a3b8]"}`} />
          {label}
        </button>
      </Html>
    </group>
  );
}

const LiveShuttleBus = memo(function LiveShuttleBus({ bus, track, routeBehavior, followed, controls, onFollow }: {
  bus: CampusLiveBus;
  track: RouteTrack;
  routeBehavior: RouteBehavior;
  followed: boolean;
  controls: React.RefObject<OrbitControlsImpl | null>;
  onFollow: (busId: string | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const viewportWidth = useThree((state) => state.size.width);
  const routeDistance = useRef(bus.routeProgress ?? 0);
  const target = useMemo(
    () => new THREE.Vector3(bus.position[0], getTerrainHeight(bus.position[0], bus.position[1]) + 0.8, bus.position[1]),
    [bus.position],
  );
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const targetEuler = useMemo(() => new THREE.Euler(), []);
  const rotation = Math.PI - THREE.MathUtils.degToRad(bus.heading ?? 0);

  useFrame((_, delta) => {
    if (!group.current) return;
    let desiredDistance = bus.routeProgress ?? routeDistance.current;
    if (routeBehavior === "loop" && track.total > 0) {
      const difference = desiredDistance - routeDistance.current;
      if (difference < -track.total / 2) desiredDistance += track.total;
      else if (difference > track.total / 2) desiredDistance -= track.total;
    }
    routeDistance.current = THREE.MathUtils.lerp(routeDistance.current, desiredDistance, 1 - Math.exp(-delta * 1.25));
    const sample = routeBehavior === "loop"
      ? sampleRoute(track, routeDistance.current, target)
      : sampleRoute(track, Math.min(Math.max(routeDistance.current, 0), Math.max(track.total - 0.001, 0)), target);
    group.current.position.copy(target);
    const routeRotation = Number.isFinite(sample.angle) ? sample.angle : rotation;
    targetEuler.set(0, routeRotation, 0);
    targetQuaternion.setFromEuler(targetEuler);
    group.current.quaternion.slerp(targetQuaternion, 1 - Math.exp(-delta * 5));
    if (followed) {
      cameraPosition.set(target.x + 38, target.y + 30, target.z + 44);
      cameraTarget.set(target.x, target.y + 3, target.z);
      camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 2.4));
      controls.current?.target.lerp(cameraTarget, 1 - Math.exp(-delta * 3));
      controls.current?.update();
    }
  });

  return (
    <group
      ref={group}
      position={target}
      rotation={[0, rotation, 0]}
      scale={viewportWidth < 640 ? 1.76 : 1.45}
      onClick={(event) => { event.stopPropagation(); onFollow(followed ? null : bus.id); }}
    >
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[3.1, 2.5, 7.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[3.18, 0.72, 7.5]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.82, 0.08]}>
        <boxGeometry args={[3.22, 0.82, 5.55]} />
        <meshStandardMaterial color="#17324a" roughness={0.32} metalness={0.22} />
      </mesh>
      <mesh position={[0, 1.85, 3.72]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[2.65, 0.9, 0.12]} />
        <meshStandardMaterial color="#9ed8ef" emissive="#6dc6e8" emissiveIntensity={0.24} />
      </mesh>
      {[-1.62, 1.62].flatMap((z) => [-1.58, 1.58].map((x) => (
        <mesh key={`${x}-${z}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 12]} />
          <meshStandardMaterial color="#151a1f" roughness={0.82} />
        </mesh>
      )))}
      <Html position={[0, 6.6, 0]} center occlude distanceFactor={330} zIndexRange={[16, 0]}>
        <button type="button" onClick={(event) => { event.stopPropagation(); onFollow(followed ? null : bus.id); }} className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-[12px] font-extrabold shadow-[0_8px_22px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:px-2.5 sm:py-1.5 sm:text-[10px] ${followed ? "border-[#1e3a8a] bg-[#1e3a8a] text-white" : "border-white/85 bg-white/95 text-[#1e3a8a]"}`}>
          <span className={`h-2 w-2 rounded-full ring-2 ring-white ${bus.signalStatus === "offline" ? "bg-[#94a3b8]" : bus.signalStatus === "stale" ? "bg-[#f59e0b]" : bus.signalStatus === "simulation" ? "bg-[#38bdf8]" : "bg-[#22c55e]"}`} />
          <span>{bus.label}</span>
          {bus.etaLabel ? <span className={followed ? "text-white/75" : "text-[#64748b]"}>{bus.etaLabel}</span> : null}
          {bus.statusLabel ? <span className={followed ? "text-white/70" : "text-[#94a3b8]"}>{bus.statusLabel}</span> : null}
        </button>
      </Html>
    </group>
  );
});

function CameraDirector({
  controls,
  selectedBuildingId,
  focusTarget,
  resetVersion,
  initialView,
}: {
  controls: React.RefObject<OrbitControlsImpl | null>;
  selectedBuildingId: string | null;
  focusTarget: { x: number; z: number; height: number } | null;
  resetVersion: number;
  initialView?: CampusInitialView | null;
}) {
  const camera = useThree((state) => state.camera);
  const viewportAspect = useThree((state) => state.size.width / Math.max(state.size.height, 1));

  useEffect(() => {
    const selected = campusData.buildings.find((building) => building.id === selectedBuildingId);
    const target = selected
      ? polygonCenter(selected.points)
      : focusTarget
        ? [focusTarget.x, focusTarget.z] as Point2D
        : initialView?.target ?? [0, 0];
    const terrainHeight = getTerrainHeight(target[0], target[1]);
    const subjectHeight = selected?.height ?? focusTarget?.height ?? 0;
    const hasSubject = Boolean(selected || focusTarget);
    const overviewScale = viewportAspect > 1.45 ? 0.72 : viewportAspect < 0.72 ? 1.04 : 0.9;
    const targetPosition = hasSubject
      ? new THREE.Vector3(target[0] + 105, terrainHeight + Math.max(subjectHeight + 72, 90), target[1] + 125)
      : initialView?.cameraPosition
        ? new THREE.Vector3(
            initialView.cameraPosition[0],
            getTerrainHeight(initialView.cameraPosition[0], initialView.cameraPosition[1])
              + (initialView.cameraHeight ?? initialView.distance * 0.72),
            initialView.cameraPosition[1],
          )
      : initialView
        ? new THREE.Vector3(
            target[0] + initialView.distance * overviewScale * (initialView.distance > 1500 ? 0.12 : 0.52),
            terrainHeight + initialView.distance * overviewScale * (initialView.distance > 1500 ? 0.92 : 0.72),
            target[1] + initialView.distance * overviewScale * (initialView.distance > 1500 ? 0.12 : 0.58),
          )
        : new THREE.Vector3(560 * overviewScale, 900 * overviewScale, 720 * overviewScale);
    const targetLookAt = new THREE.Vector3(
      target[0],
      terrainHeight + (hasSubject ? subjectHeight * 0.3 : initialView?.cameraPosition ? 12 : 0),
      target[1],
    );
    const startPosition = camera.position.clone();
    const startTarget = controls.current?.target.clone() ?? new THREE.Vector3();
    const animatedTarget = new THREE.Vector3();
    const startedAt = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const rawProgress = Math.min((now - startedAt) / 780, 1);
      const progress = 1 - (1 - rawProgress) ** 3;
      camera.position.lerpVectors(startPosition, targetPosition, progress);
      animatedTarget.lerpVectors(startTarget, targetLookAt, progress);
      if (controls.current) {
        controls.current.target.copy(animatedTarget);
        controls.current.update();
      } else {
        camera.lookAt(animatedTarget);
      }
      if (rawProgress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [camera, controls, focusTarget, initialView, resetVersion, selectedBuildingId, viewportAspect]);

  return null;
}

function CinematicTour({ enabled, controls }: { enabled: boolean; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((state) => state.camera);
  const elapsed = useRef(0);
  const curves = useMemo(() => {
    const westGate = getCampusLandmarkPoint(CAMPUS_LANDMARKS.westGate, campusData.origin);
    const eastGate = getCampusLandmarkPoint(CAMPUS_LANDMARKS.hyangseolEastGate, campusData.origin);
    const library = campusData.buildings.find((building) => building.name === "도서관");
    const libraryCenter = library ? polygonCenter(library.points) : [0, 0] as Point2D;
    const cameraCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(560, 900, 720),
      new THREE.Vector3(westGate[0] + 170, getTerrainHeight(...westGate) + 125, westGate[1] + 150),
      new THREE.Vector3(libraryCenter[0] + 145, getTerrainHeight(...libraryCenter) + 120, libraryCenter[1] + 135),
      new THREE.Vector3(eastGate[0] + 150, getTerrainHeight(...eastGate) + 110, eastGate[1] - 130),
      new THREE.Vector3(420, 620, 520),
    ], true, "centripetal");
    const targetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 15, 0),
      new THREE.Vector3(westGate[0], getTerrainHeight(...westGate) + 7, westGate[1]),
      new THREE.Vector3(libraryCenter[0], getTerrainHeight(...libraryCenter) + (library?.height ?? 15) * 0.35, libraryCenter[1]),
      new THREE.Vector3(eastGate[0], getTerrainHeight(...eastGate) + 7, eastGate[1]),
      new THREE.Vector3(0, 12, 0),
    ], true, "centripetal");
    return { cameraCurve, targetCurve };
  }, []);
  const nextPosition = useMemo(() => new THREE.Vector3(), []);
  const nextTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    elapsed.current = 0;
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) return;
    elapsed.current += delta;
    const progress = (elapsed.current % 48) / 48;
    curves.cameraCurve.getPointAt(progress, nextPosition);
    curves.targetCurve.getPointAt(progress, nextTarget);
    camera.position.lerp(nextPosition, 1 - Math.exp(-delta * 1.6));
    controls.current?.target.lerp(nextTarget, 1 - Math.exp(-delta * 2.2));
    controls.current?.update();
  });

  return null;
}

function WebGLContextWatcher({ onLost, onRestored }: { onLost: () => void; onRestored: () => void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl, onLost, onRestored]);

  return null;
}

class SceneErrorBoundary extends Component<{
  children: ReactNode;
  fallback: ReactNode;
  resetKey: number;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previous: Readonly<{ resetKey: number }>) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SceneUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid h-full min-h-[320px] place-items-center bg-[#e8edf1] px-8 text-center text-[#0f172a]">
      <div className="max-w-xs">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-white text-xl shadow-sm" aria-hidden="true">3D</div>
        <p className="mt-4 text-sm font-extrabold">3D 지도를 표시할 수 없습니다</p>
        <p className="mt-1 text-xs font-medium leading-5 text-[#64748b]">그래픽 연결이 일시적으로 중단되었습니다. 2D 지도를 이용하거나 다시 시도해 주세요.</p>
        <button type="button" onClick={onRetry} className="mt-4 h-10 rounded-lg bg-[#1e3a8a] px-4 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-[#182f70]">
          3D 다시 불러오기
        </button>
      </div>
    </div>
  );
}

function CampusWorld(props: Campus3DSceneProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const route = useMemo(
    () => props.routePath && props.routePath.length > 1 ? props.routePath : createCampusRoute(campusData),
    [props.routePath],
  );
  const routeTrack = useMemo(() => createRouteTrack(route), [route]);
  const stopPositions = useMemo(
    () => (props.routeStops ?? CAMPUS_STOPS).map((stop) => ({
      ...stop,
      position: projectCoordinate(stop.latitude, stop.longitude, campusData.origin),
    })),
    [props.routeStops],
  );
  const boundaryPoints = useMemo(
    () => drapePathToTerrain([...campusData.boundary, campusData.boundary[0]], 0.82, 7),
    [],
  );
  const routeUnderlay = useMemo(() => drapePathToTerrain(route, 3.05, 8), [route]);
  const routeSurface = useMemo(() => drapePathToTerrain(route, 3.12, 8), [route]);

  return (
    <>
      <color attach="background" args={[props.isNight ? "#07111f" : props.weather === "clear" ? "#cfe2ef" : "#aebbc4"]} />
      <fog attach="fog" args={[props.isNight ? "#07111f" : props.weather === "clear" ? "#cfe2ef" : "#aebbc4", props.weather === "rain" ? 520 : 900, props.weather === "rain" ? 1750 : 2600]} />
      {props.isNight ? <Stars radius={650} depth={180} count={1600} factor={4} saturation={0.2} fade speed={0.35} /> : props.weather === "clear" ? <Sky distance={1800} sunPosition={[250, 420, -300]} turbidity={5} rayleigh={1.7} /> : null}
      {props.weather === "rain" ? <Rainfall quality={props.renderQuality} /> : null}
      <ambientLight intensity={props.isNight ? 0.55 : props.weather === "clear" ? 1.55 : 1.05} color={props.isNight ? "#7799c9" : props.weather === "clear" ? "#f6fbff" : "#dce5eb"} />
      <hemisphereLight
        intensity={props.isNight ? 0.7 : props.weather === "clear" ? 1.35 : 0.9}
        color={props.isNight ? "#7294c8" : "#e7f4ff"}
        groundColor={props.isNight ? "#18251e" : "#6f825f"}
      />
      <directionalLight
        castShadow
        position={props.isNight ? [-240, 330, 120] : [280, 480, 180]}
        intensity={props.isNight ? 1.4 : props.weather === "clear" ? 2.8 : 1.15}
        color={props.isNight ? "#93b8ff" : "#fff2d8"}
        shadow-mapSize={props.renderQuality === "high" ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-520}
        shadow-camera-right={520}
        shadow-camera-top={520}
        shadow-camera-bottom={-520}
        shadow-bias={-0.0003}
      />
      <TerrainSurface isNight={props.isNight} />
      <Line
        points={boundaryPoints}
        color={props.isNight ? "#6f857b" : "#748276"}
        lineWidth={0.8}
        transparent
        opacity={0.42}
      />
      {campusData.areas.map((area) => <AreaMesh key={area.id} area={area} isNight={props.isNight} />)}
      <CampusRoadNetwork roads={campusData.roads} isNight={props.isNight} />
      {campusData.buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          selected={building.id === props.selectedBuildingId}
          isNight={props.isNight}
          onSelect={props.onSelectBuilding}
        />
      ))}
      <CampusStructures data={campusData} isNight={props.isNight} />
      {props.showRoute ? (
        <group>
          <Line
            points={routeUnderlay}
            color="#ffffff"
            lineWidth={7}
            depthTest={false}
            renderOrder={30}
          />
          <Line
            points={routeSurface}
            color="#1e3a8a"
            lineWidth={4.2}
            depthTest={false}
            renderOrder={31}
          />
          {stopPositions.map((stop, index) => (
            <group key={stop.id} position={[stop.position[0], getTerrainHeight(stop.position[0], stop.position[1]) + 3.2, stop.position[1]]} onClick={(event) => { event.stopPropagation(); props.onSelectStop(stop); }}>
              <mesh castShadow>
                <cylinderGeometry args={[3.5, 3.5, 1.5, 24]} />
                <meshStandardMaterial color="#ffffff" emissive="#f59e0b" emissiveIntensity={0.15} />
              </mesh>
              <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[2.25, 2.25, 1.7, 24]} />
                <meshStandardMaterial color={props.selectedStopId === stop.id ? "#1e3a8a" : "#f59e0b"} />
              </mesh>
              <Html position={[0, 7, 0]} center occlude zIndexRange={[12, 0]}>
                <button type="button" onClick={(event) => { event.stopPropagation(); props.onSelectStop(stop); }} className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl border py-2 pl-2 pr-3 text-[12px] font-extrabold shadow-[0_8px_22px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:py-1.5 sm:pl-1.5 sm:pr-2.5 sm:text-[10px] ${props.selectedStopId === stop.id ? "border-[#1e3a8a] bg-[#1e3a8a] text-white" : "border-white/85 bg-white/95 text-[#0f172a]"}`}>
                  <span className="grid h-5 w-5 place-items-center rounded-lg bg-[#1e3a8a] text-[9px] font-extrabold text-white">{index + 1}</span>
                  {stop.name}
                </button>
              </Html>
            </group>
          ))}
          {props.liveBuses !== undefined ? props.liveBuses.map((bus) => (
            <LiveShuttleBus key={bus.id} bus={bus} track={routeTrack} routeBehavior={props.routeBehavior ?? "loop"} followed={props.followBusId === bus.id} controls={controls} onFollow={props.onFollowBus} />
          )) : (
            (props.fallbackBusLabels ?? ["학내순환 1호", "학내순환 2호", "학내순환 3호"]).map((label, index, labels) => (
              <ShuttleBus
                key={label}
                track={routeTrack}
                offset={(routeTrack.total * 2 * index) / labels.length}
                running={props.isRunning}
                label={label}
                followed={props.followBusId === label}
                speedMultiplier={props.simulationSpeed}
                routeBehavior={props.routeBehavior ?? "loop"}
                controls={controls}
                onFollow={props.onFollowBus}
              />
            ))
          )}
        </group>
      ) : null}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={-0.7}
        autoRotate={props.autoRotate}
        autoRotateSpeed={0.45}
        minDistance={70}
        maxDistance={6000}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI / 2.08}
        screenSpacePanning={false}
        enabled={!props.isTouring}
      />
      <CameraDirector controls={controls} selectedBuildingId={props.selectedBuildingId} focusTarget={props.focusTarget} initialView={props.initialView} resetVersion={props.resetVersion} />
      <CinematicTour enabled={props.isTouring} controls={controls} />
    </>
  );
}

export default function Campus3DScene(props: Campus3DSceneProps) {
  const [contextLost, setContextLost] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const handleContextLost = useCallback(() => setContextLost(true), []);
  const handleContextRestored = useCallback(() => setContextLost(false), []);
  const retryScene = useCallback(() => {
    setContextLost(false);
    setResetKey((key) => key + 1);
  }, []);
  const fallback = <SceneUnavailable onRetry={retryScene} />;

  if (contextLost) return fallback;

  return (
    <SceneErrorBoundary fallback={fallback} resetKey={resetKey}>
      <Canvas
        key={resetKey}
        shadows={props.renderQuality === "high"}
        dpr={[0.85, props.renderQuality === "high" ? 2 : 1.4]}
        performance={{ min: 0.5, debounce: 320 }}
        camera={{ position: [560, 900, 720], fov: 42, near: 1, far: 8000 }}
        gl={{ antialias: props.renderQuality === "high", powerPreference: "high-performance", alpha: false }}
        onPointerMissed={() => props.onSelectBuilding(null)}
      >
        <WebGLContextWatcher onLost={handleContextLost} onRestored={handleContextRestored} />
        <CampusPerformanceGovernor
          initialFactor={props.renderQuality === "high" ? 0.9 : 0.72}
          minFactor={0.5}
          maxFactor={1}
          fallbackFactor={0.5}
          onMetrics={props.onPerformanceMetrics}
        />
        <CampusWorld {...props} />
      </Canvas>
    </SceneErrorBoundary>
  );
}

export { campusData };
