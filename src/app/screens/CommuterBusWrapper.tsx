import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";

// hex → tailwind-style inline color
const COLOR_FALLBACKS: Record<string, string> = {
  "#3b82f6": "#3b82f6",
  "#10b981": "#10b981",
  "#f59e0b": "#f59e0b",
  "#8b5cf6": "#8b5cf6",
  "#ec4899": "#ec4899",
  "#1e3a8a": "#1e3a8a",
  "#1E3B8A": "#1e3a8a",
};

const getColor = (color?: string) => color || "#1e3a8a";

export default function CommuterBusWrapper() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState<string>("to-school");
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const allRoutes = await api.getRoutes();
        // 통근버스(commuter) 타입만 필터
        setRoutes(allRoutes.filter((r: any) => r.type === "commuter"));
      } catch (e: any) {
        setError(e.message || "노선 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const regions = ["to-school", "from-school", ...Array.from(new Set(routes.map((r) => r.region).filter(Boolean)))];

  const filteredRoutes =
    selectedRegion === "to-school"
      ? routes.filter((r) => r.name?.includes("[출발]"))
      : selectedRegion === "from-school"
      ? routes.filter((r) => r.name?.includes("[도착]"))
      : routes.filter((r) => r.region === selectedRegion);

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-center relative size-full">
      <div
        className="bg-white content-stretch flex flex-col items-start max-w-[430px] overflow-auto pb-[94px] relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full"
        style={{ minHeight: "100dvh" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-30 w-full pt-safe">
          <div className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] flex items-center justify-between pb-[12px] pt-[16px] px-[16px] w-full">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center justify-center size-[40px] hover:bg-gray-100 rounded-full active:scale-95 transition-all"
            >
              <svg className="w-3 h-5" fill="none" viewBox="0 0 12 20" stroke="#0F172A" strokeWidth="2">
                <path d="M11 1L1 10L11 19" />
              </svg>
            </button>

            <div className="flex flex-col items-center">
              <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px] leading-[22.5px]">
                {t("통근버스", "Commuter Bus")}
              </p>
              <p className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[10px] leading-[15px] tracking-[1px] uppercase">
                {t("지역 노선", "Regional Routes")}
              </p>
            </div>

            <div className="w-[40px]" />
          </div>

          {/* Region Filter */}
          <div className="flex gap-2 px-[16px] py-[12px] overflow-x-auto scrollbar-hide border-b border-[#f1f5f9]">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-4 py-2 rounded-[9999px] font-['Public_Sans'] font-semibold text-[12px] whitespace-nowrap transition-all ${
                  selectedRegion === region
                    ? "bg-[#1e3a8a] text-white"
                    : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                }`}
              >
                {region === "to-school"
                  ? t("등교", "To School")
                  : region === "from-school"
                  ? t("하교", "From School")
                  : region}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full px-[16px] py-[16px] space-y-3">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
              <p className="font-['Public_Sans'] text-[#64748b] text-[14px]">
                {t("노선 불러오는 중...", "Loading routes...")}
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="bg-red-50 rounded-full p-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[15px]">
                {t("불러오기 실패", "Failed to load")}
              </p>
              <p className="font-['Public_Sans'] text-[#94a3b8] text-[13px] text-center">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-5 py-2 bg-[#1e3a8a] text-white rounded-lg font-['Public_Sans'] font-semibold text-[13px]"
              >
                {t("다시 시도", "Retry")}
              </button>
            </div>
          )}

          {/* Routes */}
          {!loading && !error &&
            filteredRoutes.map((route) => {
              const stopNames: string[] =
                route.stops?.map((s: any) => s.name) || [];
              const color = getColor(route.color);
              const isExpanded = expandedRoute === route.id;

              return (
                <div
                  key={route.id}
                  className="bg-white border border-[#e2e8f0] rounded-[16px] overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-all"
                >
                  <button
                    onClick={() =>
                      setExpandedRoute(isExpanded ? null : route.id)
                    }
                    className="w-full p-[16px] text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="rounded-[12px] size-[48px] flex items-center justify-center shrink-0 shadow-lg"
                        style={{ backgroundColor: color }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] leading-[24px]">
                            {route.name}
                          </h3>
                          {route.region && (
                            <span className="bg-[#f1f5f9] text-[#64748b] px-2 py-1 rounded-[4px] font-['Public_Sans'] font-bold text-[10px] uppercase">
                              {route.region}
                            </span>
                          )}
                          {!route.isActive && (
                            <span className="bg-red-50 text-red-400 px-2 py-1 rounded-[4px] font-['Public_Sans'] font-bold text-[10px]">
                              {t("운행 중단", "Suspended")}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-[#64748b] text-[12px] font-['Public_Sans'] mb-2">
                          {route.duration && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{route.duration}</span>
                            </div>
                          )}
                          {route.fare && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{route.fare}</span>
                            </div>
                          )}
                        </div>

                        {route.schedule && (
                          <p className="font-['Public_Sans'] font-medium text-[#1e3a8a] text-[12px] leading-[16px]">
                            {route.schedule}
                          </p>
                        )}
                      </div>

                      <svg
                        className={`w-5 h-5 text-[#64748b] transition-transform shrink-0 mt-2 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-[16px] pb-[16px] border-t border-[#f1f5f9]">
                      <div className="pt-[16px]">
                        <h4 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[14px] mb-3">
                          {t("정류장 목록", "Route Stops")}
                        </h4>
                        {stopNames.length > 0 ? (
                          <div className="space-y-2">
                            {stopNames.map((stop, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="relative flex flex-col items-center">
                                  <div
                                    className="rounded-full size-[24px] flex items-center justify-center font-['Public_Sans'] font-bold text-[10px] z-10 text-white"
                                    style={{
                                      backgroundColor:
                                        index === 0
                                          ? color
                                          : index === stopNames.length - 1
                                          ? "#1e3a8a"
                                          : "#cbd5e1",
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                  {index < stopNames.length - 1 && (
                                    <div className="w-[2px] h-[24px] bg-[#e2e8f0] absolute top-[24px]" />
                                  )}
                                </div>
                                <div className="flex-1 py-1">
                                  <p
                                    className={`font-['Public_Sans'] text-[14px] leading-[20px] ${
                                      index === 0 || index === stopNames.length - 1
                                        ? "font-bold text-[#0f172a]"
                                        : "font-normal text-[#64748b]"
                                    }`}
                                  >
                                    {stop}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#94a3b8] text-[13px] font-['Public_Sans']">
                            {t("정류장 정보 없음", "No stop info")}
                          </p>
                        )}

                        <button
                          className={`w-full mt-4 h-[44px] rounded-[8px] font-['Public_Sans'] font-bold text-white text-[14px] shadow-lg hover:shadow-xl active:scale-[0.98] transition-all ${
                            !route.isActive ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          style={{
                            background: route.isActive
                              ? `linear-gradient(to right, #1e3a8a, ${color})`
                              : "#94a3b8",
                          }}
                          disabled={!route.isActive}
                        >
                          {route.isActive
                            ? t("노선 예약하기", "Book This Route")
                            : t("현재 운행 중단", "Currently Suspended")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Empty state */}
          {!loading && !error && filteredRoutes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-[#f1f5f9] rounded-full p-6 mb-4">
                <svg className="w-12 h-12 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] mb-1">
                {t("노선을 찾을 수 없습니다", "No routes found")}
              </p>
              <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[14px] text-center">
                {selectedRegion === "to-school"
                  ? t("등교 노선이 없습니다", "No to-school routes")
                  : selectedRegion === "from-school"
                  ? t("하교 노선이 없습니다", "No from-school routes")
                  : t(`${selectedRegion} 지역 노선이 없습니다`, `No routes in ${selectedRegion}`)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
