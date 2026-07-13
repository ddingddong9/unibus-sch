import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  BusFront,
  Compass,
  Expand,
  Layers3,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  Rotate3D,
  RotateCcw,
  Route,
  Search,
  Sun,
  X,
} from "lucide-react";
import Campus3DScene, { campusData } from "./Campus3DScene";
import { buildingCategory, CAMPUS_STOPS, projectCoordinate } from "./campus-geometry";
import type { CampusBuilding } from "./types";
import { terrainData } from "./terrain";

const LANDMARKS = [
  { id: "main-gate", label: "정문 아치", point: projectCoordinate(CAMPUS_STOPS[4].latitude, CAMPUS_STOPS[4].longitude, campusData.origin), height: 16 },
  { id: "rear-gate", label: "후문 보행 데크", point: projectCoordinate(CAMPUS_STOPS[0].latitude, CAMPUS_STOPS[0].longitude, campusData.origin), height: 16 },
] as const;

function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#d7e5eb] text-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-900/15 border-t-amber-500" />
          <Building2 className="absolute inset-0 m-auto h-5 w-5" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold">캠퍼스 디지털 트윈 구성 중</p>
          <p className="mt-1 text-xs text-slate-600">건물·도로·실제 고도 지형을 불러오고 있습니다</p>
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
      className={`grid h-11 w-11 shrink-0 place-items-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        active
          ? "border-amber-300 bg-amber-400 text-slate-950"
          : "border-white/14 bg-slate-950/78 text-white hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

export default function Campus3DPage() {
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

  const buildings = useMemo(
    () => [...campusData.buildings].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [],
  );
  const filteredBuildings = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko");
    if (!normalized) return buildings;
    return buildings.filter((building) => building.name.toLocaleLowerCase("ko").includes(normalized));
  }, [buildings, query]);
  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
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
  };

  const selectLandmark = (landmark: (typeof LANDMARKS)[number]) => {
    setSelectedBuilding(null);
    setFocusTarget({ x: landmark.point[0], z: landmark.point[1], height: landmark.height, label: landmark.label });
    setDirectoryOpen(false);
    setAutoRotate(false);
  };

  return (
    <main ref={shellRef} className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden bg-slate-950 font-['Public_Sans'] text-white">
      <Suspense fallback={<SceneLoading />}>
        <Campus3DScene
          isNight={isNight}
          isRunning={isRunning}
          autoRotate={autoRotate}
          showRoute={showRoute}
          selectedBuildingId={selectedBuilding?.id ?? null}
          focusTarget={focusTarget}
          resetVersion={resetVersion}
          onSelectBuilding={(building) => {
            setSelectedBuilding(building);
            if (building) setFocusTarget(null);
          }}
        />
      </Suspense>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3 border border-white/14 bg-slate-950/82 px-3 py-2.5 shadow-xl backdrop-blur-xl sm:px-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center bg-amber-400 text-slate-950">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-black sm:text-base">순천향대학교 3D 캠퍼스</h1>
              <span className="hidden border border-emerald-400/35 bg-emerald-400/12 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 sm:inline">LIVE PROTOTYPE</span>
            </div>
            <p className="truncate text-[10px] font-medium text-slate-400 sm:text-xs">아산 캠퍼스 · 인터랙티브 디지털 트윈</p>
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
        className={`absolute bottom-0 left-0 top-0 z-40 w-full max-w-[340px] border-r border-white/10 bg-slate-950/94 p-4 shadow-2xl backdrop-blur-2xl transition-transform duration-300 sm:p-5 ${
          directoryOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!directoryOpen}
      >
        <div className="flex items-center justify-between pt-16 sm:pt-18">
          <div>
            <p className="text-lg font-black">건물 탐색</p>
            <p className="text-xs text-slate-400">{campusData.buildings.length}개 캠퍼스 시설</p>
          </div>
          <button
            type="button"
            aria-label="건물 탐색 닫기"
            onClick={() => setDirectoryOpen(false)}
            className="grid h-10 w-10 place-items-center border border-white/12 text-slate-300 hover:bg-white/8 hover:text-white"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
        <label className="relative mt-5 block">
          <span className="sr-only">건물 이름 검색</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="건물 이름 검색"
            className="h-11 w-full border border-white/12 bg-white/6 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {LANDMARKS.map((landmark) => (
            <button
              key={landmark.id}
              type="button"
              onClick={() => selectLandmark(landmark)}
              className="border border-white/12 bg-white/6 px-3 py-2.5 text-left text-xs font-bold text-slate-200 transition-colors hover:border-amber-400/60 hover:bg-amber-400/10"
            >
              {landmark.label}
            </button>
          ))}
        </div>
        <div className="mt-3 h-[calc(100dvh-242px)] space-y-1 overflow-y-auto pr-1 [scrollbar-color:#475569_transparent] [scrollbar-width:thin]">
          {filteredBuildings.map((building) => (
            <button
              key={building.id}
              type="button"
              onClick={() => selectFromDirectory(building)}
              className={`flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors ${
                selectedBuilding?.id === building.id
                  ? "border-amber-400/70 bg-amber-400/12"
                  : "border-transparent hover:border-white/10 hover:bg-white/6"
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center bg-white/7 text-slate-300">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-100">{building.name}</span>
                <span className="block text-[10px] text-slate-500">{buildingCategory(building)} · 약 {Math.round(building.height)}m</span>
              </span>
            </button>
          ))}
          {filteredBuildings.length === 0 ? <p className="px-3 py-10 text-center text-sm text-slate-500">검색 결과가 없습니다</p> : null}
        </div>
      </aside>

      <section className="pointer-events-none absolute bottom-5 left-5 z-20 hidden lg:block">
        <div className="pointer-events-auto flex items-stretch border border-white/14 bg-slate-950/80 shadow-xl backdrop-blur-xl">
          {[
            { icon: Building2, value: campusData.buildings.length, label: "건물" },
            { icon: Layers3, value: campusData.areas.length, label: "시설 영역" },
            { icon: Route, value: 5, label: "정류장" },
            { icon: BusFront, value: 3, label: "운행 차량" },
          ].map((item, index) => (
            <div key={item.label} className={`flex min-w-[94px] items-center gap-2.5 px-3 py-2.5 ${index > 0 ? "border-l border-white/10" : ""}`}>
              <item.icon className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-black leading-none">{item.value}</p>
                <p className="mt-1 text-[9px] font-semibold text-slate-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedBuilding ? (
        <aside className="absolute bottom-[76px] right-3 z-30 w-[min(310px,calc(100%-24px))] border border-white/14 bg-slate-950/88 p-4 shadow-2xl backdrop-blur-xl sm:bottom-20 sm:right-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-block bg-amber-400 px-2 py-0.5 text-[9px] font-black text-slate-950">{buildingCategory(selectedBuilding)}</span>
              <h2 className="mt-2 truncate text-lg font-black">{selectedBuilding.name}</h2>
            </div>
            <button
              type="button"
              aria-label="건물 정보 닫기"
              onClick={() => setSelectedBuilding(null)}
              className="grid h-9 w-9 shrink-0 place-items-center border border-white/12 text-slate-400 hover:bg-white/8 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-px bg-white/10">
            <div className="bg-slate-950/90 p-3">
              <p className="text-[9px] font-bold text-slate-500">추정 높이</p>
              <p className="mt-1 text-base font-black">{Math.round(selectedBuilding.height)}m</p>
            </div>
            <div className="bg-slate-950/90 p-3">
              <p className="text-[9px] font-bold text-slate-500">지도 객체</p>
              <p className="mt-1 truncate text-base font-black">#{selectedBuilding.id.slice(-6)}</p>
            </div>
          </div>
        </aside>
      ) : null}

      {focusTarget && !selectedBuilding ? (
        <aside className="absolute bottom-[76px] right-3 z-30 w-[min(280px,calc(100%-24px))] border border-white/14 bg-slate-950/88 p-4 shadow-2xl backdrop-blur-xl sm:bottom-20 sm:right-5">
          <span className="inline-block bg-sky-400 px-2 py-0.5 text-[9px] font-black text-slate-950">주요 구조물</span>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{focusTarget.label}</h2>
            <button type="button" aria-label="구조물 정보 닫기" onClick={() => setFocusTarget(null)} className="grid h-9 w-9 shrink-0 place-items-center border border-white/12 text-slate-400 hover:bg-white/8 hover:text-white">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>
      ) : null}

      <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 border border-white/14 bg-slate-950/84 p-1.5 shadow-2xl backdrop-blur-xl sm:bottom-5">
        <IconButton label="건물 탐색" active={directoryOpen} onClick={() => setDirectoryOpen((open) => !open)}>
          <Layers3 className="h-4.5 w-4.5" aria-hidden="true" />
        </IconButton>
        <span className="mx-0.5 h-7 w-px bg-white/10" />
        <IconButton label={isRunning ? "셔틀 일시정지" : "셔틀 운행 재생"} active={isRunning} onClick={() => setIsRunning((running) => !running)}>
          {isRunning ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
        </IconButton>
        <IconButton label="셔틀 경로 표시" active={showRoute} onClick={() => setShowRoute((visible) => !visible)}>
          <Route className="h-4.5 w-4.5" aria-hidden="true" />
        </IconButton>
        <IconButton label="자동 회전" active={autoRotate} onClick={() => setAutoRotate((rotating) => !rotating)}>
          <Rotate3D className="h-4.5 w-4.5" aria-hidden="true" />
        </IconButton>
        <IconButton label={isNight ? "주간 모드" : "야간 모드"} active={isNight} onClick={() => setIsNight((night) => !night)}>
          {isNight ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </IconButton>
        <span className="mx-0.5 hidden h-7 w-px bg-white/10 sm:block" />
        <div className="hidden sm:block">
          <IconButton label="처음 시점으로" onClick={resetView}>
            <Compass className="h-4.5 w-4.5" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 right-5 hidden items-center gap-2 text-[9px] font-semibold text-slate-600 lg:flex">
        <Expand className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{campusData.attribution} · {terrainData.attribution}</span>
      </div>
    </main>
  );
}
