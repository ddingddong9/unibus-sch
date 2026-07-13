import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BusFront,
  ChevronDown,
  Clock3,
  Map as MapIcon,
  MapPin,
  RefreshCw,
  Ticket,
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import RouteMapModal from "../components/RouteMapModal";
import UserPageHeader from "../components/UserPageHeader";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import type { BusRoute } from "../types";
import { parseScheduleTimes } from "../utils/shuttleSchedule";

type Direction = "to-school" | "from-school";
type LiveRoute = { position: { lat: number; lng: number }; etaMins: number };

const getColor = (color?: string) => color || "#1e3a8a";

function getDirection(route: BusRoute): Direction | null {
  if (/\[출발\]|등교|학교행/.test(route.name)) return "to-school";
  if (/\[도착\]|하교|귀가/.test(route.name)) return "from-school";
  return null;
}

function cleanRouteName(name: string) {
  return name.replace(/\s*\[(출발|도착)\]\s*/g, " ").replace(/\s+/g, " ").trim();
}

function formatFare(fare?: string) {
  if (!fare) return "요금 확인";
  const digits = fare.replace(/[^0-9]/g, "");
  if (!digits) return fare;
  return `${Number(digits).toLocaleString("ko-KR")}원`;
}

function nextSchedule(schedule?: string) {
  const times = parseScheduleTimes(schedule);
  if (times.length === 0) return null;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const next = times.find((time) => time.hour * 60 + time.minute >= nowMinutes);
  return next ? { label: next.label, tomorrow: false } : { label: times[0].label, tomorrow: true };
}

function openPayco() {
  const fallbackUrl = /iPhone|iPad/i.test(navigator.userAgent)
    ? "https://apps.apple.com/kr/app/payco/id924292361"
    : "https://play.google.com/store/apps/details?id=com.nhnent.payapp";
  window.location.href = "payco://";
  window.setTimeout(() => {
    if (document.visibilityState === "visible") window.location.href = fallbackUrl;
  }, 1_500);
}

export default function CommuterBusWrapper() {
  const { t } = useLanguage();
  const [direction, setDirection] = useState<Direction>("to-school");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeModalId, setRouteModalId] = useState<string | null>(null);
  const [routeBusMap, setRouteBusMap] = useState<Record<string, LiveRoute>>({});
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allRoutes = await api.getRoutes();
      setRoutes(allRoutes.filter((route) => route.type === "commuter"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("노선 정보를 불러오지 못했습니다.", "Unable to load routes."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  useEffect(() => {
    if (routes.length === 0) return;
    const destinationByRegion: Record<string, { lat: number; lng: number }> = {
      서울: { lat: 37.497, lng: 127.047 },
      인천: { lat: 37.456, lng: 126.705 },
    };
    const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const radius = 6371;
      const toRad = (value: number) => (value * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
      return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
    };
    const fetchLive = async () => {
      if (document.hidden) return;
      try {
        const [buses, locations] = await Promise.all([api.getBuses(), api.getBusLocations()]);
        const locationMap = new Map(locations.map((location) => [location.busId, location]));
        const nextMap: Record<string, LiveRoute> = {};
        buses.filter((bus: any) => bus.type === "commuter" && bus.status === "active").forEach((bus: any) => {
          const routeId = bus.currentRoute?.id ?? bus.currentRouteId;
          const location = locationMap.get(bus.id);
          if (!routeId || !location) return;
          const route = routes.find((item) => item.id === routeId);
          const destination = destinationByRegion[route?.region ?? ""];
          nextMap[routeId] = {
            position: { lat: location.lat, lng: location.lng },
            etaMins: destination ? Math.max(1, Math.round(haversineKm(location, destination))) : 0,
          };
        });
        setRouteBusMap(nextMap);
      } catch {
        // Live positions are optional; the timetable remains available.
      }
    };
    const onVisibility = () => !document.hidden && fetchLive();
    fetchLive();
    document.addEventListener("visibilitychange", onVisibility);
    liveIntervalRef.current = setInterval(fetchLive, 15_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [routes]);

  const directionRoutes = useMemo(
    () => routes.filter((route) => getDirection(route) === direction || getDirection(route) === null),
    [direction, routes],
  );
  const regions = useMemo(
    () => Array.from(new Set(directionRoutes.map((route) => route.region).filter((region): region is string => Boolean(region)))),
    [directionRoutes],
  );
  const filteredRoutes = useMemo(
    () => directionRoutes
      .filter((route) => selectedRegion === "all" || route.region === selectedRegion)
      .sort((a, b) => (nextSchedule(a.schedule)?.label ?? "99:99").localeCompare(nextSchedule(b.schedule)?.label ?? "99:99")),
    [directionRoutes, selectedRegion],
  );

  const changeDirection = (next: Direction) => {
    setDirection(next);
    setSelectedRegion("all");
    setExpandedRoute(null);
  };

  return (
    <div className="relative size-full bg-[#f4f6f9]">
      <main className="h-[100dvh] overflow-y-auto pb-[112px] scrollbar-hide">
        <UserPageHeader
          title={t("통학버스", "Commuter Bus")}
          subtitle={t("지역별 운행 시간과 정류장", "Regional times and stops")}
          action={<BusFront size={21} className="text-[#1e3a8a]" />}
        />

        <div className="border-b border-[#e3e8ef] bg-[#f4f6f9] px-4 py-3">
          <div className="grid grid-cols-2 rounded-lg bg-[#e5eaf0] p-1">
            {(["to-school", "from-school"] as Direction[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeDirection(item)}
                className={`h-9 rounded-md font-['Public_Sans'] text-[13px] font-bold transition-all ${direction === item ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"}`}
              >
                {item === "to-school" ? t("등교", "To school") : t("하교", "From school")}
              </button>
            ))}
          </div>
          {regions.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {["all", ...regions].map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={`h-8 shrink-0 rounded-md px-3 font-['Public_Sans'] text-[12px] font-semibold ${selectedRegion === region ? "bg-[#1e3a8a] text-white" : "border border-[#d8dee7] bg-white text-[#64748b]"}`}
                >
                  {region === "all" ? t("전체 지역", "All regions") : region}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 px-4 py-4">
          {loading && Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[142px] animate-pulse rounded-lg border border-[#e2e8f0] bg-white p-4">
              <div className="mb-4 h-4 w-2/3 rounded bg-[#edf1f5]" />
              <div className="mb-2 h-7 w-1/3 rounded bg-[#edf1f5]" />
              <div className="h-3 w-1/2 rounded bg-[#edf1f5]" />
            </div>
          ))}

          {!loading && error && (
            <div className="rounded-lg border border-[#fecaca] bg-white px-5 py-10 text-center">
              <RefreshCw size={26} className="mx-auto mb-3 text-[#ef4444]" />
              <p className="font-['Public_Sans'] text-[15px] font-bold text-[#0f172a]">{t("노선을 불러오지 못했습니다", "Unable to load routes")}</p>
              <p className="mt-1 break-words font-['Public_Sans'] text-[12px] text-[#64748b]">{error}</p>
              <button type="button" onClick={loadRoutes} className="mt-5 h-10 rounded-lg bg-[#1e3a8a] px-5 font-['Public_Sans'] text-[13px] font-bold text-white">{t("다시 시도", "Retry")}</button>
            </div>
          )}

          {!loading && !error && filteredRoutes.map((route) => {
            const expanded = expandedRoute === route.id;
            const color = getColor(route.color);
            const next = nextSchedule(route.schedule);
            const times = parseScheduleTimes(route.schedule);
            const live = routeBusMap[route.id];
            return (
              <article key={route.id} className="overflow-hidden rounded-lg border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <button type="button" onClick={() => setExpandedRoute(expanded ? null : route.id)} className="w-full p-4 text-left active:bg-[#f8fafc]">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: color }}><BusFront size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        {route.region && <span className="rounded bg-[#eef2f7] px-1.5 py-0.5 font-['Public_Sans'] text-[10px] font-bold text-[#526074]">{route.region}</span>}
                        <span className={`rounded px-1.5 py-0.5 font-['Public_Sans'] text-[10px] font-bold ${direction === "to-school" ? "bg-[#e8f0ff] text-[#1d4ed8]" : "bg-[#e8f8f1] text-[#087f5b]"}`}>
                          {direction === "to-school" ? t("등교", "To school") : t("하교", "From school")}
                        </span>
                        {live && <span className="flex items-center gap-1 rounded bg-[#ecfdf3] px-1.5 py-0.5 font-['Public_Sans'] text-[10px] font-bold text-[#15803d]"><span className="size-1.5 rounded-full bg-[#22c55e]" />{t("운행 중", "Live")}</span>}
                      </div>
                      <h2 className="truncate font-['Public_Sans'] text-[16px] font-bold leading-6 text-[#0f172a]">{cleanRouteName(route.name)}</h2>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div>
                          <p className="font-['Public_Sans'] text-[10px] font-semibold text-[#94a3b8]">{t("다음 출발", "Next departure")}</p>
                          <p className="font-['Public_Sans'] text-[23px] font-black leading-7 text-[#1e3a8a]">{next?.label ?? "시간 확인"}</p>
                          {next?.tomorrow && <p className="font-['Public_Sans'] text-[10px] text-[#64748b]">{t("내일 첫차", "Tomorrow")}</p>}
                        </div>
                        <div className="text-right">
                          <p className="flex items-center justify-end gap-1 font-['Public_Sans'] text-[12px] font-semibold text-[#334155]"><Ticket size={13} />{formatFare(route.fare)}</p>
                          <p className="mt-1 flex items-center justify-end gap-1 font-['Public_Sans'] text-[11px] text-[#64748b]"><Clock3 size={12} />{route.duration || t("소요시간 확인", "Check duration")}</p>
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={18} className={`mt-1 shrink-0 text-[#94a3b8] transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-[#edf1f5] px-4 pb-4 pt-4">
                    {times.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 font-['Public_Sans'] text-[11px] font-bold text-[#64748b]">{t("운행 시간", "Departure times")}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {times.map((time) => <span key={time.label} className="rounded-md bg-[#f1f5f9] px-2.5 py-1.5 font-['Public_Sans'] text-[12px] font-semibold text-[#334155]">{time.label}</span>)}
                        </div>
                      </div>
                    )}
                    <p className="mb-2 font-['Public_Sans'] text-[11px] font-bold text-[#64748b]">{t("정류장", "Stops")}</p>
                    <div className="space-y-0">
                      {route.stops?.length ? route.stops.map((stop, index) => (
                        <div key={stop.id} className="flex min-h-10 gap-3">
                          <div className="flex w-5 flex-col items-center">
                            <span className="mt-1 size-2.5 rounded-full border-2 bg-white" style={{ borderColor: color }} />
                            {index < route.stops.length - 1 && <span className="w-px flex-1 bg-[#cbd5e1]" />}
                          </div>
                          <p className="pb-3 font-['Public_Sans'] text-[13px] font-semibold text-[#334155]">{stop.name}</p>
                        </div>
                      )) : <p className="font-['Public_Sans'] text-[12px] text-[#94a3b8]">{t("등록된 정류장이 없습니다", "No stops registered")}</p>}
                    </div>
                    {route.description && <p className="mt-2 rounded-lg bg-[#f8fafc] p-3 font-['Public_Sans'] text-[12px] leading-5 text-[#64748b]">{route.description}</p>}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setRouteModalId(route.id)} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#1e3a8a] font-['Public_Sans'] text-[13px] font-bold text-[#1e3a8a]"><MapIcon size={16} />{t("지도 보기", "Map")}</button>
                      <button type="button" onClick={route.isActive ? openPayco : undefined} disabled={!route.isActive} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#fa2828] font-['Public_Sans'] text-[13px] font-bold text-white disabled:bg-[#94a3b8]"><Ticket size={16} />{route.isActive ? t("PAYCO 예약", "Book") : t("운행 중단", "Suspended")}</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {!loading && !error && filteredRoutes.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-white px-6 py-14 text-center">
              <MapPin size={28} className="mx-auto mb-3 text-[#94a3b8]" />
              <p className="font-['Public_Sans'] text-[15px] font-bold text-[#0f172a]">{t("등록된 노선이 없습니다", "No routes found")}</p>
              <p className="mt-1 font-['Public_Sans'] text-[12px] text-[#64748b]">{t("다른 방향이나 지역을 선택해 보세요", "Try another direction or region")}</p>
            </div>
          )}
        </div>
      </main>
      {routeModalId && (() => {
        const route = routes.find((item) => item.id === routeModalId);
        return route ? <RouteMapModal route={route} color={getColor(route.color)} onClose={() => setRouteModalId(null)} /> : null;
      })()}
      <BottomNav />
    </div>
  );
}
