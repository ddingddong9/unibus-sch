import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../imports/svg-usddjxhhke";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import NaverMapComponent from "../components/NaverMapComponent";
import { api } from "../services/api";

interface BusStop {
  id: string;
  name: string;
  nameKo: string;
  routes: string;
  routesKo: string;
  distance: string;
  nextBus: number;
  status: "arriving" | "scheduled" | "waiting";
}

interface BusMarker {
  id: string;
  position: { lat: number; lng: number };
  label: string;
}

const FALLBACK_STOPS: BusStop[] = [
  { id: "1", name: "Main Gate", nameKo: "정문", routes: "Route A • 150m away", routesKo: "A노선 • 150m 거리", distance: "150m", nextBus: 3, status: "arriving" },
  { id: "2", name: "Engineering Hall", nameKo: "공과대학", routes: "Route A, B • 400m away", routesKo: "A, B노선 • 400m 거리", distance: "400m", nextBus: 8, status: "scheduled" },
  { id: "3", name: "Central Library", nameKo: "중앙도서관", routes: "Route B • 650m away", routesKo: "B노선 • 650m 거리", distance: "650m", nextBus: 14, status: "waiting" },
];

export default function CampusShuttleWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [busStops] = useState<BusStop[]>(FALLBACK_STOPS);
  const [buses, setBuses] = useState<BusMarker[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(true);
  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  const fetchBusLocations = useCallback(async () => {
    try {
      const locations = await api.getBusLocations();
      const markers = locations.map((loc) => ({
        id: loc.busId,
        position: { lat: loc.lat, lng: loc.lng },
        label: loc.busId,
      }));
      setBuses(markers);
      setLocationError(null);
    } catch {
      // 폴백: API 실패 시 기본 위치 사용
      if (buses.length === 0) {
        setBuses([
          { id: "SCH-01", position: { lat: 36.8005, lng: 127.0763 }, label: "SCH-01" },
          { id: "SCH-03", position: { lat: 36.7985, lng: 127.0743 }, label: "SCH-03" },
        ]);
        setLocationError("실시간 위치를 불러올 수 없습니다");
      }
    }
  }, [buses.length]);

  // 최초 로드 + 30초 폴링
  useEffect(() => {
    fetchBusLocations();
    const interval = setInterval(fetchBusLocations, 30000);
    return () => clearInterval(interval);
  }, [fetchBusLocations]);

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
    if (currentDragY.current > 80) {
      setSheetVisible(false);
    }
    currentDragY.current = 0;
    setDragY(0);
  };

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-center relative size-full">
      <div className="bg-[#f6f6f8] overflow-hidden relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full max-w-[430px]" style={{ height: '100dvh' }}>
        {/* Map Container */}
        <div className="absolute inset-0 w-full h-full">
          <NaverMapComponent
            center={{ lat: 36.7995, lng: 127.0753 }}
            zoom={16}
            buses={buses}
          />
        </div>

        {/* Bottom Sheet — bottom-0, BottomNav(z-50)이 위에 덮여 틈 없음 */}
        <div
          className="absolute bg-white bottom-0 content-stretch flex flex-col items-start left-0 right-0 rounded-tl-[40px] rounded-tr-[40px] shadow-[0px_-12px_40px_0px_rgba(0,0,0,0.12)] max-h-[60vh] overflow-hidden z-20"
          style={{
            transform: sheetVisible ? `translateY(${dragY}px)` : "translateY(120%)",
            transition: isDragging.current ? "none" : "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
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
                  <p className="leading-[28px]">{t("근처 정류장", "Nearby Stops")}</p>
                </div>
                <button className="bg-[rgba(30,58,138,0.05)] px-[12px] py-[6px] rounded-[9999px] hover:bg-[rgba(30,58,138,0.1)] active:scale-95 transition-all">
                  <p className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[12px] leading-[16px]">{t("전체보기", "View All")}</p>
                </button>
              </div>

              <div className="content-stretch flex flex-col gap-[12px] items-start max-h-[280px] overflow-y-auto scrollbar-hide pb-[88px] relative shrink-0 w-full">
                {busStops.map((stop) => (
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
                          stop.status === "arriving" ? "shadow-[0px_4px_6px_-1px_rgba(30,58,138,0.2),0px_2px_4px_-2px_rgba(30,58,138,0.2)]" : ""
                        }`}
                      >
                        <div className="h-[20px] relative shrink-0 w-[16px]">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                            <path
                              d={svgPaths.p303da380 || svgPaths.p1869180}
                              fill={stop.status === "arriving" ? "white" : "#64748B"}
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col items-start">
                        <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[16px] w-full">
                          <p className="leading-[24px]">{t(stop.nameKo, stop.name)}</p>
                        </div>
                        <div className="flex flex-col font-['Public_Sans'] font-medium justify-center leading-[0] text-[#64748b] text-[11px] w-full">
                          <p className="leading-[16.5px]">{t(stop.routesKo, stop.routes)}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div
                          className={`flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[10px] tracking-[0.25px] uppercase ${
                            stop.status === "arriving" ? "text-[#059669]" : "text-[#94a3b8]"
                          }`}
                        >
                          <p className="leading-[15px]">{stop.status === "waiting" ? t("다음 버스", "Next Bus") : t("도착 예정", "Arriving in")}</p>
                        </div>
                        <div
                          className={`flex flex-col font-['Public_Sans'] font-black justify-center leading-[0] text-[20px] ${
                            stop.status === "arriving" ? "text-[#059669]" : stop.status === "scheduled" ? "text-[#0f172a]" : "text-[#94a3b8]"
                          }`}
                        >
                          <p className="leading-[28px]">{stop.nextBus} {t("분", "min")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Show sheet button (visible when sheet is hidden) */}
        {!sheetVisible && (
          <button
            onClick={() => setSheetVisible(true)}
            className="absolute bottom-[104px] left-1/2 -translate-x-1/2 z-40 bg-white rounded-full px-[20px] py-[10px] shadow-[0px_4px_16px_rgba(0,0,0,0.18)] flex items-center gap-[8px] active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 15l-6-6-6 6" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[13px]">{t("근처 정류장", "Nearby Stops")}</span>
          </button>
        )}

        {/* Location error banner */}
        {locationError && (
          <div className="absolute top-[100px] left-4 right-4 z-40 bg-[rgba(254,226,226,0.95)] backdrop-blur-sm border border-[#fca5a5] rounded-[12px] px-4 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ef4444] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            <p className="font-['Public_Sans'] font-medium text-[#ef4444] text-[12px]">{locationError}</p>
          </div>
        )}

        {/* Top Header */}
        <div className="fixed backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] content-stretch flex items-center justify-between left-0 pb-[12px] pt-[48px] px-[16px] right-0 top-0 z-30">
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
              <p className="leading-[15px]">{t("순천향대학교", "Soonchunhyang University")}</p>
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

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}