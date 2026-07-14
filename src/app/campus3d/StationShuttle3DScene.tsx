import { memo, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Sky } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { CampusInitialView, CampusLiveBus } from "./Campus3DScene";
import type { CampusArea, CampusBuilding, CampusRoad, CampusStop, Point2D } from "./types";
import { polygonCenter, projectCoordinate } from "./campus-geometry";
import { stationCorridorData } from "./station-corridor";
import { getStationTerrainHeight, stationTerrainData } from "./station-terrain";
import StationTerrainSurface from "./StationTerrainSurface";

interface StationShuttle3DSceneProps {
  routePath: Point2D[];
  routeStops: CampusStop[];
  liveBuses: CampusLiveBus[];
  initialView: CampusInitialView | null;
  followBusId: string | null;
  selectedStopId: string | null;
  onFollowBus: (busId: string | null) => void;
  onSelectStop: (stop: CampusStop) => void;
  resetVersion: number;
}

type TerrainPoint = [number, number, number];

function drapePath(points: Point2D[], clearance: number, maxSegmentLength = 9): TerrainPoint[] {
  if (points.length < 2) return [];
  const result: TerrainPoint[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / maxSegmentLength));
    for (let step = index === 1 ? 0 : 1; step <= steps; step += 1) {
      const progress = step / steps;
      const x = THREE.MathUtils.lerp(from[0], to[0], progress);
      const z = THREE.MathUtils.lerp(from[1], to[1], progress);
      result.push([x, getStationTerrainHeight(x, z) + clearance, z]);
    }
  }
  return result;
}

function shapeFromPoints(points: Point2D[]) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  return shape;
}

const CorridorRoad = memo(function CorridorRoad({ road }: { road: CampusRoad }) {
  const pedestrian = ["footway", "path", "steps", "cycleway"].includes(road.kind);
  const points = useMemo(() => drapePath(road.points, pedestrian ? 0.65 : 0.95, 8), [pedestrian, road.points]);
  const color = pedestrian
    ? "#e7dcc4"
    : ["trunk", "primary"].includes(road.kind)
      ? "#66747a"
      : ["secondary", "tertiary"].includes(road.kind)
        ? "#7d8b90"
        : "#a8b2b1";
  return (
    <Line
      points={points}
      color={color}
      lineWidth={pedestrian ? 1.15 : Math.min(road.width, 7)}
      transparent={pedestrian}
      opacity={pedestrian ? 0.72 : 1}
    />
  );
});

const CorridorBuilding = memo(function CorridorBuilding({ building }: { building: CampusBuilding }) {
  const center = useMemo(() => polygonCenter(building.points), [building.points]);
  const baseHeight = useMemo(() => getStationTerrainHeight(center[0], center[1]), [center]);
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shapeFromPoints(building.points), {
    depth: building.height,
    bevelEnabled: true,
    bevelSize: 0.35,
    bevelThickness: 0.4,
    bevelSegments: 1,
  }), [building.height, building.points]);
  const roofColor = building.kind === "apartments"
    ? "#e8f0f3"
    : building.kind === "university" || building.kind === "dormitory"
      ? "#f7faf6"
      : "#fffdf5";
  const sideColor = building.kind === "apartments"
    ? "#9fb2bc"
    : building.kind === "university" || building.kind === "dormitory"
      ? "#a8bbb2"
      : "#c1b8a5";

  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, baseHeight, 0]} castShadow receiveShadow>
      <meshStandardMaterial attach="material-0" color={roofColor} roughness={0.64} metalness={0.02} />
      <meshStandardMaterial attach="material-1" color={sideColor} roughness={0.82} metalness={0.01} />
    </mesh>
  );
});

const CorridorArea = memo(function CorridorArea({ area }: { area: CampusArea }) {
  const geometry = useMemo(() => {
    const contour = area.points.map(([x, z]) => new THREE.Vector2(x, z));
    const faces = THREE.ShapeUtils.triangulateShape(contour, []);
    const positions = new Float32Array(area.points.length * 3);
    area.points.forEach(([x, z], index) => {
      positions[index * 3] = x;
      positions[index * 3 + 1] = getStationTerrainHeight(x, z) + 0.28;
      positions[index * 3 + 2] = z;
    });
    const surface = new THREE.BufferGeometry();
    surface.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    surface.setIndex(faces.flat());
    surface.computeVertexNormals();
    return surface;
  }, [area.points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const color = area.kind === "water" ? "#58b6d1" : area.kind === "parking" ? "#9ea9a7" : "#619c68";
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
  );
});

const RailwayLine = memo(function RailwayLine({ railway }: { railway: CampusRoad }) {
  const rail = useMemo(() => drapePath(railway.points, 0.72, 7), [railway.points]);
  return (
    <group>
      <Line points={rail} color="#39484f" lineWidth={2.2} />
      <Line points={rail.map(([x, y, z]) => [x, y + 0.05, z])} color="#e4ecee" lineWidth={0.7} />
    </group>
  );
});

const StationPlatform = memo(function StationPlatform({ platform }: { platform: CampusArea }) {
  const center = useMemo(() => polygonCenter(platform.points), [platform.points]);
  const geometry = useMemo(() => {
    const shape = shapeFromPoints(platform.points);
    return new THREE.ShapeGeometry(shape);
  }, [platform.points]);
  const height = getStationTerrainHeight(center[0], center[1]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 0.9, 0]} receiveShadow>
      <meshStandardMaterial color="#e5e8e6" roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
});

function SinchangStation() {
  const stationPoint = useMemo(
    () => projectCoordinate(stationCorridorData.station.lat, stationCorridorData.station.lng, stationCorridorData.origin),
    [],
  );
  const baseHeight = getStationTerrainHeight(stationPoint[0], stationPoint[1]);
  const rotation = 0.33;

  return (
    <group position={[stationPoint[0] - 25, baseHeight + 0.7, stationPoint[1] + 18]} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[-18, 7, 20]}>
        <boxGeometry args={[58, 14, 19]} />
        <meshStandardMaterial color="#f2f4f3" roughness={0.58} />
      </mesh>
      <mesh castShadow position={[-18, 7.5, 10.2]}>
        <boxGeometry args={[58.5, 12.5, 0.8]} />
        <meshStandardMaterial color="#0878bd" roughness={0.34} metalness={0.14} />
      </mesh>
      <mesh position={[-18, 5.5, 9.7]}>
        <boxGeometry args={[19, 8.5, 0.65]} />
        <meshStandardMaterial color="#8fd0e5" emissive="#5bb9dc" emissiveIntensity={0.12} metalness={0.18} roughness={0.28} />
      </mesh>
      {[-36, -29, -7, 0].map((x) => (
        <mesh key={x} position={[x, 7.4, 9.5]}>
          <boxGeometry args={[1, 12, 1.1]} />
          <meshStandardMaterial color="#e8eef0" roughness={0.5} />
        </mesh>
      ))}
      <mesh castShadow position={[-18, 14.7, 20]}>
        <boxGeometry args={[62, 1.2, 22]} />
        <meshStandardMaterial color="#d7dde0" metalness={0.24} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[24, 8.5, 2]}>
        <boxGeometry args={[16, 4, 34]} />
        <meshStandardMaterial color="#dbe2e3" metalness={0.16} roughness={0.48} />
      </mesh>
      {[-8, 8].map((z) => (
        <group key={z} position={[88, 7.2, z]}>
          <mesh castShadow>
            <boxGeometry args={[150, 1.1, 7.5]} />
            <meshStandardMaterial color="#d9e1e3" metalness={0.2} roughness={0.4} />
          </mesh>
          {[-62, -20, 22, 64].map((x) => (
            <mesh key={x} position={[x, -3.2, 0]}>
              <boxGeometry args={[0.8, 6.4, 0.8]} />
              <meshStandardMaterial color="#64747b" metalness={0.38} roughness={0.42} />
            </mesh>
          ))}
        </group>
      ))}
      <Html position={[-18, 25, 9]} center distanceFactor={430} zIndexRange={[18, 0]}>
        <div className="pointer-events-none flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/90 bg-white/96 px-3 py-2 text-[11px] font-extrabold text-[#0f172a] shadow-[0_10px_28px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-[#0878bd] ring-2 ring-[#d9f2ff]" />
          KORAIL 신창역
        </div>
      </Html>
    </group>
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
    total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
    lengths.push(total);
  }
  return { points, lengths, total };
}

function sampleTrack(track: RouteTrack, distance: number, target: THREE.Vector3) {
  if (track.points.length < 2 || track.total <= 0) return 0;
  const clamped = Math.min(Math.max(distance, 0), track.total);
  let index = track.lengths.findIndex((length) => length >= clamped);
  if (index < 0) index = track.lengths.length - 1;
  const segmentStart = index === 0 ? 0 : track.lengths[index - 1];
  const segmentLength = track.lengths[index] - segmentStart || 1;
  const progress = (clamped - segmentStart) / segmentLength;
  const from = track.points[index];
  const to = track.points[index + 1];
  const x = THREE.MathUtils.lerp(from[0], to[0], progress);
  const z = THREE.MathUtils.lerp(from[1], to[1], progress);
  target.set(x, getStationTerrainHeight(x, z) + 0.8, z);
  return Math.atan2(to[0] - from[0], to[1] - from[1]);
}

function ShuttleBusModel({ bus, track, followed, controls, onFollow }: {
  bus: CampusLiveBus;
  track: RouteTrack;
  followed: boolean;
  controls: React.RefObject<OrbitControlsImpl | null>;
  onFollow: (busId: string | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const distance = useRef(bus.routeProgress ?? 0);
  const target = useMemo(() => new THREE.Vector3(), []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!group.current) return;
    distance.current = THREE.MathUtils.lerp(distance.current, bus.routeProgress ?? distance.current, 1 - Math.exp(-delta * 1.5));
    const angle = sampleTrack(track, distance.current, target);
    group.current.position.copy(target);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, angle, 1 - Math.exp(-delta * 6));
    if (followed) {
      cameraPosition.set(target.x + 36, target.y + 28, target.z + 42);
      cameraTarget.set(target.x, target.y + 3, target.z);
      camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 2.4));
      controls.current?.target.lerp(cameraTarget, 1 - Math.exp(-delta * 3));
      controls.current?.update();
    }
  });

  return (
    <group ref={group} scale={1.45} onClick={(event) => { event.stopPropagation(); onFollow(followed ? null : bus.id); }}>
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[3.1, 2.5, 7.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[3.18, 0.72, 7.5]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.85, 3.72]}>
        <boxGeometry args={[2.65, 0.9, 0.12]} />
        <meshStandardMaterial color="#9ed8ef" emissive="#6dc6e8" emissiveIntensity={0.2} />
      </mesh>
      {[-1.62, 1.62].flatMap((z) => [-1.58, 1.58].map((x) => (
        <mesh key={`${x}-${z}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 12]} />
          <meshStandardMaterial color="#151a1f" />
        </mesh>
      )))}
      <Html position={[0, 6.6, 0]} center zIndexRange={[16, 0]}>
        <button type="button" className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-left text-[10px] font-extrabold shadow-[0_8px_22px_rgba(15,23,42,0.16)] ${followed ? "border-[#1e3a8a] bg-[#1e3a8a] text-white" : "border-white/85 bg-white/95 text-[#1e3a8a]"}`}>
          <span className="h-2 w-2 rounded-full bg-[#22c55e] ring-2 ring-white" />
          <span className="flex flex-col leading-tight">
            <span>{bus.label}</span>
            {bus.etaLabel ? <span className={`mt-0.5 text-[9px] font-bold ${followed ? "text-white/75" : "text-[#64748b]"}`}>{bus.etaLabel} 도착 예정</span> : null}
          </span>
        </button>
      </Html>
    </group>
  );
}

function StationCamera({ controls, initialView, focusLatitude, focusLongitude, resetVersion }: {
  controls: React.RefObject<OrbitControlsImpl | null>;
  initialView: CampusInitialView | null;
  focusLatitude?: number;
  focusLongitude?: number;
  resetVersion: number;
}) {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    if (focusLatitude != null && focusLongitude != null) {
      const [x, z] = projectCoordinate(focusLatitude, focusLongitude, stationCorridorData.origin);
      const terrain = getStationTerrainHeight(x, z);
      const targetPosition = new THREE.Vector3(x + 300, terrain + 240, z + 340);
      const targetLookAt = new THREE.Vector3(x, terrain + 4, z);
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
    }

    const initialTarget = initialView?.target ?? [0, 0];
    if (initialView?.cameraPosition) {
      const targetTerrain = getStationTerrainHeight(initialTarget[0], initialTarget[1]);
      const cameraTerrain = getStationTerrainHeight(initialView.cameraPosition[0], initialView.cameraPosition[1]);
      camera.up.set(0, 1, 0);
      camera.position.set(
        initialView.cameraPosition[0],
        cameraTerrain + (initialView.cameraHeight ?? 145),
        initialView.cameraPosition[1],
      );
      camera.lookAt(initialTarget[0], targetTerrain + 8, initialTarget[1]);
      controls.current?.target.set(initialTarget[0], targetTerrain + 8, initialTarget[1]);
      controls.current?.update();
      return;
    }

    const target: Point2D = [initialTarget[0] + 170, initialTarget[1]];
    const distance = THREE.MathUtils.clamp((initialView?.distance ?? 2450) * 1.2, 2500, 3100);
    const terrain = getStationTerrainHeight(target[0], target[1]);
    camera.up.set(0, 1, 0);
    camera.position.set(
      target[0] + distance * 0.22,
      terrain + distance,
      target[1] + distance * 0.025,
    );
    camera.lookAt(target[0], terrain, target[1]);
    controls.current?.target.set(target[0], terrain, target[1]);
    controls.current?.update();
  }, [camera, controls, focusLatitude, focusLongitude, initialView, resetVersion]);
  return null;
}

function StationWorld(props: StationShuttle3DSceneProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const routeTrack = useMemo(() => createRouteTrack(props.routePath), [props.routePath]);
  const routeSurface = useMemo(() => drapePath(props.routePath, 1.9, 8), [props.routePath]);
  const stops = useMemo(() => props.routeStops.map((stop) => ({
    ...stop,
    position: projectCoordinate(stop.latitude, stop.longitude, stationCorridorData.origin),
  })), [props.routeStops]);
  const focusedStop = props.routeStops.find((stop) => stop.id === props.selectedStopId);

  return (
    <>
      <color attach="background" args={["#dff1f7"]} />
      <fog attach="fog" args={["#dff1f7", 1700, 4000]} />
      <Sky distance={2200} sunPosition={[320, 460, -240]} turbidity={5.5} rayleigh={1.5} />
      <ambientLight intensity={0.9} color="#fbfeff" />
      <hemisphereLight intensity={0.78} color="#eefaff" groundColor="#63855f" />
      <directionalLight castShadow position={[300, 520, 210]} intensity={2.7} color="#fff3d6" shadow-mapSize={[1024, 1024]} shadow-camera-left={-1100} shadow-camera-right={1100} shadow-camera-top={800} shadow-camera-bottom={-800} shadow-bias={-0.0003} />
      <StationTerrainSurface />
      {stationCorridorData.areas.map((area) => <CorridorArea key={area.id} area={area} />)}
      {stationCorridorData.roads.map((road) => <CorridorRoad key={road.id} road={road} />)}
      {stationCorridorData.railways.map((railway) => <RailwayLine key={railway.id} railway={railway} />)}
      {stationCorridorData.platforms.map((platform) => <StationPlatform key={platform.id} platform={platform} />)}
      {stationCorridorData.buildings.map((building) => <CorridorBuilding key={building.id} building={building} />)}
      <SinchangStation />
      <Line points={routeSurface} color="#ffffff" lineWidth={6} depthTest={false} renderOrder={20} />
      <Line points={routeSurface} color="#1e3a8a" lineWidth={3.6} depthTest={false} renderOrder={21} />
      {stops.map((stop, index) => (
        <group key={stop.id} position={[stop.position[0], getStationTerrainHeight(stop.position[0], stop.position[1]) + 2, stop.position[1]]} onClick={(event) => { event.stopPropagation(); props.onSelectStop(stop); }}>
          <mesh castShadow>
            <cylinderGeometry args={[3.5, 3.5, 1.5, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#1e3a8a" emissiveIntensity={0.12} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[2.25, 2.25, 1.7, 24]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>
          <Html position={[0, 7, 0]} center zIndexRange={[14, 0]}>
            <button
              type="button"
              aria-pressed={props.selectedStopId === stop.id}
              onClick={() => props.onSelectStop(stop)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border py-1.5 pl-1.5 pr-2.5 text-[10px] font-extrabold shadow-[0_8px_22px_rgba(15,23,42,0.22)] ${props.selectedStopId === stop.id ? "ring-2 ring-white/90" : ""}`}
              style={{ backgroundColor: "#1e3a8a", borderColor: "rgba(255,255,255,0.9)", color: "#ffffff" }}
            >
              <span className="grid h-5 w-5 place-items-center rounded-lg text-[9px]" style={{ backgroundColor: "#ffffff", color: "#1e3a8a" }}>{index + 1}</span>
              <span className="flex flex-col text-left leading-tight">
                <span>{stop.name}</span>
                {stop.departureLabel ? <span className="mt-0.5 text-[9px] font-bold text-white/75">{stop.departureLabel} 예정</span> : null}
              </span>
            </button>
          </Html>
        </group>
      ))}
      {props.liveBuses.map((bus) => <ShuttleBusModel key={bus.id} bus={bus} track={routeTrack} followed={props.followBusId === bus.id} controls={controls} onFollow={props.onFollowBus} />)}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.58}
        panSpeed={0.78}
        zoomSpeed={0.85}
        minDistance={80}
        maxDistance={3400}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.08}
        screenSpacePanning
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
      <StationCamera
        controls={controls}
        initialView={props.initialView}
        focusLatitude={focusedStop?.latitude}
        focusLongitude={focusedStop?.longitude}
        resetVersion={props.resetVersion}
      />
      <Html position={[0, -200, 0]}>
        <span className="sr-only">{stationTerrainData.attribution}</span>
      </Html>
    </>
  );
}

export default function StationShuttle3DScene(props: StationShuttle3DSceneProps) {
  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.4]}
      performance={{ min: 0.5 }}
      camera={{ position: [300, 1500, 350], fov: 42, near: 1, far: 7000 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
    >
      <StationWorld {...props} />
    </Canvas>
  );
}
