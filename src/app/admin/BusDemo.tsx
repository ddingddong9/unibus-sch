import { useEffect, useMemo, useRef, useState } from "react";
import { Bus, Play, Square, RotateCcw, MonitorPlay, MapPin, AlertTriangle } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";
import { createRouteTrack, distanceMeters, headingAtDistance, sampleTrack, type RouteTrack } from "../utils/routeMotion";

type DemoKind = "campus" | "commuter";

interface Point {
  lat: number;
  lng: number;
}

interface DemoBusPlan {
  busId: string;
  name: string;
  kind: DemoKind;
  label: string;
  track: RouteTrack;
  progressMeters: number;
  speedMetersPerSecond: number;
  direction: 1 | -1;
  pingPong: boolean;
  routeId: string | null;
  original: {
    type: string;
    status: string;
    currentRouteId: string | null;
  };
}

const CAMPUS_STOPS: Point[] = [
  { lat: 36.772760, lng: 126.933816 },
  { lat: 36.768228, lng: 126.935383 },
  { lat: 36.767905, lng: 126.932505 },
  { lat: 36.768856, lng: 126.931303 },
  { lat: 36.769014, lng: 126.927978 },
  { lat: 36.772760, lng: 126.933816 },
];

const COMMUTER_TO_CHEONAN: Point[] = [
  { lat: 36.769014, lng: 126.927978 },
  { lat: 36.781200, lng: 126.984500 },
  { lat: 36.793500, lng: 127.061000 },
  { lat: 36.806500, lng: 127.148000 },
  { lat: 36.769014, lng: 126.927978 },
];

const COMMUTER_TO_ASAN: Point[] = [
  { lat: 36.769014, lng: 126.927978 },
  { lat: 36.774500, lng: 126.972000 },
  { lat: 36.782000, lng: 127.004000 },
  { lat: 36.789200, lng: 127.011900 },
  { lat: 36.769014, lng: 126.927978 },
];

function pathFromNaver(path: [number, number][] | undefined, fallback: Point[]) {
  if (!path || path.length < 2) return fallback;
  return path.map(([lng, lat]) => ({ lat, lng }));
}

function isClosedPath(path: Point[]) {
  if (path.length < 3) return false;
  return distanceMeters(path[0], path[path.length - 1]) < 80;
}

export default function BusDemo() {
  const [plans, setPlans] = useState<DemoBusPlan[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoverableSession, setRecoverableSession] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("데모를 시작하면 기존 등록 버스 최대 5대가 발표용 경로로 움직입니다.");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const plansRef = useRef<DemoBusPlan[]>([]);
  const busyRef = useRef(false);
  const lastTickRef = useRef<number | null>(null);

  const campusPath = useMemo(() => CAMPUS_STOPS, []);
  const commuterPaths = useMemo(() => [
    COMMUTER_TO_CHEONAN,
    COMMUTER_TO_ASAN,
  ], []);

  useEffect(() => {
    void api.getDemoSession().then((session) => {
      if (!session) return;
      setRecoverableSession(true);
      setStatus(`이전 데모 세션이 ${new Date(session.startedAt).toLocaleString("ko-KR")}부터 남아 있습니다. '데모 종료'를 눌러 원래 차량 상태를 복구해 주세요.`);
    }).catch(() => setError("서버의 데모 복구 상태를 확인하지 못했습니다."));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const tick = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const now = performance.now();
      const elapsedSeconds = lastTickRef.current ? Math.min((now - lastTickRef.current) / 1000, 1) : 0.5;
      lastTickRef.current = now;

      const nextPlans = plansRef.current.map((plan) => {
        const trackLength = plan.track.lengthMeters;
        if (trackLength <= 0) return plan;

        let progressMeters = plan.progressMeters + plan.speedMetersPerSecond * elapsedSeconds * plan.direction;
        let direction = plan.direction;

        if (plan.pingPong) {
          if (progressMeters >= trackLength) {
            progressMeters = trackLength - (progressMeters - trackLength);
            direction = -1;
          } else if (progressMeters <= 0) {
            progressMeters = Math.abs(progressMeters);
            direction = 1;
          }
        } else {
          progressMeters = ((progressMeters % trackLength) + trackLength) % trackLength;
        }

        return { ...plan, progressMeters, direction };
      });

      const results = await Promise.allSettled(nextPlans.map((plan) => {
        const point = sampleTrack(plan.track, plan.progressMeters);
        const headingDistance = plan.direction === 1
          ? plan.progressMeters
          : Math.max(plan.progressMeters - 12, 0);
        const heading = plan.direction === 1
          ? headingAtDistance(plan.track, headingDistance)
          : (headingAtDistance(plan.track, headingDistance) + 180) % 360;
        return api.updateBusLocation(plan.busId, {
          lat: point.lat,
          lng: point.lng,
          speed: Math.round(plan.speedMetersPerSecond * 3.6),
          heading,
        });
      }));
      const failedCount = results.filter((result) => result.status === "rejected").length;
      if (failedCount > 0) {
        setError(`${failedCount}대 위치 갱신이 실패했습니다. 나머지 버스는 계속 운행 중입니다.`);
      } else {
        setError("");
      }
      plansRef.current = nextPlans;
      setPlans(nextPlans);
    } finally {
      busyRef.current = false;
    }
  };

  const startDemo = async () => {
    if (running || loading || recoverableSession) return;
    setLoading(true);
    setError("");

    try {
      const [buses, routes] = await Promise.all([api.getBuses(), api.getRoutes()]);
      if (buses.length === 0) {
        throw new Error("데모를 실행할 등록 버스가 없습니다. 버스 관리에서 버스를 먼저 등록해 주세요.");
      }

      const commuterRoutes = routes.filter((route: any) => route.type === "commuter");
      setStatus("네이버 경로 API에서 발표용 도로 경로를 불러오는 중입니다.");

      const campusRoadPath = await api.getCampusRoutePath()
        .then(({ path }) => pathFromNaver(path, campusPath))
        .catch(() => campusPath);

      const commuterRoadPaths = await Promise.all(
        commuterPaths.map(async (fallbackPath, index) => {
          const route = commuterRoutes[index % Math.max(commuterRoutes.length, 1)];
          if (!route?.id) return fallbackPath;

          return api.getRoutePath(route.id)
            .then(({ path }) => pathFromNaver(path, fallbackPath))
            .catch(() => fallbackPath);
        })
      );

      const selected = buses.slice(0, Math.min(5, buses.length));
      const campusTargetCount = Math.min(3, selected.length);
      const commuterTargetCount = selected.length - campusTargetCount;
      const nextPlans: DemoBusPlan[] = selected.map((bus: any, index: number) => {
        const kind: DemoKind = index < campusTargetCount ? "campus" : "commuter";
        const commuterIndex = Math.max(index - campusTargetCount, 0);
        const route = kind === "commuter" ? commuterRoutes[commuterIndex % Math.max(commuterRoutes.length, 1)] : null;
        const basePath = kind === "campus" ? campusRoadPath : commuterRoadPaths[commuterIndex % commuterRoadPaths.length];
        const track = createRouteTrack(basePath, kind === "campus" ? 4 : 10);
        const similarKindCount = Math.max(kind === "campus" ? campusTargetCount : commuterTargetCount, 1);
        const similarKindIndex = kind === "campus" ? index : commuterIndex;
        const progressMeters = track.lengthMeters > 0
          ? (track.lengthMeters / similarKindCount) * similarKindIndex
          : 0;
        return {
          busId: bus.id,
          name: bus.name,
          kind,
          label: kind === "campus" ? `학내순환 ${index + 1}` : `통학버스 ${commuterIndex + 1}`,
          track,
          progressMeters,
          speedMetersPerSecond: kind === "campus" ? 6.5 : 15,
          direction: 1,
          pingPong: kind === "commuter" || !isClosedPath(basePath),
          routeId: route?.id ?? null,
          original: {
            type: bus.type,
            status: bus.status,
            currentRouteId: bus.currentRoute?.id ?? null,
          },
        };
      });

      await api.startDemoSession(nextPlans.map((plan) => ({
        busId: plan.busId,
        kind: plan.kind,
        routeId: plan.routeId,
        label: plan.label,
      })));
      setRecoverableSession(true);

      plansRef.current = nextPlans;
      setPlans(nextPlans);
      lastTickRef.current = null;
      await tick();
      intervalRef.current = setInterval(tick, 500);
      setRunning(true);
      setStatus(`데모 운행 중입니다. ${nextPlans.length}대 위치가 경로 폴리라인 위에서 거리 기반으로 갱신됩니다.`);
    } catch (err: any) {
      setError(err.message || "데모 시작에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const stopDemo = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setLoading(true);
    setError("");

    try {
      await api.stopDemoSession();
      plansRef.current = [];
      setPlans([]);
      setRecoverableSession(false);
      setStatus("데모를 종료하고 서버에 저장된 복구 지점으로 버스 상태를 되돌렸습니다.");
    } catch (err: any) {
      setError(err.message || "데모 종료에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    if (running || recoverableSession || plansRef.current.length > 0) {
      await stopDemo();
    }
    plansRef.current = [];
    setPlans([]);
    setStatus("데모가 초기화되었습니다.");
  };

  const campusCount = plans.filter((plan) => plan.kind === "campus").length;
  const commuterCount = plans.filter((plan) => plan.kind === "commuter").length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="mb-2 font-['Public_Sans'] text-[26px] font-bold text-[#0f172a] sm:text-[32px]">운행 데모</h1>
          <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
            학술제 발표용으로 여러 버스가 동시에 움직이는 상황을 재생합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <h2 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[20px]">발표용 시뮬레이션</h2>
                <p className="font-['Public_Sans'] text-[#94a3b8] text-[13px] mt-1">
                  시작하면 3대는 학내순환, 2대는 통학버스 경로로 반복 운행합니다.
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-[12px] font-['Public_Sans'] font-semibold ${
                running ? "bg-green-100 text-green-700" : recoverableSession ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
              }`}>
                {running ? "데모 실행 중" : recoverableSession ? "복구 필요" : "대기 중"}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="font-['Public_Sans'] text-[13px] font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="font-['Public_Sans'] text-[#94a3b8] text-[12px] mb-2">전체 데모 버스</p>
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-[#1e3b8a]" />
                  <span className="font-['Public_Sans'] font-bold text-[#0f172a] text-[26px]">{plans.length || 5}</span>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="font-['Public_Sans'] text-[#94a3b8] text-[12px] mb-2">학내순환</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-['Public_Sans'] font-bold text-[#0f172a] text-[26px]">{campusCount || 3}</span>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="font-['Public_Sans'] text-[#94a3b8] text-[12px] mb-2">통학버스</p>
                <div className="flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-green-600" />
                  <span className="font-['Public_Sans'] font-bold text-[#0f172a] text-[26px]">{commuterCount || 2}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {(plans.length > 0 ? plans : Array.from({ length: 5 })).map((plan: any, index) => {
                const kind: DemoKind = plan?.kind ?? (index < 3 ? "campus" : "commuter");
                const progress = plan?.track?.lengthMeters
                  ? Math.round((plan.progressMeters / plan.track.lengthMeters) * 100)
                  : 0;
                return (
                  <div key={plan?.busId ?? index} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          kind === "campus" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                        }`}>
                          <Bus className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">
                            {plan?.name ?? (kind === "campus" ? `학내순환 데모 ${index + 1}` : `통학버스 데모 ${index - 2}`)}
                          </p>
                          <p className="font-['Public_Sans'] text-[#94a3b8] text-[12px]">
                            {kind === "campus" ? "교내 순환 경로 반복" : "학교와 외부 지역 사이 이동"}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-['Public_Sans'] font-semibold ${
                        kind === "campus" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {kind === "campus" ? "학내순환" : "통학버스"}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${kind === "campus" ? "bg-blue-600" : "bg-green-600"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={startDemo}
                disabled={running || loading || recoverableSession}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3b8a] text-white rounded-lg font-['Public_Sans'] font-semibold text-[14px] hover:bg-[#1e3b8a]/90 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {loading && !running ? "준비 중..." : "데모 시작"}
              </button>
              <button
                onClick={stopDemo}
                disabled={(!running && !recoverableSession) || loading}
                className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 rounded-lg font-['Public_Sans'] font-semibold text-[14px] hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Square className="w-4 h-4" />
                데모 종료
              </button>
              <button
                onClick={resetDemo}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-[#64748b] rounded-lg font-['Public_Sans'] font-semibold text-[14px] hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </button>
            </div>
          </div>

          <aside className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
            <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[18px] mb-3">발표 순서</h3>
            <div className="space-y-3">
              {[
                "데모 시작을 누릅니다.",
                "이 관리자 화면을 켜둔 채 사용자 화면을 엽니다.",
                "학내순환 화면에서는 순환 버스 3대가 움직입니다.",
                "통학버스 화면에서는 외부로 이동하는 버스 2대가 보입니다.",
                "발표가 끝나면 데모 종료를 누릅니다.",
              ].map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1e3b8a]/10 text-[#1e3b8a] flex items-center justify-center shrink-0 font-['Public_Sans'] font-bold text-[12px]">
                    {index + 1}
                  </span>
                  <p className="font-['Public_Sans'] text-[#64748b] text-[13px] leading-6">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 p-4 rounded-lg bg-amber-50 border border-amber-100">
              <p className="font-['Public_Sans'] text-amber-800 text-[12px] leading-5">
                데모 시작 시 서버가 차량 원본 상태를 저장합니다. 화면을 새로고침해도 ‘데모 종료’를 누르면 원래 상태로 복구할 수 있습니다.
              </p>
            </div>
            <p className="mt-4 font-['Public_Sans'] text-[#64748b] text-[13px] leading-6">{status}</p>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
