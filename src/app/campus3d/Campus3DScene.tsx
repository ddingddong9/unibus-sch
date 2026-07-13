import { memo, useEffect, useMemo, useRef } from "react";
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
import type { CampusArea, CampusBuilding, CampusData, Point2D } from "./types";

const campusData = campusDataSource as CampusData;
const MAJOR_BUILDINGS = new Set([
  "대학본부",
  "도서관",
  "유니토피아관",
  "공과대학",
  "학생회관",
  "의료과학대",
]);

interface Campus3DSceneProps {
  isNight: boolean;
  isRunning: boolean;
  autoRotate: boolean;
  showRoute: boolean;
  selectedBuildingId: string | null;
  resetVersion: number;
  onSelectBuilding: (building: CampusBuilding | null) => void;
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

const Ground = memo(function Ground({ isNight }: { isNight: boolean }) {
  const geometry = useMemo(
    () => new THREE.ExtrudeGeometry(shapeFromPoints(campusData.boundary), {
      depth: 2.5,
      bevelEnabled: true,
      bevelSize: 1.2,
      bevelThickness: 0.8,
      bevelSegments: 2,
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} geometry={geometry} receiveShadow>
        <meshStandardMaterial color={isNight ? "#16251f" : "#7c9a68"} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.8, 0]} receiveShadow>
        <planeGeometry args={[1800, 1800]} />
        <meshStandardMaterial color={isNight ? "#08110f" : "#e9edeb"} roughness={1} />
      </mesh>
    </>
  );
});

const AreaMesh = memo(function AreaMesh({ area, isNight }: { area: CampusArea; isNight: boolean }) {
  const geometry = useMemo(() => new THREE.ShapeGeometry(shapeFromPoints(area.points)), [area.points]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const color = area.kind === "water"
    ? isNight ? "#123d52" : "#65b7d1"
    : area.kind === "pitch"
      ? isNight ? "#173e2b" : "#4f995e"
      : area.kind === "track"
        ? isNight ? "#5b2d27" : "#bc6558"
        : isNight ? "#233527" : "#8fb17b";

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.88} metalness={area.kind === "water" ? 0.15 : 0} />
    </mesh>
  );
});

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
  const geometry = useMemo(
    () => new THREE.ExtrudeGeometry(shapeFromPoints(building.points), {
      depth: building.height,
      bevelEnabled: true,
      bevelSize: 0.65,
      bevelThickness: 0.7,
      bevelSegments: 1,
    }),
    [building.height, building.points],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 32), [geometry]);
  const center = useMemo(() => polygonCenter(building.points), [building.points]);

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
        position={[0, 0.2, 0]}
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
          points={[...building.points, building.points[0]].map(([x, z]) => [x, building.height * level, z])}
          color={isNight ? "#f6c76d" : "#8fa2a7"}
          lineWidth={selected ? 1.35 : 0.7}
          transparent
          opacity={isNight ? 0.68 : 0.48}
        />
      )) : null}
      {(selected || MAJOR_BUILDINGS.has(building.name)) ? (
        <Html position={[center[0], building.height + 5, center[1]]} center distanceFactor={selected ? 300 : 420} zIndexRange={[20, 0]}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(building);
            }}
            className={`whitespace-nowrap border px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-md transition-colors ${
              selected
                ? "border-amber-300 bg-amber-400 text-slate-950"
                : "border-white/30 bg-slate-950/72 text-white hover:bg-slate-900"
            }`}
          >
            {building.name}
          </button>
        </Html>
      ) : null}
    </group>
  );
});

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
  position.set(
    THREE.MathUtils.lerp(from[0], to[0], progress),
    0.75,
    THREE.MathUtils.lerp(from[1], to[1], progress),
  );
  return {
    angle: Math.atan2(to[0] - from[0], to[1] - from[1]),
  };
}

function ShuttleBus({ track, offset, running, label }: { track: RouteTrack; offset: number; running: boolean; label: string }) {
  const group = useRef<THREE.Group>(null);
  const distance = useRef(offset);
  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const targetEuler = useMemo(() => new THREE.Euler(), []);
  const targetPosition = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!group.current || track.points.length < 2) return;
    if (running) distance.current += delta * 10.5;
    const sample = sampleRoute(track, distance.current, targetPosition);
    group.current.position.copy(targetPosition);
    targetEuler.set(0, sample.angle, 0);
    targetQuaternion.setFromEuler(targetEuler);
    group.current.quaternion.slerp(targetQuaternion, 1 - Math.exp(-delta * 7));
  });

  return (
    <group ref={group} scale={1.5}>
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
      <Html position={[0, 6.6, 0]} center distanceFactor={330} zIndexRange={[16, 0]}>
        <div className="flex items-center gap-1.5 whitespace-nowrap border border-blue-300/70 bg-blue-600 px-2 py-1 text-[9px] font-black text-white shadow-lg">
          <span className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-emerald-300" : "bg-slate-300"}`} />
          {label}
        </div>
      </Html>
    </group>
  );
}

function CameraDirector({
  controls,
  selectedBuildingId,
  resetVersion,
}: {
  controls: React.RefObject<OrbitControlsImpl | null>;
  selectedBuildingId: string | null;
  resetVersion: number;
}) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const selected = campusData.buildings.find((building) => building.id === selectedBuildingId);
    const target = selected ? polygonCenter(selected.points) : [0, 0];
    const targetPosition = selected
      ? new THREE.Vector3(target[0] + 105, Math.max(selected.height + 72, 90), target[1] + 125)
      : new THREE.Vector3(560, 900, 720);
    const targetLookAt = new THREE.Vector3(target[0], selected ? selected.height * 0.25 : 0, target[1]);
    const startPosition = camera.position.clone();
    const startTarget = controls.current?.target.clone() ?? new THREE.Vector3();
    const startedAt = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const rawProgress = Math.min((now - startedAt) / 780, 1);
      const progress = 1 - (1 - rawProgress) ** 3;
      camera.position.lerpVectors(startPosition, targetPosition, progress);
      controls.current?.target.lerpVectors(startTarget, targetLookAt, progress);
      controls.current?.update();
      if (rawProgress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [camera, controls, resetVersion, selectedBuildingId]);

  return null;
}

function CampusWorld(props: Campus3DSceneProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const route = useMemo(() => createCampusRoute(campusData), []);
  const routeTrack = useMemo(() => createRouteTrack(route), [route]);
  const stopPositions = useMemo(
    () => CAMPUS_STOPS.map((stop) => ({
      ...stop,
      position: projectCoordinate(stop.latitude, stop.longitude, campusData.origin),
    })),
    [],
  );

  return (
    <>
      <color attach="background" args={[props.isNight ? "#07111f" : "#cfe2ef"]} />
      <fog attach="fog" args={[props.isNight ? "#07111f" : "#cfe2ef", 680, 1500]} />
      {props.isNight ? <Stars radius={650} depth={180} count={1600} factor={4} saturation={0.2} fade speed={0.35} /> : <Sky distance={1800} sunPosition={[250, 420, -300]} turbidity={5} rayleigh={1.7} />}
      <ambientLight intensity={props.isNight ? 0.55 : 1.55} color={props.isNight ? "#7799c9" : "#f6fbff"} />
      <hemisphereLight
        intensity={props.isNight ? 0.7 : 1.35}
        color={props.isNight ? "#7294c8" : "#e7f4ff"}
        groundColor={props.isNight ? "#18251e" : "#6f825f"}
      />
      <directionalLight
        castShadow
        position={props.isNight ? [-240, 330, 120] : [280, 480, 180]}
        intensity={props.isNight ? 1.4 : 2.8}
        color={props.isNight ? "#93b8ff" : "#fff2d8"}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-520}
        shadow-camera-right={520}
        shadow-camera-top={520}
        shadow-camera-bottom={-520}
        shadow-bias={-0.0003}
      />
      <Ground isNight={props.isNight} />
      {campusData.areas.map((area) => <AreaMesh key={area.id} area={area} isNight={props.isNight} />)}
      <group position={[0, 0.55, 0]}>
        {campusData.roads.map((road) => {
          const pedestrian = ["footway", "path", "steps", "cycleway"].includes(road.kind);
          return (
            <Line
              key={road.id}
              points={road.points.map(([x, z]) => [x, 0, z])}
              color={pedestrian ? props.isNight ? "#59665f" : "#d8cfba" : props.isNight ? "#27323a" : "#5b6265"}
              lineWidth={pedestrian ? 1.2 : Math.min(road.width, 5.5)}
              transparent
              opacity={pedestrian ? 0.72 : 1}
            />
          );
        })}
      </group>
      {campusData.buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          selected={building.id === props.selectedBuildingId}
          isNight={props.isNight}
          onSelect={props.onSelectBuilding}
        />
      ))}
      {props.showRoute ? (
        <group>
          <Line points={route.map(([x, z]) => [x, 2, z])} color="#f59e0b" lineWidth={5.5} transparent opacity={0.94} />
          <Line points={route.map(([x, z]) => [x, 2.05, z])} color="#fff7d6" lineWidth={1.25} transparent opacity={0.85} />
          {stopPositions.map((stop, index) => (
            <group key={stop.id} position={[stop.position[0], 2.2, stop.position[1]]}>
              <mesh castShadow>
                <cylinderGeometry args={[3.5, 3.5, 1.5, 24]} />
                <meshStandardMaterial color="#ffffff" emissive="#f59e0b" emissiveIntensity={0.15} />
              </mesh>
              <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[2.25, 2.25, 1.7, 24]} />
                <meshStandardMaterial color="#f59e0b" />
              </mesh>
              <Html position={[0, 7, 0]} center distanceFactor={360} zIndexRange={[12, 0]}>
                <div className="flex items-center gap-1.5 whitespace-nowrap border border-white/30 bg-slate-950/78 px-2 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md">
                  <span className="grid h-4 w-4 place-items-center bg-amber-400 text-[9px] font-bold text-slate-950">{index + 1}</span>
                  {stop.name}
                </div>
              </Html>
            </group>
          ))}
          <ShuttleBus track={routeTrack} offset={0} running={props.isRunning} label="SCH 01" />
          <ShuttleBus track={routeTrack} offset={routeTrack.total / 3} running={props.isRunning} label="SCH 02" />
          <ShuttleBus track={routeTrack} offset={(routeTrack.total * 2) / 3} running={props.isRunning} label="SCH 03" />
        </group>
      ) : null}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.075}
        autoRotate={props.autoRotate}
        autoRotateSpeed={0.45}
        minDistance={70}
        maxDistance={1120}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI / 2.08}
        screenSpacePanning={false}
      />
      <CameraDirector controls={controls} selectedBuildingId={props.selectedBuildingId} resetVersion={props.resetVersion} />
    </>
  );
}

export default function Campus3DScene(props: Campus3DSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [560, 900, 720], fov: 42, near: 1, far: 2400 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      onPointerMissed={() => props.onSelectBuilding(null)}
    >
      <CampusWorld {...props} />
    </Canvas>
  );
}

export { campusData };
