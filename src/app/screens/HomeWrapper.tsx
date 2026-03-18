import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../imports/svg-odbnwpa57u";
// import imgStylizedMapShowingCampusRoads from "figma:asset/70af9cad232a51cb3669c712a48138adf798354b.png";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";

export default function HomeWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [nextArrival, setNextArrival] = useState(4);
  const [notifications, setNotifications] = useState(3);

  // Placeholder for missing image
  const imgStylizedMapShowingCampusRoads = "";

  // Simulate real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNextArrival((prev) => {
        if (prev <= 1) return 12; // Reset to next bus
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-start relative size-full">
      <div className="bg-white content-stretch flex flex-col items-start max-w-[430px] h-screen overflow-y-auto scrollbar-hide pb-[120px] relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full">
        {/* Header */}
        <div className="relative shrink-0 w-full bg-white sticky top-0 z-10">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between pb-[8px] pt-[24px] px-[24px] relative w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0">
                <div className="flex flex-col font-['Public_Sans'] font-medium justify-center leading-[0] relative shrink-0 text-[#64748b] text-[12px] tracking-[0.6px] uppercase">
                  <p className="leading-[16px]"></p>
                </div>
                <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[24px]">
                  <p className="leading-[32px]">UNIBUS SCH</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/notice")}
                className="bg-[#f1f5f9] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px] hover:bg-[#e2e8f0] transition-colors active:scale-95"
              >
                <div className="h-[20px] relative shrink-0 w-[16px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                    <path d={svgPaths.p164b49c0} fill="#0F172A" />
                  </svg>
                </div>
                {notifications > 0 && (
                  <div className="absolute bg-[#ef4444] right-[10px] rounded-[9999px] size-[8px] top-[10px] border-2 border-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Favorite Routes */}
        <div className="relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[12px] items-start px-[24px] py-[16px] relative w-full">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[18px]">
                <p className="leading-[28px]">{t("즐겨찾기 경로", "Favorite Routes")}</p>
              </div>
              <button className="flex flex-col font-['Public_Sans'] font-semibold justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[14px] text-center hover:underline">
                <p className="leading-[20px]">{t("편집", "Edit")}</p>
              </button>
            </div>

            <div className="flex gap-[12px] overflow-x-auto pb-2 w-full scrollbar-hide">
              <button
                onClick={() => navigate("/campus-shuttle")}
                className="bg-white flex flex-col gap-[8px] min-w-[120px] p-[16px] rounded-[12px] border-2 border-[#e2e8f0] hover:border-[#1e3a8a] transition-all active:scale-95"
              >
                <div className="flex flex-col items-start gap-[4px]">
                  <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[14px]">
                    <p className="leading-[20px]">{t("정문", "Main Gate")}</p>
                  </div>
                  <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[#64748b] text-[12px]">
                    <p className="leading-[16px]">{t("신창역", "Sinchang Stn.")}</p>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-[#e2e8f0]" />
                <div className="flex items-center gap-[6px]">
                  <div className="h-[14px] relative shrink-0 w-[15px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 19">
                      <path d={svgPaths.p1f93f980} fill="#1E3A8A" />
                    </svg>
                  </div>
                  <div className="flex flex-col font-['Public_Sans'] font-medium justify-center leading-[0] text-[#1e3a8a] text-[11px]">
                    <p className="leading-[14px]">{t("캠퍼스 셔틀", "Campus Shuttle")}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate("/campus-shuttle")}
                className="bg-white flex flex-col gap-[8px] min-w-[120px] p-[16px] rounded-[12px] border-2 border-[#e2e8f0] hover:border-[#1e3a8a] transition-all active:scale-95"
              >
                <div className="flex flex-col items-start gap-[4px]">
                  <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[14px]">
                    <p className="leading-[20px]">{t("기숙사", "Dormitory")}</p>
                  </div>
                  <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[#64748b] text-[12px]">
                    <p className="leading-[16px]">{t("시내", "City Center")}</p>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-[#e2e8f0]" />
                <div className="flex items-center gap-[6px]">
                  <div className="h-[14px] relative shrink-0 w-[15px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 19">
                      <path d={svgPaths.p1f93f980} fill="#1E3A8A" />
                    </svg>
                  </div>
                  <div className="flex flex-col font-['Public_Sans'] font-medium justify-center leading-[0] text-[#1e3a8a] text-[11px]">
                    <p className="leading-[14px]">{t("캠퍼스 셔틀", "Campus Shuttle")}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Nearest Stop Card */}
        <div className="relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-start px-[24px] py-[16px] relative w-full">
            <div className="bg-[#1e3a8a] relative rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full overflow-hidden">
              <div className="content-stretch flex flex-col items-start p-[24px] relative w-full">
                <div className="absolute bg-[rgba(255,255,255,0.1)] right-[-16px] rounded-[9999px] size-[128px] top-[-16px]" />
                <div className="absolute bg-[rgba(255,255,255,0.05)] bottom-[-32px] left-[-32px] rounded-[9999px] size-[128px]" />

                <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full z-10">
                  <div className="content-stretch flex gap-[8px] items-center opacity-90 relative shrink-0 w-full">
                    <div className="h-[11.667px] relative shrink-0 w-[9.333px]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 11.6667">
                        <path d={svgPaths.p3d8f00c0} fill="white" />
                      </svg>
                    </div>
                    <div className="flex flex-col font-['Public_Sans'] font-medium justify-center leading-[0] text-[12px] text-white tracking-[1.2px] uppercase">
                      <p className="leading-[16px]">{t("가장 가까운 정류장", "Nearest Stop")}</p>
                    </div>
                  </div>

                  <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[20px] text-white w-full">
                    <p className="leading-[28px]">{t("공과대학 1호관", "Engineering Bldg. 1")}</p>
                  </div>

                  <div className="content-stretch flex items-end justify-between pt-[12px] relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col items-start relative shrink-0">
                      <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[14px] text-white opacity-80">
                        <p className="leading-[20px]">{t("다음 도착", "Next Arrival")}</p>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-['Public_Sans'] font-black text-[30px] text-white leading-[36px]">
                          {nextArrival}
                        </span>
                        <span className="font-['Public_Sans'] font-bold text-[18px] text-white leading-[28px]">
                          {t("분", "mins")}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/campus-shuttle")}
                      className="content-stretch flex items-center justify-center p-[4px] relative rounded-[9999px] shrink-0 size-[48px] border-4 border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.4)] transition-all active:scale-95"
                    >
                      <div className="h-[22.167px] relative shrink-0 w-[18.667px]">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 22.1667">
                          <path d={svgPaths.p5416200} fill="white" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full">
            <button
              onClick={() => navigate("/campus-shuttle")}
              className="bg-white content-stretch flex items-center justify-between p-[21px] relative rounded-[16px] shrink-0 w-full border border-[#e2e8f0] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex gap-[16px] items-center">
                <div className="bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]">
                  <div className="h-[21px] relative shrink-0 w-[25.667px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.6667 21">
                      <path d={svgPaths.p2d903e00} fill="white" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[16px]">
                    <p className="leading-[24px]">{t("캠퍼스 셔틀", "Campus Shuttle")}</p>
                  </div>
                  <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[#64748b] text-[14px]">
                    <p className="leading-[17.5px]">{t("교내 순환버스", "Intra-campus circulation")}</p>
                  </div>
                </div>
              </div>
              <div className="h-[12px] relative shrink-0 w-[7.4px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.4 12">
                  <path d={svgPaths.p28c84800} fill="#94A3B8" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => navigate("/commuter-bus")}
              className="bg-white content-stretch flex items-center justify-between p-[21px] relative rounded-[16px] shrink-0 w-full border border-[#e2e8f0] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex gap-[16px] items-center">
                <div className="bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]">
                  <div className="h-[18.667px] relative shrink-0 w-[23.333px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.3333 18.6667">
                      <path d={svgPaths.p285d3c40} fill="white" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[16px]">
                    <p className="leading-[24px]">{t("통근버스", "Commuter Bus")}</p>
                  </div>
                  <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[#64748b] text-[14px]">
                    <p className="leading-[17.5px]">{t("인천, 서울, 경기", "Incheon, Seoul, Gyeonggi")}</p>
                  </div>
                </div>
              </div>
              <div className="h-[12px] relative shrink-0 w-[7.4px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.4 12">
                  <path d={svgPaths.p28c84800} fill="#94A3B8" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => navigate("/notice")}
              className="bg-white content-stretch flex items-center justify-between p-[21px] relative rounded-[16px] shrink-0 w-full border border-[#e2e8f0] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-all active:scale-[0.98] mb-[32px]"
            >
              <div className="flex gap-[16px] items-center">
                <div className="bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]">
                  <div className="h-[18.667px] relative shrink-0 w-[23.333px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.3333 18.6667">
                      <path d={svgPaths.p3106d480} fill="white" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[16px]">
                    <p className="leading-[24px]">{t("공지사항", "Notice")}</p>
                  </div>
                  <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[#64748b] text-[14px]">
                    <p className="leading-[17.5px]">{t("운행 변경 및 업데이트", "Schedule changes & updates")}</p>
                  </div>
                </div>
              </div>
              <div className="h-[12px] relative shrink-0 w-[7.4px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.4 12">
                  <path d={svgPaths.p28c84800} fill="#94A3B8" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Live Tracking */}
        <div className="relative shrink-0 w-full mb-4">
          <div className="content-stretch flex flex-col gap-[12px] items-start px-[24px] py-[16px] relative w-full">
            <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[18px] w-full">
              <p className="leading-[28px]">{t("실시간 추적", "Live Tracking")}</p>
            </div>

            <button
              onClick={() => navigate("/campus-shuttle")}
              className="bg-[#f1f5f9] content-stretch flex flex-col h-[128px] items-start justify-center overflow-clip relative rounded-[16px] shrink-0 w-full shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] hover:bg-[#e2e8f0] transition-all active:scale-[0.98]"
            >
              <div className="flex-[1_0_0] min-h-px min-w-px opacity-60 relative w-full">
                <div className="absolute inset-0 overflow-hidden">
                  <img alt="" className="absolute h-[267.19%] left-0 max-w-none top-[-83.59%] w-full" src={imgStylizedMapShowingCampusRoads} />
                </div>
                <div className="absolute bg-[rgba(255,255,255,0.4)] inset-0 mix-blend-saturation" />
              </div>

              <div className="absolute content-stretch flex inset-0 items-center justify-center">
                <div className="relative">
                  <div className="absolute bg-[rgba(30,58,138,0.2)] left-[-6px] rounded-[9999px] size-[32px] top-[-6px] animate-ping" />
                  <div className="bg-[#1e3a8a] relative rounded-[9999px] size-[20px] border-2 border-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
                </div>
              </div>

              <div className="absolute backdrop-blur-[2px] bg-[rgba(255,255,255,0.9)] bottom-[8px] content-stretch flex flex-col items-start px-[8px] py-[4px] right-[8px] rounded-[8px]">
                <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#1e293b] text-[10px]">
                  <p className="leading-[15px]">{t("캠퍼스 지도 실시간", "LIVE CAMPUS MAP")}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}