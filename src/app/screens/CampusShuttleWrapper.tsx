import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../imports/svg-usddjxhhke";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import NaverMapComponent from "../components/NaverMapComponent";

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

export default function CampusShuttleWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [busStops, setBusStops] = useState<BusStop[]>([
    { id: "1", name: "Main Gate", nameKo: "정문", routes: "Route A • 150m away", routesKo: "A노선 • 150m 거리", distance: "150m", nextBus: 3, status: "arriving" },
    { id: "2", name: "Engineering Hall", nameKo: "공과대학", routes: "Route A, B • 400m away", routesKo: "A, B노선 • 400m 거리", distance: "400m", nextBus: 8, status: "scheduled" },
    { id: "3", name: "Central Library", nameKo: "중앙도서관", routes: "Route B • 650m away", routesKo: "B노선 • 650m 거리", distance: "650m", nextBus: 14, status: "waiting" },
  ]);

  // Mock bus positions on campus
  const buses = [
    { id: "SCH-01", position: { lat: 36.8005, lng: 127.0763 }, label: "SCH-01" },
    { id: "SCH-03", position: { lat: 36.7985, lng: 127.0743 }, label: "SCH-03" },
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBusStops(prev => prev.map(stop => ({
        ...stop,
        nextBus: stop.nextBus > 1 ? stop.nextBus - 1 : 15,
        status: stop.nextBus <= 3 ? "arriving" : stop.nextBus <= 10 ? "scheduled" : "waiting"
      })));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-center relative size-full">
      <div className="bg-[#f6f6f8] h-screen overflow-hidden relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full max-w-[430px]">
        {/* Map Container */}
        <div className="absolute inset-0 w-full h-full">
          <NaverMapComponent
            center={{ lat: 36.7995, lng: 127.0753 }}
            zoom={16}
            buses={buses}
            clientId="YOUR_NAVER_CLIENT_ID"
          />
        </div>

        {/* Bottom Sheet */}
        <div className="absolute bg-white bottom-[88px] content-stretch flex flex-col items-start left-0 right-0 rounded-tl-[40px] rounded-tr-[40px] shadow-[0px_-12px_40px_0px_rgba(0,0,0,0.12)] max-h-[60vh] overflow-hidden">
          <div className="content-stretch flex h-[40px] items-center justify-center py-[20px] relative shrink-0 w-full">
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

              <div className="content-stretch flex flex-col gap-[12px] items-start max-h-[280px] overflow-y-auto scrollbar-hide pb-[10px] relative shrink-0 w-full">
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

        {/* Top Header */}
        <div className="absolute backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] content-stretch flex items-center justify-between left-0 pb-[12px] pt-[48px] px-[16px] right-0 top-0 z-30">
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