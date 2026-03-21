import { useState } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";

interface BusRoute {
  id: string;
  name: string;
  nameKo: string;
  region: string;
  regionKo: string;
  stops: string[];
  stopsKo: string[];
  schedule: string;
  duration: string;
  durationKo: string;
  fare: string;
  color: string;
}

export default function CommuterBusWrapper() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const routes: BusRoute[] = [
    {
      id: "1",
      name: "Incheon Line A",
      nameKo: "인천 A노선",
      region: "Incheon",
      regionKo: "인천",
      stops: ["Incheon Terminal", "Bupyeong Station", "Juan Station", "SCH Main Gate"],
      stopsKo: ["인천터미널", "부평역", "주안역", "순천향대 정문"],
      schedule: "06:30, 07:30, 08:30",
      duration: "50 mins",
      durationKo: "50분",
      fare: "₩3,500",
      color: "bg-[#3b82f6]",
    },
    {
      id: "2",
      name: "Seoul Express",
      nameKo: "서울 급행",
      region: "Seoul",
      regionKo: "서울",
      stops: ["Seoul Station", "Gangnam Terminal", "Sadang Station", "SCH Main Gate"],
      stopsKo: ["서울역", "강남터미널", "사당역", "순천향대 정문"],
      schedule: "07:00, 08:00, 09:00",
      duration: "1 hr 20 mins",
      durationKo: "1시간 20분",
      fare: "₩5,000",
      color: "bg-[#10b981]",
    },
    {
      id: "3",
      name: "Bucheon Route",
      nameKo: "부천 노선",
      region: "Gyeonggi",
      regionKo: "경기",
      stops: ["Bucheon Station", "Sosa Station", "Siheung IC", "SCH Main Gate"],
      stopsKo: ["부천역", "소사역", "시흥IC", "순천향대 정문"],
      schedule: "06:45, 07:45, 08:45",
      duration: "45 mins",
      durationKo: "45분",
      fare: "₩3,000",
      color: "bg-[#f59e0b]",
    },
    {
      id: "4",
      name: "Ansan Line",
      nameKo: "안산 노선",
      region: "Gyeonggi",
      regionKo: "경기",
      stops: ["Ansan Station", "Sangnok Station", "Sihwa IC", "SCH Main Gate"],
      stopsKo: ["안산역", "상록역", "시화IC", "순천향대 정문"],
      schedule: "07:00, 08:00",
      duration: "40 mins",
      durationKo: "40분",
      fare: "₩2,800",
      color: "bg-[#8b5cf6]",
    },
    {
      id: "5",
      name: "Incheon Line B",
      nameKo: "인천 B노선",
      region: "Incheon",
      regionKo: "인천",
      stops: ["Songdo", "Yeonsu Station", "Namdong IC", "SCH Main Gate"],
      stopsKo: ["송도", "연수역", "남동IC", "순천향대 정문"],
      schedule: "06:40, 07:40, 08:40",
      duration: "55 mins",
      durationKo: "55분",
      fare: "₩3,800",
      color: "bg-[#ec4899]",
    },
  ];

  const filteredRoutes = selectedRegion === "all" 
    ? routes 
    : routes.filter(r => r.region === selectedRegion);

  const regions = ["all", "Incheon", "Seoul", "Gyeonggi"];

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-start relative size-full">
      <div className="bg-white content-stretch flex flex-col items-start overflow-auto pb-[94px] relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full" style={{ minHeight: '100dvh' }}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white w-full pt-safe">
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
              <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px] leading-[22.5px]">{t("통근버스", "Commuter Bus")}</p>
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
                {region === "all" ? t("전체 지역", "All Regions") : language === "ko" ? (region === "Incheon" ? "인천" : region === "Seoul" ? "서울" : "경기") : region}
              </button>
            ))}
          </div>
        </div>

        {/* Routes List */}
        <div className="flex-1 w-full px-[16px] py-[16px] space-y-3">
          {filteredRoutes.map((route) => (
            <div
              key={route.id}
              className="bg-white border border-[#e2e8f0] rounded-[16px] overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-all"
            >
              <button
                onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                className="w-full p-[16px] text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={`${route.color} rounded-[12px] size-[48px] flex items-center justify-center shrink-0 shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] leading-[24px]">
                        {language === "ko" ? route.nameKo : route.name}
                      </h3>
                      <span className="bg-[#f1f5f9] text-[#64748b] px-2 py-1 rounded-[4px] font-['Public_Sans'] font-bold text-[10px] uppercase">
                        {language === "ko" ? route.regionKo : route.region}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[#64748b] text-[12px] font-['Public_Sans'] mb-2">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{language === "ko" ? route.durationKo : route.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{route.fare}</span>
                      </div>
                    </div>

                    <p className="font-['Public_Sans'] font-medium text-[#1e3a8a] text-[12px] leading-[16px]">
                      {route.schedule}
                    </p>
                  </div>

                  <svg
                    className={`w-5 h-5 text-[#64748b] transition-transform shrink-0 mt-2 ${
                      expandedRoute === route.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedRoute === route.id && (
                <div className="px-[16px] pb-[16px] border-t border-[#f1f5f9]">
                  <div className="pt-[16px]">
                    <h4 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[14px] mb-3">{t("정류장 목록", "Route Stops")}</h4>
                    <div className="space-y-2">
                      {route.stops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`${
                                index === 0
                                  ? route.color + " text-white"
                                  : index === route.stops.length - 1
                                  ? "bg-[#1e3a8a] text-white"
                                  : "bg-[#f1f5f9] text-[#94a3b8]"
                              } rounded-full size-[24px] flex items-center justify-center font-['Public_Sans'] font-bold text-[10px] z-10`}
                            >
                              {index + 1}
                            </div>
                            {index < route.stops.length - 1 && (
                              <div className="w-[2px] h-[24px] bg-[#e2e8f0] absolute top-[24px]" />
                            )}
                          </div>
                          <div className="flex-1 py-1">
                            <p
                              className={`font-['Public_Sans'] text-[14px] leading-[20px] ${
                                index === 0 || index === route.stops.length - 1
                                  ? "font-bold text-[#0f172a]"
                                  : "font-normal text-[#64748b]"
                              }`}
                            >
                              {language === "ko" ? route.stopsKo[index] : stop}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="w-full mt-4 bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] h-[44px] rounded-[8px] font-['Public_Sans'] font-bold text-white text-[14px] shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
                      {t("노선 예약하기", "Book This Route")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredRoutes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-[#f1f5f9] rounded-full p-6 mb-4">
                <svg className="w-12 h-12 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] mb-1">{t("노선을 찾을 수 없습니다", "No routes found")}</p>
              <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[14px] text-center">
                {t(`${selectedRegion === "all" ? "전체 지역" : selectedRegion === "Incheon" ? "인천" : selectedRegion === "Seoul" ? "서울" : "경기"}에 통근버스 노선이 없습니다`, `No commuter bus routes in ${selectedRegion}`)}
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