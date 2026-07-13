import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Bell,
  BusFront,
  Clock3,
  MapPin,
  Navigation,
  Route,
  TrainFront,
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import type { BusRoute, Notice } from "../types";
import { formatServiceTime, getNextShuttleService } from "../utils/shuttleSchedule";

const FALLBACK_STOPS = [
  { id: "rear-gate", name: "후문", location: { lat: 36.77276, lng: 126.933816 }, order: 0 },
  { id: "hyang3", name: "향설생활관 3", location: { lat: 36.768228, lng: 126.935383 }, order: 1 },
  { id: "library", name: "도서관", location: { lat: 36.768856, lng: 126.9307 }, order: 2 },
  { id: "main-gate", name: "정문", location: { lat: 36.769014, lng: 126.927978 }, order: 3 },
];

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radius = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function minutesUntil(date?: Date | null) {
  if (!date) return null;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 60_000));
}

export default function HomeWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [latestNotice, setLatestNotice] = useState<Notice | null>(null);
  const [activeBuses, setActiveBuses] = useState<Array<{ busId: string; lat: number; lng: number }>>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setClockTick] = useState(Date.now());

  const campusLoop = useMemo(
    () => routes.find((route) => route.isActive && route.shuttleVariant === "campus_loop") ?? null,
    [routes],
  );
  const stationOutbound = useMemo(
    () => routes.find((route) => route.isActive && route.shuttleVariant === "campus_to_station") ?? null,
    [routes],
  );
  const campusRouteIds = useMemo(
    () => new Set(routes.filter((route) => route.type === "campus").map((route) => route.id)),
    [routes],
  );

  const loadDashboard = useCallback(async () => {
    const [routeResult, noticeResult] = await Promise.allSettled([api.getRoutes(), api.getNotices()]);
    if (routeResult.status === "fulfilled") setRoutes(routeResult.value);
    if (noticeResult.status === "fulfilled") {
      const sorted = [...noticeResult.value].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setLatestNotice(sorted[0] ?? null);
    }
    setLoading(false);
  }, []);

  const loadLiveBuses = useCallback(async () => {
    if (document.hidden) return;
    try {
      const [buses, locations] = await Promise.all([api.getBuses(), api.getBusLocations()]);
      const activeIds = new Set(
        buses
          .filter((bus: any) => {
            const routeId = bus.currentRoute?.id ?? bus.currentRouteId;
            return bus.status === "active" && bus.type === "campus" && (!routeId || campusRouteIds.has(routeId));
          })
          .map((bus: any) => bus.id),
      );
      setActiveBuses(
        locations
          .filter((location) => activeIds.has(location.busId))
          .map((location) => ({ busId: location.busId, lat: location.lat, lng: location.lng })),
      );
    } catch {
      // Keep the most recent live state when a polling request fails.
    }
  }, [campusRouteIds]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadLiveBuses();
    const interval = window.setInterval(loadLiveBuses, 30_000);
    const handleVisibility = () => !document.hidden && loadLiveBuses();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadLiveBuses]);

  useEffect(() => {
    const interval = window.setInterval(() => setClockTick(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: false, timeout: 5_000, maximumAge: 300_000 },
    );
  }, []);

  const stops = campusLoop?.stops?.length ? campusLoop.stops : FALLBACK_STOPS;
  const nearestStop = useMemo(() => {
    if (!userLocation) return stops.find((stop) => /정문/.test(stop.name)) ?? stops[0];
    return stops.reduce((nearest, stop) =>
      distanceKm(userLocation, stop.location) < distanceKm(userLocation, nearest.location) ? stop : nearest,
    );
  }, [stops, userLocation]);
  const closestBusMinutes = useMemo(() => {
    if (!nearestStop || activeBuses.length === 0) return null;
    const km = Math.min(...activeBuses.map((bus) => distanceKm(bus, nearestStop.location)));
    return Math.max(1, Math.round(km / 0.25));
  }, [activeBuses, nearestStop]);

  const loopService = campusLoop ? getNextShuttleService(campusLoop) : null;
  const stationService = stationOutbound ? getNextShuttleService(stationOutbound) : null;
  const loopCountdown = minutesUntil(loopService?.departureAt);
  const stationCountdown = minutesUntil(stationService?.departureAt);

  return (
    <div className="relative size-full bg-[#f4f6f9]">
      <main className="h-[100dvh] w-full overflow-y-auto pb-[112px] scrollbar-hide">
        <header className="sticky top-0 z-30 border-b border-[#e8edf3] bg-white/95 pt-safe backdrop-blur-xl">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-['Public_Sans'] text-[11px] font-semibold leading-4 text-[#64748b]">
                {t("순천향대학교 이동 서비스", "Soonchunhyang mobility")}
              </p>
              <h1 className="font-['Public_Sans'] text-[24px] font-black leading-8 text-[#0f172a]">UNIBUS</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate("/notice")}
              aria-label={t("공지사항 열기", "Open notices")}
              className="flex size-10 items-center justify-center rounded-lg bg-[#eef2f7] text-[#1e293b] transition-colors active:bg-[#dfe6ef]"
            >
              <Bell size={20} />
            </button>
          </div>
        </header>

        <div className="space-y-5 px-4 py-5">
          <section className="overflow-hidden rounded-lg bg-[#102a63] text-white shadow-[0_10px_28px_rgba(15,42,99,0.2)]">
            <button type="button" onClick={() => navigate("/campus-shuttle")} className="w-full p-5 text-left active:bg-white/5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[#bfdbfe]">
                    <MapPin size={15} />
                    <span className="font-['Public_Sans'] text-[12px] font-semibold">
                      {userLocation ? t("가장 가까운 정류장", "Nearest stop") : t("기본 정류장", "Default stop")}
                    </span>
                  </div>
                  <h2 className="font-['Public_Sans'] text-[25px] font-bold leading-8">{nearestStop?.name ?? t("정문", "Main gate")}</h2>
                </div>
                <span className="flex items-center gap-1 rounded-md bg-white/12 px-2.5 py-1.5 font-['Public_Sans'] text-[11px] font-bold text-[#dbeafe]">
                  <span className={`size-2 rounded-full ${activeBuses.length > 0 ? "bg-[#4ade80]" : "bg-white/40"}`} />
                  {activeBuses.length > 0 ? t(`${activeBuses.length}대 운행`, `${activeBuses.length} live`) : t("운행 확인 중", "Checking")}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-4 border-t border-white/15 pt-4">
                <div>
                  <p className="font-['Public_Sans'] text-[12px] font-medium text-[#bfdbfe]">
                    {closestBusMinutes ? t("가까운 버스 도착", "Closest bus") : t("다음 학내순환 출발", "Next campus loop")}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <strong className="font-['Public_Sans'] text-[30px] font-black leading-9">
                      {closestBusMinutes ?? loopCountdown ?? (loading ? "--" : 10)}
                    </strong>
                    <span className="font-['Public_Sans'] text-[14px] font-semibold text-[#dbeafe]">{t("분", "min")}</span>
                  </div>
                </div>
                <span className="flex size-10 items-center justify-center rounded-lg bg-white text-[#102a63]">
                  <Navigation size={19} fill="currentColor" />
                </span>
              </div>
            </button>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-['Public_Sans'] text-[17px] font-bold text-[#0f172a]">{t("다음 이동", "Next trips")}</h2>
              <button type="button" onClick={() => navigate("/campus-shuttle")} className="flex items-center gap-1 font-['Public_Sans'] text-[12px] font-bold text-[#1e3a8a]">
                {t("셔틀 전체보기", "View shuttles")} <ArrowRight size={14} />
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#dfe5ec] bg-white">
              <button type="button" onClick={() => navigate("/campus-shuttle")} className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-[#f8fafc]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0ff] text-[#1e3a8a]"><Route size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-['Public_Sans'] text-[14px] font-bold text-[#0f172a]">{t("학내순환", "Campus loop")}</span>
                  <span className="block truncate font-['Public_Sans'] text-[12px] text-[#64748b]">{campusLoop?.intervalMinutes ?? 10}{t("분 간격 · 캠퍼스 순환", " min interval · campus loop")}</span>
                </span>
                <span className="text-right">
                  <span className="block font-['Public_Sans'] text-[17px] font-black text-[#1e3a8a]">{loopCountdown ?? "--"}{t("분", "m")}</span>
                  <span className="block font-['Public_Sans'] text-[10px] text-[#94a3b8]">{loopService ? formatServiceTime(loopService.departureAt, loopService.dayOffset) : t("시간 확인", "Check time")}</span>
                </span>
              </button>
              <div className="mx-4 border-t border-[#edf1f5]" />
              <button type="button" onClick={() => navigate("/campus-shuttle")} className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-[#f8fafc]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f8f1] text-[#087f5b]"><TrainFront size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-['Public_Sans'] text-[14px] font-bold text-[#0f172a]">{t("후문 → 신창역", "Rear gate to Sinchang")}</span>
                  <span className="block truncate font-['Public_Sans'] text-[12px] text-[#64748b]">
                    {stationService ? `${stationService.eventLabel} ${formatServiceTime(stationService.eventAt, stationService.dayOffset)}` : t("관리자 시간표 연동", "Synced schedule")}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-['Public_Sans'] text-[17px] font-black text-[#087f5b]">{stationCountdown ?? "--"}{t("분", "m")}</span>
                  <span className="block font-['Public_Sans'] text-[10px] text-[#94a3b8]">{t("출발까지", "to depart")}</span>
                </span>
              </button>
            </div>
          </section>

          {latestNotice && (
            <button type="button" onClick={() => navigate("/notice")} className="flex w-full items-center gap-3 rounded-lg border border-[#f1d9a8] bg-[#fff9ed] px-4 py-3 text-left active:bg-[#fff4dc]">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f59e0b] text-white"><Bell size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-['Public_Sans'] text-[11px] font-bold text-[#a16207]">{latestNotice.isPinned ? t("중요 공지", "Important") : t("최근 공지", "Latest notice")}</span>
                <span className="block truncate font-['Public_Sans'] text-[13px] font-semibold text-[#3f3a2d]">{latestNotice.title}</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-[#a16207]" />
            </button>
          )}

          <section className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => navigate("/commuter-bus")} className="rounded-lg border border-[#dfe5ec] bg-white p-4 text-left active:bg-[#f8fafc]">
              <BusFront size={21} className="mb-4 text-[#2563eb]" />
              <strong className="block font-['Public_Sans'] text-[14px] font-bold text-[#0f172a]">{t("통학버스", "Commuter bus")}</strong>
              <span className="mt-1 block font-['Public_Sans'] text-[11px] leading-4 text-[#64748b]">{t("지역별 노선과 시간표", "Routes and timetables")}</span>
            </button>
            <button type="button" onClick={() => navigate("/campus-shuttle")} className="rounded-lg border border-[#dfe5ec] bg-white p-4 text-left active:bg-[#f8fafc]">
              <Clock3 size={21} className="mb-4 text-[#087f5b]" />
              <strong className="block font-['Public_Sans'] text-[14px] font-bold text-[#0f172a]">{t("3D 실시간 지도", "3D live map")}</strong>
              <span className="mt-1 block font-['Public_Sans'] text-[11px] leading-4 text-[#64748b]">{t("버스 위치와 이동 경로", "Bus positions and routes")}</span>
            </button>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
