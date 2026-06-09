import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import svgPaths from "../../imports/svg-odbnwpa57u";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import { HomeSkeleton } from "../components/SkeletonLoaders";
import { api } from "../services/api";

// 학내 순환 정류장 목록
const CAMPUS_STOPS = [
  { id: "rear-gate", nameKo: "후문",   lat: 36.772760, lng: 126.933816 },
  { id: "hyang3",    nameKo: "향3",    lat: 36.768228, lng: 126.935383 },
  { id: "hyang1",    nameKo: "향1",    lat: 36.767905, lng: 126.932505 },
  { id: "library",   nameKo: "도서관", lat: 36.768856, lng: 126.930700 },
  { id: "main-gate", nameKo: "정문",   lat: 36.769014, lng: 126.927978 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
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

// 캠퍼스 평균 속도 15km/h = 0.25km/min
function getArrivalMinutes(stopLat: number, stopLng: number, buses: { lat: number; lng: number }[]) {
  if (buses.length === 0) return null;
  const minDist = Math.min(...buses.map(b => haversineKm(b.lat, b.lng, stopLat, stopLng)));
  return Math.max(1, Math.round(minDist / 0.25));
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 350, damping: 28, delay },
  }),
};

const staggerList = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const listItem = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 28 },
  },
};

export default function HomeWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [nearestStop, setNearestStop] = useState<string>("--");
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeBuses, setActiveBuses] = useState<{ lat: number; lng: number }[]>([]);

  // 사용자 GPS 위치 → 가장 가까운 정류장 계산
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // 권한 거부 시 무시
    );
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    let nearest = CAMPUS_STOPS[0];
    let minDist = Infinity;
    CAMPUS_STOPS.forEach(stop => {
      const d = haversineKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
      if (d < minDist) { minDist = d; nearest = stop; }
    });
    setNearestStop(nearest.nameKo);
  }, [userLocation]);

  // 활성 버스 위치 fetch
  const fetchBuses = useCallback(async () => {
    try {
      const [allBuses, locations] = await Promise.all([
        api.getBuses(),
        api.getBusLocations(),
      ]);
      const activeIds = new Set(
        allBuses.filter((b: any) => b.status === 'active').map((b: any) => b.id)
      );
      const buses = locations
        .filter((l: any) => activeIds.has(l.busId))
        .map((l: any) => ({ lat: l.lat, lng: l.lng }));
      setActiveBuses(buses);
    } catch {
      // 실패 시 유지
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 30000);
    return () => clearInterval(interval);
  }, [fetchBuses]);

  // 활성 버스 여부 (캠퍼스 버스 기준)
  const busActive = activeBuses.length > 0;
  // 가장 가까운 정류장까지 도착 예정 시간
  const target = CAMPUS_STOPS.find(s => s.nameKo === nearestStop) ?? CAMPUS_STOPS[4];
  const nextArrival = getArrivalMinutes(target.lat, target.lng, activeBuses);

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-start relative size-full">
      <div className="bg-white content-stretch flex flex-col items-start overflow-y-auto scrollbar-hide pb-[120px] relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full" style={{ height: '100dvh' }}>

        {/* Header – sticky, no entrance animation */}
        <div className="sticky top-0 z-30 w-full pt-safe">
          <div className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] flex flex-row items-center w-full">
            <div className="content-stretch flex items-center justify-between pb-[12px] pt-[16px] px-[24px] relative w-full">
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
              </button>
            </div>
          </div>
        </div>

        {/* ── Skeleton / Content switch ─────────────────────── */}
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div
              key="home-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <HomeSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="home-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >

              {/* Favorite Routes */}
              <motion.div
                className="relative shrink-0 w-full"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.05}
              >
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
                    {[
                      { title: t("정문", "Main Gate"), sub: t("신창역", "Sinchang Stn.") },
                      { title: t("기숙사", "Dormitory"), sub: t("시내", "City Center") },
                    ].map((route, i) => (
                      <motion.button
                        key={route.title}
                        onClick={() => navigate("/campus-shuttle")}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.1 + i * 0.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white flex flex-col gap-[8px] min-w-[120px] p-[16px] rounded-[12px] border-2 border-[#e2e8f0] hover:border-[#1e3a8a] transition-all"
                      >
                        <div className="flex flex-col items-start gap-[4px]">
                          <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[14px]">
                            <p className="leading-[20px]">{route.title}</p>
                          </div>
                          <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[#64748b] text-[12px]">
                            <p className="leading-[16px]">{route.sub}</p>
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
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Nearest Stop Card */}
              <motion.div
                className="relative shrink-0 w-full"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.15}
              >
                <div className="content-stretch flex flex-col items-start px-[24px] py-[16px] relative w-full">
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#1e3a8a] relative rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full overflow-hidden cursor-pointer"
                    onClick={() => navigate("/campus-shuttle")}
                  >
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
                          <p className="leading-[28px]">{nearestStop}</p>
                        </div>

                        <div className="content-stretch flex items-end justify-between pt-[12px] relative shrink-0 w-full">
                          <div className="content-stretch flex flex-col items-start relative shrink-0">
                            <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[14px] text-white opacity-80">
                              <p className="leading-[20px]">{t("운행 현황", "Service Status")}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {loading ? (
                                <span className="font-['Public_Sans'] font-bold text-[16px] text-white/70">{t("확인 중...", "Checking...")}</span>
                              ) : busActive ? (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                                  <div className="flex items-baseline gap-1">
                                    <span className="font-['Public_Sans'] font-black text-[20px] text-white leading-[28px]">
                                      {nextArrival ? `${nextArrival}분` : t("운행 중", "In Service")}
                                    </span>
                                    {nextArrival && (
                                      <span className="font-['Public_Sans'] font-bold text-[14px] text-white/80">
                                        {t("후 도착", "to arrive")}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-white/40" />
                                  <span className="font-['Public_Sans'] font-black text-[20px] text-white/70 leading-[28px]">{t("운행 없음", "No Service")}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); navigate("/campus-shuttle"); }}
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
                  </motion.div>
                </div>
              </motion.div>

              {/* Quick Actions – stagger */}
              <motion.div
                className="relative shrink-0 w-full"
                variants={staggerList}
                initial="hidden"
                animate="visible"
              >
                <div className="content-stretch flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full">
                  {[
                    {
                      path: "/campus-shuttle",
                      icon: svgPaths.p2d903e00,
                      viewBox: "0 0 25.6667 21",
                      title: t("캠퍼스 셔틀", "Campus Shuttle"),
                      sub: t("교내 순환버스", "Intra-campus circulation"),
                    },
                    {
                      path: "/commuter-bus",
                      icon: svgPaths.p285d3c40,
                      viewBox: "0 0 23.3333 18.6667",
                      title: t("통근버스", "Commuter Bus"),
                      sub: t("인천, 서울, 경기", "Incheon, Seoul, Gyeonggi"),
                    },
                    {
                      path: "/notice",
                      icon: svgPaths.p3106d480,
                      viewBox: "0 0 23.3333 18.6667",
                      title: t("공지사항", "Notice"),
                      sub: t("운행 변경 및 업데이트", "Schedule changes & updates"),
                      extra: "mb-[32px]",
                    },
                  ].map((action) => (
                    <motion.button
                      key={action.path + action.title}
                      variants={listItem}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(action.path)}
                      className={`bg-white content-stretch flex items-center justify-between p-[21px] relative rounded-[16px] shrink-0 w-full border border-[#e2e8f0] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-all ${action.extra ?? ""}`}
                    >
                      <div className="flex gap-[16px] items-center">
                        <div className="bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]">
                          <div className="h-[21px] relative shrink-0 w-[25.667px]">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={action.viewBox}>
                              <path d={action.icon} fill="white" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[16px]">
                            <p className="leading-[24px]">{action.title}</p>
                          </div>
                          <div className="flex flex-col font-['Public_Sans'] font-normal justify-center leading-[0] text-[#64748b] text-[14px]">
                            <p className="leading-[17.5px]">{action.sub}</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[12px] relative shrink-0 w-[7.4px]">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.4 12">
                          <path d={svgPaths.p28c84800} fill="#94A3B8" />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Live Tracking */}
              <motion.div
                className="relative shrink-0 w-full mb-4"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.4}
              >
                <div className="content-stretch flex flex-col gap-[12px] items-start px-[24px] py-[16px] relative w-full">
                  <div className="flex flex-col font-['Public_Sans'] font-bold justify-center leading-[0] text-[#0f172a] text-[18px] w-full">
                    <p className="leading-[28px]">{t("실시간 추적", "Live Tracking")}</p>
                  </div>

                  <motion.button
                    onClick={() => navigate("/campus-shuttle")}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#f1f5f9] content-stretch flex flex-col h-[128px] items-start justify-center overflow-clip relative rounded-[16px] shrink-0 w-full shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] hover:bg-[#e2e8f0] transition-all"
                  >
                    <div className="flex-[1_0_0] min-h-px min-w-px opacity-60 relative w-full">
                      <div className="absolute inset-0 overflow-hidden">
                        <img alt="" className="absolute h-[267.19%] left-0 max-w-none top-[-83.59%] w-full" />
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
                  </motion.button>
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
        {/* ── End skeleton / content ────────────────────────── */}

      </div>

      <BottomNav />
    </div>
  );
}
