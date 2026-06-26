import { useEffect, useMemo, useRef, useState } from "react";
import { Bus, Play, Square, RotateCcw, MonitorPlay, MapPin, AlertTriangle } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";

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
  path: Point[];
  index: number;
  stepSize: number;
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

function interpolatePath(points: Point[], stepsPerSegment: number) {
  return points.flatMap((from, i) => {
    const to = points[i + 1];
    if (!to) return [];
    return Array.from({ length: stepsPerSegment }, (_, step) => {
      const t = step / stepsPerSegment;
      return {
        lat: from.lat + (to.lat - from.lat) * t,
        lng: from.lng + (to.lng - from.lng) * t,
      };
    });
  });
}

function pathFromNaver(path: [number, number][] | undefined, fallback: Point[]) {
  if (!path || path.length < 2) return fallback;
  return path.map(([lng, lat]) => ({ lat, lng }));
}

function heading(from: Point, to: Point) {
  const y = Math.sin((to.lng - from.lng) * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180);
  const x =
    Math.cos(from.lat * Math.PI / 180) * Math.sin(to.lat * Math.PI / 180) -
    Math.sin(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.cos((to.lng - from.lng) * Math.PI / 180);
  return Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
}

export default function BusDemo() {
  const [plans, setPlans] = useState<DemoBusPlan[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("데모를 시작하면 기존 등록 버스 5대가 발표용 경로로 움직입니다.");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const plansRef = useRef<DemoBusPlan[]>([]);
  const busyRef = useRef(false);

  const campusPath = useMemo(() => interpolatePath(CAMPUS_STOPS, 18), []);
  const commuterPaths = useMemo(() => [
    interpolatePath(COMMUTER_TO_CHEONAN, 28),
    interpolatePath(COMMUTER_TO_ASAN, 28),
  ], []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const tick = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const nextPlans = plansRef.current.map((plan) => {
      const nextIndex = (plan.index + plan.stepSize) % plan.path.length;
      return { ...plan, index: nextIndex };
    });

    try {
      await Promise.all(nextPlans.map((plan) => {
        const point = plan.path[plan.index];
        const nextPoint = plan.path[(plan.index + 1) % plan.path.length];
        return api.updateBusLocation(plan.busId, {
          lat: point.lat,
          lng: point.lng,
          speed: plan.kind === "campus" ? 18 : 54,
          heading: heading(point, nextPoint),
        });
      }));
      plansRef.current = nextPlans;
      setPlans(nextPlans);
    } finally {
      busyRef.current = false;
    }
  };

  const startDemo = async () => {
    if (running || loading) return;
    setLoading(true);
    setError("");

    try {
      const [buses, routes] = await Promise.all([api.getBuses(), api.getRoutes()]);
      if (buses.length < 5) {
        throw new Error("데모는 등록된 버스가 최소 5대 필요합니다. 버스 관리에서 버스를 먼저 등록해 주세요.");
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

      const selected = buses.slice(0, 5);
      const nextPlans: DemoBusPlan[] = selected.map((bus: any, index: number) => {
        const kind: DemoKind = index < 3 ? "campus" : "commuter";
        const route = kind === "commuter" ? commuterRoutes[(index - 3) % Math.max(commuterRoutes.length, 1)] : null;
        const basePath = kind === "campus" ? campusRoadPath : commuterRoadPaths[(index - 3) % commuterRoadPaths.length];
        const offsetPath = basePath.map((point, pointIndex) => basePath[(pointIndex + index * 12) % basePath.length]);
        return {
          busId: bus.id,
          name: bus.name,
          kind,
          label: kind === "campus" ? `학내순환 ${index + 1}` : `통학버스 ${index - 2}`,
          path: offsetPath,
          index: 0,
          stepSize: kind === "campus" ? 1 : 2,
          routeId: route?.id ?? null,
          original: {
            type: bus.type,
            status: bus.status,
            currentRouteId: bus.currentRoute?.id ?? null,
          },
        };
      });

      await Promise.all(nextPlans.map((plan) =>
        api.updateBus(plan.busId, {
          type: plan.kind,
          status: "active",
          currentRouteId: plan.routeId,
          isRunning: false,
        })
      ));

      plansRef.current = nextPlans;
      setPlans(nextPlans);
      await tick();
      intervalRef.current = setInterval(tick, 1200);
      setRunning(true);
      setStatus("데모 운행 중입니다. 이 관리자 화면을 열어둔 상태에서 사용자 화면을 확인하세요.");
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
      await Promise.all(plansRef.current.map((plan) =>
        api.updateBus(plan.busId, {
          type: plan.original.type,
          status: plan.original.status,
          currentRouteId: plan.original.currentRouteId,
          isRunning: false,
        })
      ));
      setStatus("데모를 종료하고 버스 상태를 시작 전으로 되돌렸습니다.");
    } catch (err: any) {
      setError(err.message || "데모 종료에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    await stopDemo();
    plansRef.current = [];
    setPlans([]);
    setStatus("데모가 초기화되었습니다.");
  };

  const campusCount = plans.filter((plan) => plan.kind === "campus").length;
  const commuterCount = plans.filter((plan) => plan.kind === "commuter").length;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">운행 데모</h1>
          <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
            학술제 발표용으로 여러 버스가 동시에 움직이는 상황을 재생합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[20px]">발표용 시뮬레이션</h2>
                <p className="font-['Public_Sans'] text-[#94a3b8] text-[13px] mt-1">
                  시작하면 3대는 학내순환, 2대는 통학버스 경로로 반복 운행합니다.
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-[12px] font-['Public_Sans'] font-semibold ${
                running ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {running ? "데모 실행 중" : "대기 중"}
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
                const progress = plan?.path?.length ? Math.round((plan.index / plan.path.length) * 100) : 0;
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
                disabled={running || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3b8a] text-white rounded-lg font-['Public_Sans'] font-semibold text-[14px] hover:bg-[#1e3b8a]/90 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {loading && !running ? "준비 중..." : "데모 시작"}
              </button>
              <button
                onClick={stopDemo}
                disabled={!running || loading}
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
                데모는 실제 원격 DB에 위치 데이터를 넣습니다. 발표 후 데모 종료를 눌러 버스 상태를 되돌려 주세요.
              </p>
            </div>
            <p className="mt-4 font-['Public_Sans'] text-[#64748b] text-[13px] leading-6">{status}</p>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
