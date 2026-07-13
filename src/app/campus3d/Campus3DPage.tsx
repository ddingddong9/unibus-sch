import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  BusFront,
  Cloud,
  CloudRain,
  CloudSun,
  Compass,
  Expand,
  Gauge,
  Film,
  Layers3,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  Presentation,
  Rotate3D,
  RotateCcw,
  Route,
  Search,
  Sun,
  Sparkles,
  X,
} from "lucide-react";
import Campus3DScene, { campusData, type CampusWeather, type RenderQuality } from "./Campus3DScene";
import { applyCampusRouteRules, buildingCategory, projectCoordinate } from "./campus-geometry";
import { CAMPUS_LANDMARKS, getCampusLandmarkPoint } from "./campus-landmarks";
import type { CampusBuilding, CampusStop, Point2D } from "./types";
import { terrainData } from "./terrain";
import { api } from "../services/api";

const LANDMARKS = [
  { ...CAMPUS_LANDMARKS.westGate, point: getCampusLandmarkPoint(CAMPUS_LANDMARKS.westGate, campusData.origin) },
  { ...CAMPUS_LANDMARKS.hyangseolEastGate, point: getCampusLandmarkPoint(CAMPUS_LANDMARKS.hyangseolEastGate, campusData.origin) },
] as const;

function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#f6f6f8] text-[#0f172a]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.1)]">
          <div className="absolute inset-0 animate-spin rounded-2xl border-2 border-[#dbe4ef] border-t-[#1e3a8a]" />
          <BusFront className="h-5 w-5 text-[#1e3a8a]" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-sm font-extrabold">3D 캠퍼스를 불러오고 있어요</p>
          <p className="mt-1 text-xs text-[#64748b]">건물과 캠퍼스 지형을 준비 중입니다</p>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30 ${
        active
          ? "border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-[0_6px_18px_rgba(30,58,138,0.22)]"
          : "border-[#e2e8f0] bg-white/95 text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#1e3a8a]"
      }`}
    >
      {children}
    </button>
  );
}

interface Campus3DPageProps {
  embedded?: boolean;
}

export default function Campus3DPage({ embedded = false }: Campus3DPageProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ x: number; z: number; height: number; label: string } | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resetVersion, setResetVersion] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteRoute, setRemoteRoute] = useState<Point2D[] | null>(null);
  const [remoteStops, setRemoteStops] = useState<CampusStop[] | null>(null);
  const [followBusId, setFollowBusId] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<CampusStop | null>(null);
  const [weather, setWeather] = useState<CampusWeather>("clear");
  const [renderQuality, setRenderQuality] = useState<RenderQuality>("balanced");
  const [isTouring, setIsTouring] = useState(false);

  const buildings = useMemo(
    () => [...campusData.buildings].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [],
  );
  const filteredBuildings = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko");
    if (!normalized) return buildings;
    return buildings.filter((building) => building.name.toLocaleLowerCase("ko").includes(normalized));
  }, [buildings, query]);
  const sceneFocusTarget = useMemo(() => {
    if (focusTarget) return focusTarget;
    if (!selectedStop) return null;
    const [x, z] = projectCoordinate(selectedStop.latitude, selectedStop.longitude, campusData.origin);
    return { x, z, height: 4, label: selectedStop.name };
  }, [focusTarget, selectedStop]);
  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  useEffect(() => {
    let active = true;
    api.getCampusRoutePath()
      .then(({ path, stops }) => {
        if (!active || path.length < 2) return;
        const projected = path.map(([lng, lat]) => projectCoordinate(lat, lng, campusData.origin));
        const first = projected[0];
        const last = projected[projected.length - 1];
        if (Math.hypot(first[0] - last[0], first[1] - last[1]) > 1) projected.push(first);
        setRemoteRoute(applyCampusRouteRules(projected, campusData));
        const validStops = stops
          .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
          .map((stop, index) => ({
            id: stop.id || `campus-stop-${index}`,
            name: stop.name,
            latitude: stop.lat,
            longitude: stop.lng,
          }));
        if (validStops.length > 1) setRemoteStops(validStops);
      })
      .catch(() => {
        if (active) {
          setRemoteRoute(null);
          setRemoteStops(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDirectoryOpen(false);
      setSelectedBuilding(null);
      setFocusTarget(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resetView = () => {
    setSelectedBuilding(null);
    setFocusTarget(null);
    setAutoRotate(false);
    setFollowBusId(null);
    setSelectedStop(null);
    setIsTouring(false);
    setResetVersion((version) => version + 1);
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shellRef.current?.requestFullscreen();
  };

  const selectFromDirectory = (building: CampusBuilding) => {
    setSelectedBuilding(building);
    setFocusTarget(null);
    setDirectoryOpen(false);
    setAutoRotate(false);
    setFollowBusId(null);
    setSelectedStop(null);
    setPresentationOpen(false);
    setIsTouring(false);
  };

  const selectLandmark = (landmark: (typeof LANDMARKS)[number]) => {
    setSelectedBuilding(null);
    setFocusTarget({ x: landmark.point[0], z: landmark.point[1], height: landmark.height, label: landmark.label });
    setDirectoryOpen(false);
    setAutoRotate(false);
    setFollowBusId(null);
    setSelectedStop(null);
    setPresentationOpen(false);
    setIsTouring(false);
  };

  return (
    <main
      ref={shellRef}
      className={`relative min-h-[560px] w-full overflow-hidden bg-[#e8edf1] font-['Public_Sans'] text-[#0f172a] ${
        embedded ? "h-full" : "h-[100dvh]"
      }`}
    >
      <Suspense fallback={<SceneLoading />}>
        <Campus3DScene
          isNight={isNight}
          isRunning={isRunning}
          autoRotate={autoRotate}
          showRoute={showRoute}
          selectedBuildingId={selectedBuilding?.id ?? null}
          focusTarget={sceneFocusTarget}
          routePath={remoteRoute}
          routeStops={remoteStops}
          followBusId={followBusId}
          simulationSpeed={simulationSpeed}
          weather={weather}
          renderQuality={renderQuality}
          isTouring={isTouring}
          onFollowBus={setFollowBusId}
          resetVersion={resetVersion}
          onSelectBuilding={(building) => {
            setSelectedBuilding(building);
            if (building) {
              setFocusTarget(null);
              setFollowBusId(null);
              setSelectedStop(null);
              setPresentationOpen(false);
              setIsTouring(false);
            }
          }}
          selectedStopId={selectedStop?.id ?? null}
          onSelectStop={(stop) => {
            setSelectedStop(stop);
            setSelectedBuilding(null);
            setFocusTarget(null);
            setFollowBusId(null);
            setPresentationOpen(false);
            setIsTouring(false);
          }}
        />
      </Suspense>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 pt-[max(12px,env(safe-area-inset-top))] sm:p-5">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/92 px-3 py-2.5 shadow-[0_10px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1e3a8a] text-white shadow-[0_6px_16px_rgba(30,58,138,0.24)]">
            <BusFront className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-[#1e3a8a]">UNIBUS</p>
            <h1 className="truncate text-sm font-extrabold text-[#0f172a] sm:text-base">
              {embedded ? "3D 캠퍼스 관리" : "순천향대학교 3D 캠퍼스"}
            </h1>
          </div>
        </div>

        <div className="pointer-events-auto hidden items-center gap-2 sm:flex">
          <IconButton label="건물 탐색" active={directoryOpen} onClick={() => setDirectoryOpen((open) => !open)}>
            <Search className="h-4.5 w-4.5" aria-hidden="true" />
          </IconButton>
          <IconButton label="처음 시점으로" onClick={resetView}>
            <RotateCcw className="h-4.5 w-4.5" aria-hidden="true" />
          </IconButton>
          <IconButton label={isFullscreen ? "전체화면 종료" : "전체화면"} active={isFullscreen} onClick={() => void toggleFullscreen()}>
            {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </IconButton>
        </div>
      </header>

      <aside
        className={`absolute bottom-0 left-0 top-0 z-40 w-full max-w-[360px] border-r border-[#e2e8f0] bg-white/96 p-4 text-[#0f172a] shadow-[20px_0_60px_rgba(15,23,42,0.16)] backdrop-blur-2xl transition-transform duration-300 sm:p-5 ${
          directoryOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!directoryOpen}
        inert={!directoryOpen}
      >
        <div className="flex items-center justify-between pt-16 sm:pt-18">
          <div>
            <p className="text-lg font-extrabold">캠퍼스 둘러보기</p>
            <p className="text-xs font-medium text-[#64748b]">건물과 주요 출입구를 찾아보세요</p>
          </div>
          <button
            type="button"
            aria-label="건물 탐색 닫기"
            onClick={() => setDirectoryOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#1e3a8a]"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
        <label className="relative mt-5 block">
          <span className="sr-only">건물 이름 검색</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="건물 이름 검색"
            className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] pl-10 pr-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/10"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {LANDMARKS.map((landmark) => (
            <button
              key={landmark.id}
              type="button"
              onClick={() => selectLandmark(landmark)}
              className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2.5 text-left text-xs font-bold text-[#1e3a8a] transition-colors hover:border-[#1e3a8a]/30 hover:bg-[#eef3ff]"
            >
              {landmark.label}
            </button>
          ))}
        </div>
        <div className="mt-3 h-[calc(100dvh-242px)] space-y-1 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
          {filteredBuildings.map((building) => (
            <button
              key={building.id}
              type="button"
              onClick={() => selectFromDirectory(building)}
              className={`flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors ${
                selectedBuilding?.id === building.id
                  ? "border-[#1e3a8a]/20 bg-[#eef3ff]"
                  : "border-transparent hover:border-[#e2e8f0] hover:bg-[#f8fafc]"
              }`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selectedBuilding?.id === building.id ? "bg-[#1e3a8a] text-white" : "bg-[#f1f5f9] text-[#64748b]"}`}>
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[#0f172a]">{building.name}</span>
                <span className="block text-[10px] text-[#64748b]">{buildingCategory(building)} · 약 {Math.round(building.height)}m</span>
              </span>
            </button>
          ))}
          {filteredBuildings.length === 0 ? <p className="px-3 py-10 text-center text-sm text-[#64748b]">검색 결과가 없습니다</p> : null}
        </div>
      </aside>

      <section className="pointer-events-none absolute bottom-5 left-5 z-20 hidden lg:block">
        <div className="pointer-events-auto flex items-stretch overflow-hidden rounded-2xl border border-white/80 bg-white/92 shadow-[0_10px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          {[
            { icon: Building2, value: campusData.buildings.length, label: "건물" },
            { icon: Layers3, value: campusData.areas.length, label: "시설 영역" },
            { icon: Route, value: remoteStops?.length ?? 5, label: "정류장" },
            { icon: BusFront, value: 3, label: "운행 차량" },
          ].map((item, index) => (
            <div key={item.label} className={`flex min-w-[94px] items-center gap-2.5 px-3 py-2.5 ${index > 0 ? "border-l border-[#e2e8f0]" : ""}`}>
              <item.icon className="h-4 w-4 text-[#1e3a8a]" aria-hidden="true" />
              <div>
                <p className="text-sm font-extrabold leading-none text-[#0f172a]">{item.value}</p>
                <p className="mt-1 text-[9px] font-semibold text-[#64748b]">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedBuilding ? (
        <aside className="absolute bottom-[82px] right-3 z-30 w-[min(310px,calc(100%-24px))] rounded-2xl border border-white/80 bg-white/94 p-4 text-[#0f172a] shadow-[0_14px_38px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:bottom-24 sm:right-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-[#eef3ff] px-2.5 py-1 text-[9px] font-extrabold text-[#1e3a8a]">{buildingCategory(selectedBuilding)}</span>
              <h2 className="mt-2 truncate text-lg font-extrabold">{selectedBuilding.name}</h2>
            </div>
            <button
              type="button"
              aria-label="건물 정보 닫기"
              onClick={() => setSelectedBuilding(null)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e3a8a]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <p className="text-[9px] font-bold text-[#64748b]">건물 높이</p>
              <p className="mt-1 text-base font-extrabold">약 {Math.round(selectedBuilding.height)}m</p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <p className="text-[9px] font-bold text-[#64748b]">시설 분류</p>
              <p className="mt-1 truncate text-sm font-extrabold">{buildingCategory(selectedBuilding)}</p>
            </div>
          </div>
        </aside>
      ) : null}

      {focusTarget && !selectedBuilding ? (
        <aside className="absolute bottom-[82px] right-3 z-30 w-[min(280px,calc(100%-24px))] rounded-2xl border border-white/80 bg-white/94 p-4 text-[#0f172a] shadow-[0_14px_38px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:bottom-24 sm:right-5">
          <span className="inline-block rounded-full bg-[#eef3ff] px-2.5 py-1 text-[9px] font-extrabold text-[#1e3a8a]">주요 출입구</span>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">{focusTarget.label}</h2>
            <button type="button" aria-label="구조물 정보 닫기" onClick={() => setFocusTarget(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e3a8a]">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>
      ) : null}

      {selectedStop && !selectedBuilding && !focusTarget ? (
        <aside className="absolute bottom-[82px] right-3 z-30 w-[min(280px,calc(100%-24px))] rounded-2xl border border-white/80 bg-white/94 p-4 text-[#0f172a] shadow-[0_14px_38px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:bottom-24 sm:right-5">
          <span className="inline-block rounded-full bg-[#eef3ff] px-2.5 py-1 text-[9px] font-extrabold text-[#1e3a8a]">학내순환 정류장</span>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">{selectedStop.name}</h2>
              <p className="mt-1 text-[11px] font-medium text-[#64748b]">노선 위 정류장 위치로 이동했습니다</p>
            </div>
            <button type="button" aria-label="정류장 정보 닫기" onClick={() => setSelectedStop(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e3a8a]">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>
      ) : null}

      {presentationOpen ? (
        <section className="absolute bottom-[82px] left-1/2 z-30 w-[min(440px,calc(100%-24px))] -translate-x-1/2 rounded-2xl border border-white/80 bg-white/94 p-3 shadow-[0_14px_38px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:bottom-24">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-[#0f172a]">발표 운행 제어</p>
              <p className="text-[10px] font-medium text-[#64748b]">속도와 추적 차량을 선택하세요</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-[#f1f5f9] p-1">
              {[0.5, 1, 2].map((speed) => (
                <button key={speed} type="button" onClick={() => setSimulationSpeed(speed)} className={`h-8 min-w-10 rounded-lg px-2 text-[10px] font-extrabold ${simulationSpeed === speed ? "bg-[#1e3a8a] text-white" : "text-[#64748b] hover:text-[#1e3a8a]"}`}>
                  {speed}x
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {["SCH 01", "SCH 02", "SCH 03"].map((busId) => (
              <button key={busId} type="button" onClick={() => setFollowBusId((current) => current === busId ? null : busId)} className={`h-9 rounded-xl border text-[10px] font-extrabold ${followBusId === busId ? "border-[#1e3a8a] bg-[#eef3ff] text-[#1e3a8a]" : "border-[#e2e8f0] bg-white text-[#64748b]"}`}>
                {busId}
              </button>
            ))}
            <button type="button" onClick={() => setFollowBusId(null)} className="h-9 rounded-xl border border-[#e2e8f0] bg-white text-[10px] font-extrabold text-[#64748b]">
              전체 보기
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-[#e2e8f0] pt-2">
            {([
              { value: "clear", label: "맑음", icon: CloudSun },
              { value: "cloudy", label: "흐림", icon: Cloud },
              { value: "rain", label: "비", icon: CloudRain },
            ] as const).map((item) => (
              <button key={item.value} type="button" onClick={() => setWeather(item.value)} className={`flex h-9 items-center justify-center gap-1.5 rounded-xl border text-[10px] font-extrabold ${weather === item.value ? "border-[#1e3a8a] bg-[#eef3ff] text-[#1e3a8a]" : "border-[#e2e8f0] bg-white text-[#64748b]"}`}>
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => { setFollowBusId(null); setAutoRotate(false); setSelectedBuilding(null); setSelectedStop(null); setFocusTarget(null); setIsTouring((touring) => !touring); }} className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-[10px] font-extrabold ${isTouring ? "border-[#1e3a8a] bg-[#1e3a8a] text-white" : "border-[#e2e8f0] bg-white text-[#475569]"}`}>
              <Film className="h-4 w-4" aria-hidden="true" />
              {isTouring ? "캠퍼스 투어 종료" : "캠퍼스 자동 투어"}
            </button>
            <button type="button" onClick={() => setRenderQuality((quality) => quality === "balanced" ? "high" : "balanced")} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white text-[10px] font-extrabold text-[#475569]">
              <Sparkles className="h-4 w-4 text-[#1e3a8a]" aria-hidden="true" />
              {renderQuality === "high" ? "고화질" : "균형 화질"}
            </button>
          </div>
        </section>
      ) : null}

      <div className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/80 bg-white/92 p-1.5 shadow-[0_14px_38px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:bottom-5 sm:gap-1.5">
        <IconButton label="건물 탐색" active={directoryOpen} onClick={() => setDirectoryOpen((open) => !open)}>
          <Layers3 className="h-4.5 w-4.5" aria-hidden="true" />
        </IconButton>
        <span className="mx-0.5 h-7 w-px bg-[#e2e8f0]" />
        <IconButton label={isRunning ? "셔틀 일시정지" : "셔틀 운행 재생"} active={isRunning} onClick={() => setIsRunning((running) => !running)}>
          {isRunning ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
        </IconButton>
        <IconButton label="셔틀 경로 표시" active={showRoute} onClick={() => setShowRoute((visible) => !visible)}>
          <Route className="h-4.5 w-4.5" aria-hidden="true" />
        </IconButton>
        <IconButton label="자동 회전" active={autoRotate} onClick={() => { setFollowBusId(null); setIsTouring(false); setAutoRotate((rotating) => !rotating); }}>
          <Rotate3D className="h-4.5 w-4.5" aria-hidden="true" />
        </IconButton>
        <IconButton label={isNight ? "주간 모드" : "야간 모드"} active={isNight} onClick={() => setIsNight((night) => !night)}>
          {isNight ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </IconButton>
        <IconButton label="발표 운행 제어" active={presentationOpen} onClick={() => { setSelectedStop(null); setSelectedBuilding(null); setFocusTarget(null); setPresentationOpen((open) => !open); }}>
          {presentationOpen ? <Gauge className="h-4.5 w-4.5" /> : <Presentation className="h-4.5 w-4.5" />}
        </IconButton>
        <span className="mx-0.5 hidden h-7 w-px bg-[#e2e8f0] sm:block" />
        <div className="hidden sm:block">
          <IconButton label="처음 시점으로" onClick={resetView}>
            <Compass className="h-4.5 w-4.5" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 right-5 hidden items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[9px] font-semibold text-[#64748b] shadow-sm backdrop-blur-lg lg:flex">
        <Expand className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{campusData.attribution} · {terrainData.attribution}</span>
      </div>
    </main>
  );
}
