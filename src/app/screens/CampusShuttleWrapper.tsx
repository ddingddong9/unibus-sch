// ── Realtime 구독 흐름 ──
// 1. 마운트: fetchInitial() 1회 → 활성 버스 목록 + 현재 위치 로드
// 2. supabase.channel('bus-tracking') 구독:
//    A) bus_locations INSERT → 해당 bus_id 위치만 교체 (setBuses prev.map)
//    B) buses UPDATE → 상태 변경 반영 (inactive 제거 / active 추가)
// 3. 언마운트: supabase.removeChannel(channel) cleanup
// ──────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../imports/svg-usddjxhhke";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import NaverMapComponent from "../components/NaverMapComponent";
import { api } from "../services/api";
import { supabase } from "../services/supabase"; // [변경] Realtime 클라이언트

// 학내 순환 정류장 (후문 출발 → 향3 → 향1 → 도서관 → 정문)
const CAMPUS_STOPS = [
  { id: "rear-gate",  nameKo: "후문",   nameEn: "Rear Gate",         lat: 36.772760, lng: 126.933816, order: 1 },
  { id: "hyang3",     nameKo: "향3",    nameEn: "Hyang Hall 3",      lat: 36.768228, lng: 126.935383, order: 2 },
  { id: "hyang1",     nameKo: "향1",    nameEn: "Hyang Hall 1",      lat: 36.767905, lng: 126.932505, order: 3 },
  { id: "library",    nameKo: "도서관", nameEn: "Library",            lat: 36.768856, lng: 126.931303, order: 4 },
  { id: "main-gate",  nameKo: "정문",   nameEn: "Main Gate",         lat: 36.769014, lng: 126.927978, order: 5 },
];

const CAMPUS_CENTER = { lat: 36.7694, lng: 126.9322 };

interface BusMarker {
  id: string;
  position: { lat: number; lng: number };
  heading: number; // [변경] heading 추가
  label: string;
}

interface FocusLocation {
  lat: number;
  lng: number;
  zoom?: number;
  key: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getArrivalMinutes(stopLat: number, stopLng: number, buses: BusMarker[]): number | null {
  if (buses.length === 0) return null;
  const minDist = Math.min(
    ...buses.map(b => haversineKm(b.position.lat, b.position.lng, stopLat, stopLng))
  );
  return Math.max(1, Math.round(minDist / 0.25));
}

export default function CampusShuttleWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [buses, setBuses] = useState<BusMarker[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focusLocation, setFocusLocation] = useState<FocusLocation | null>(null);
  const [fitBoundsKey, setFitBoundsKey] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [sheetVisible, setSheetVisible] = useState(true);
  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  // [변경] 활성 버스 ID set — Realtime 필터링용 (ref로 관리해 리렌더 방지)
  const activeBusIdsRef = useRef<Set<string>>(new Set());
  // [변경] 버스 이름 map
  const busNamesRef = useRef<Map<string, string>>(new Map());

  // ── 캠퍼스 경로 fetch (24h 캐시) ──
  useEffect(() => {
    const CACHE_KEY = 'campus_route_path_v4';
    const CACHE_TTL = 24 * 60 * 60 * 1000;
    localStorage.removeItem('campus_route_path');
    localStorage.removeItem('campus_route_path_v2');
    localStorage.removeItem('campus_route_path_v3');

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { path, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL && path?.length > 0) {
          setRoutePath(path);
          return;
        }
      } catch (_) {}
    }

    api.getCampusRoutePath()
      .then(({ path }) => {
        if (path?.length > 0) {
          setRoutePath(path);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ path, ts: Date.now() }));
        }
      })
      .catch(e => console.warn("경로 불러오기 실패:", e));
  }, []);

  // ── 초기 데이터 로드 (1회) ──
  const fetchInitial = useCallback(async () => {
    try {
      const [allBuses, locations] = await Promise.all([
        api.getBuses(),
        api.getBusLocations(),
      ]);

      // 활성 버스 ID + 이름 등록
      activeBusIdsRef.current = new Set(
        allBuses.filter((b: any) => b.status === 'active').map((b: any) => b.id)
      );
      busNamesRef.current = new Map(
        allBuses.map((b: any) => [b.id, b.name])
      );

      // 위치 map
      const locationMap = new Map(
        locations.map((l: any) => [l.busId, l])
      );

      // 활성 버스 중 위치 있는 것만 표시
      const markers: BusMarker[] = allBuses
        .filter((b: any) => b.status === 'active' && locationMap.has(b.id))
        .map((b: any) => {
          const loc = locationMap.get(b.id);
          return {
            id: b.id,
            position: { lat: loc.lat, lng: loc.lng },
            heading: loc.heading ?? 0,
            label: b.name,
          };
        });

      setBuses(markers);
      setLocationError(null);
    } catch {
      setLocationError("실시간 위치를 불러올 수 없습니다");
    }
  }, []);

  // ── Realtime 구독 ──
  useEffect(() => {
    // 초기 로드
    fetchInitial();

    // [변경] 폴링 제거 → Supabase Realtime WebSocket 구독
    // 마운트마다 고유 채널명 사용 (재마운트 시 중복 subscribe 에러 방지)
    const channel = supabase
      .channel(`bus-tracking-${Date.now()}`)

      // A) bus_locations INSERT: 새 위치 수신
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bus_locations' },
        (payload) => {
          const row = payload.new as any;
          const busId: string = row.bus_id;

          // activeBusIdsRef에 없으면 → buses 목록 재조회 후 자동 표시
          if (!activeBusIdsRef.current.has(busId)) {
            fetchInitial();
            return;
          }

          // [변경] 해당 bus_id 위치만 교체 (전체 교체 X)
          setBuses(prev => {
            const exists = prev.some(b => b.id === busId);
            if (!exists) {
              // 처음 등장하는 버스 — 목록에 추가
              const label = busNamesRef.current.get(busId) ?? busId;
              return [
                ...prev,
                {
                  id: busId,
                  position: { lat: row.latitude, lng: row.longitude },
                  heading: row.heading ?? 0,
                  label,
                },
              ];
            }
            return prev.map(b =>
              b.id === busId
                ? { ...b, position: { lat: row.latitude, lng: row.longitude }, heading: row.heading ?? 0 }
                : b
            );
          });
        }
      )

      // B) buses UPDATE: 상태 변경 (active ↔ inactive)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'buses' },
        (payload) => {
          const row = payload.new as any;
          if (row.status === 'inactive') {
            // 미운행 전환 → 지도에서 제거
            activeBusIdsRef.current.delete(row.id);
            setBuses(prev => prev.filter(b => b.id !== row.id));
          } else if (row.status === 'active') {
            // 운행 시작 → 활성 목록에 추가 후 초기 데이터 재로드
            activeBusIdsRef.current.add(row.id);
            busNamesRef.current.set(row.id, row.name);
            fetchInitial();
          }
        }
      )

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] bus-tracking 구독 시작');
        }
      });

    // [변경] cleanup: WebSocket 채널 해제
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitial]);

  // ── 사용자 실시간 위치 추적 ──
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn("위치 권한 없음:", err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleBusClick = useCallback((busId: string) => {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;
    setFocusLocation({ lat: bus.position.lat, lng: bus.position.lng, zoom: 18, key: Date.now() });
  }, [buses]);

  // 드래그 핸들러
  const handleDragStart = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    currentDragY.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = Math.max(0, e.clientY - dragStartY.current);
    currentDragY.current = delta;
    setDragY(delta);
  };
  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (currentDragY.current > 80) setSheetVisible(false);
    currentDragY.current = 0;
    setDragY(0);
  };

  const stopsWithArrival = CAMPUS_STOPS.map(stop => {
    const arrival = getArrivalMinutes(stop.lat, stop.lng, buses);
    const status = arrival === null ? "waiting" : arrival <= 2 ? "arriving" : "scheduled";
    return { ...stop, arrival, status };
  });

  const mapStops = CAMPUS_STOPS.map(s => ({
    id: s.id,
    name: s.nameKo,
    position: { lat: s.lat, lng: s.lng },
  }));

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-center relative size-full">
      <div className="bg-[#f6f6f8] overflow-hidden relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full max-w-[430px]" style={{ height: '100dvh' }}>

        {/* 지도 */}
        <div className="absolute inset-0 w-full h-full">
          <NaverMapComponent
            center={CAMPUS_CENTER}
            zoom={16}
            buses={buses}
            stops={mapStops}
            userLocation={userLocation}
            focusLocation={focusLocation}
            fitBoundsKey={fitBoundsKey}
            routePath={routePath}
            onBusClick={handleBusClick}
          />
        </div>

        {/* 바텀 시트 */}
        <div
          className="absolute bg-white bottom-0 content-stretch flex flex-col items-start left-0 right-0 rounded-tl-[40px] rounded-tr-[40px] shadow-[0px_-12px_40px_0px_rgba(0,0,0,0.12)] max-h-[60vh] overflow-hidden z-20"
          style={{
            transform: sheetVisible ? `translateY(${dragY}px)` : "translateY(120%)",
            transition: isDragging.current ? "none" : "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {/* 드래그 핸들 */}
          <div
            className="content-stretch flex h-[40px] items-center justify-center py-[20px] relative shrink-0 w-full cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <div className="bg-[#e2e8f0] h-[6px] rounded-[9999px] shrink-0 w-[48px]" />
          </div>

          <div className="relative shrink-0 w-full overflow-auto">
            <div className="content-stretch flex flex-col gap-[16px] items-start pb-[16px] px-[24px] relative w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div className="flex flex-col font-['Public_Sans'] font-extrabold justify-center leading-[0] text-[#0f172a] text-[20px] tracking-[-0.5px]">
                  <p className="leading-[28px]">{t("학내순환 정류장", "Campus Shuttle Stops")}</p>
                </div>
                <button
                  onClick={() => setFitBoundsKey(k => k + 1)}
                  className="bg-[rgba(30,58,138,0.05)] px-[12px] py-[6px] rounded-[9999px] hover:bg-[rgba(30,58,138,0.1)] active:scale-95 transition-all"
                >
                  <p className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[12px] leading-[16px]">{t("전체보기", "View All")}</p>
                </button>
              </div>

              <div className="content-stretch flex flex-col gap-[12px] items-start max-h-[280px] overflow-y-auto scrollbar-hide pb-[88px] relative shrink-0 w-full">
                {stopsWithArrival.map(stop => (
                  <div
                    key={stop.id}
                    className={`bg-[rgba(248,250,252,0.5)] relative rounded-[16px] shrink-0 w-full border border-[#f1f5f9] ${
                      stop.status === "waiting" ? "opacity-75" : ""
                    }`}
                  >
                    <div className="flex items-center gap-[16px] p-[17px] w-full">
                      <div
                        className={`${
                          stop.status === "arriving" ? "bg-[#1e3a8a]" : "bg-[#e2e8f0]"
                        } relative rounded-[12px] shrink-0 size-[48px] flex items-center justify-center ${
                          stop.status === "arriving" ? "shadow-[0px_4px_6px_-1px_rgba(30,58,138,0.2)]" : ""
                        }`}
                      >
                        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                          <path
                            d={svgPaths.p303da380 || svgPaths.p1869180}
                            fill={stop.status === "arriving" ? "white" : "#64748B"}
                          />
                        </svg>
                      </div>

                      <div className="flex-1 flex flex-col items-start">
                        <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[16px] w-full">
                          <p className="leading-[24px]">{t(stop.nameKo, stop.nameEn)}</p>
                        </div>
                        <div className="flex flex-col font-['Public_Sans'] font-medium justify-center leading-[0] text-[#64748b] text-[11px] w-full">
                          <p className="leading-[16.5px]">{t("학내순환", "Campus Shuttle")} · {t(`${stop.order}번째 정류장`, `Stop ${stop.order}`)}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div
                          className={`flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[10px] tracking-[0.25px] uppercase ${
                            stop.status === "arriving" ? "text-[#059669]" : "text-[#94a3b8]"
                          }`}
                        >
                          <p className="leading-[15px]">
                            {stop.status === "arriving" ? t("도착 예정", "Arriving") : t("예상 시간", "Est.")}
                          </p>
                        </div>
                        <div
                          className={`flex flex-col font-['Public_Sans'] font-black justify-center leading-[0] text-[20px] ${
                            stop.status === "arriving"
                              ? "text-[#059669]"
                              : stop.status === "scheduled"
                              ? "text-[#0f172a]"
                              : "text-[#94a3b8]"
                          }`}
                        >
                          <p className="leading-[28px]">
                            {stop.arrival !== null ? `${stop.arrival}${t("분", "m")}` : "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 바텀 시트 숨김 시 다시 열기 버튼 */}
        {!sheetVisible && (
          <button
            onClick={() => setSheetVisible(true)}
            className="absolute bottom-[104px] left-1/2 -translate-x-1/2 z-40 bg-white rounded-full px-[20px] py-[10px] shadow-[0px_4px_16px_rgba(0,0,0,0.18)] flex items-center gap-[8px] active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 15l-6-6-6 6" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[13px]">{t("학내순환 정류장", "Campus Stops")}</span>
          </button>
        )}

        {/* 위치 오류 배너 */}
        {locationError && (
          <div className="absolute top-[100px] left-4 right-4 z-40 bg-[rgba(254,226,226,0.95)] backdrop-blur-sm border border-[#fca5a5] rounded-[12px] px-4 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ef4444] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            <p className="font-['Public_Sans'] font-medium text-[#ef4444] text-[12px]">{locationError}</p>
          </div>
        )}

        {/* 헤더 */}
        <div className="fixed left-1/2 -translate-x-1/2 top-0 z-30 pt-safe w-full max-w-[430px]">
          <div className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] content-stretch flex items-center justify-between pb-[12px] pt-[16px] px-[16px] w-full">
            <button
              onClick={() => navigate("/home")}
              className="content-stretch flex items-center relative shrink-0 size-[40px] hover:bg-white/50 rounded-full active:scale-95 transition-all"
            >
              <div className="h-[20px] relative shrink-0 w-[11.775px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.775 20">
                  <path d={svgPaths.p225a8cc0} fill="#0F172A" />
                </svg>
              </div>
            </button>

            <div className="content-stretch flex flex-col items-center relative shrink-0">
              <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[18px]">
                <p className="leading-[22.5px]">{t("캠퍼스 셔틀", "Campus Shuttle")}</p>
              </div>
              <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#1e3a8a] text-[10px] tracking-[1px] uppercase">
                <p className="leading-[15px]">{t("순천향대학교", "Soonchunhyang Univ.")}</p>
              </div>
            </div>

            <div className="content-stretch flex items-center justify-end relative shrink-0 size-[40px]">
              <div className="relative shrink-0 size-[20px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                  <path d={svgPaths.p6c8ea80} fill="#0F172A" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
