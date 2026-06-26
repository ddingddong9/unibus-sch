import { useMemo, useState, useEffect } from "react";
import NaverMapComponent from "./NaverMapComponent";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";

interface RouteMapModalProps {
  route: any;
  color: string;
  onClose: () => void;
}

export default function RouteMapModal({ route, color, onClose }: RouteMapModalProps) {
  const { t } = useLanguage();

  const rawStops: any[] = route.stops || [];

  const [mapStops, setMapStops] = useState<Array<{ id: string; name: string; position: { lat: number; lng: number } }>>([]);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [noLocation, setNoLocation] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMapStops([]);
    setRoutePath([]);
    setNoLocation(false);

    api.getRoutePath(route.id)
      .then(({ stops, path }) => {
        const withCoords = stops.filter((s) => s.lat != null && s.lng != null);
        if (withCoords.length === 0) {
          setNoLocation(true);
        } else {
          setMapStops(
            withCoords.map((s, i) => ({
              id: s.id,
              name: s.name,
              position: { lat: s.lat!, lng: s.lng! },
              type: i === 0 ? 'start' : i === withCoords.length - 1 ? 'end' : 'middle',
            } as any))
          );
          setRoutePath(path);
        }
      })
      .catch(() => setNoLocation(true))
      .finally(() => setLoading(false));
  }, [route.id]);

  const center = useMemo(() => {
    if (mapStops.length === 0) return { lat: 36.7694, lng: 126.9322 };
    return {
      lat: mapStops.reduce((s, m) => s + m.position.lat, 0) / mapStops.length,
      lng: mapStops.reduce((s, m) => s + m.position.lng, 0) / mapStops.length,
    };
  }, [mapStops]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-[24px] w-full max-w-[430px] flex flex-col shadow-2xl"
        style={{ height: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-[20px] pt-[20px] pb-[14px] border-b border-[#f1f5f9] shrink-0">
          <div
            className="rounded-[10px] size-[40px] flex items-center justify-center shrink-0 shadow"
            style={{ backgroundColor: color }}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] leading-tight">
              {route.name}
            </p>
            <p className="font-['Public_Sans'] text-[#64748b] text-[12px]">
              {loading
                ? t("위치 불러오는 중...", "Loading locations...")
                : `${t("전체 정류장", "All Stops")} · ${rawStops.length}${t("개", "")}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-[36px] rounded-full bg-[#f1f5f9] flex items-center justify-center hover:bg-[#e2e8f0] active:scale-95 transition-all shrink-0"
          >
            <svg className="w-4 h-4 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 지도 영역 */}
        <div className="relative flex-1 overflow-hidden bg-[#f8fafc]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
              <p className="font-['Public_Sans'] text-[#64748b] text-[13px]">
                {t("정류장 위치 검색 중...", "Finding stop locations...")}
              </p>
            </div>
          ) : noLocation ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <svg className="w-10 h-10 text-[#cbd5e1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="font-['Public_Sans'] text-[#94a3b8] text-[13px]">
                {t("정류장 위치를 찾지 못했습니다", "Could not find stop locations")}
              </p>
            </div>
          ) : (
            <NaverMapComponent
              center={center}
              zoom={12}
              stops={mapStops}
              routePath={routePath}
              fitBoundsKey={1}
            />
          )}

        </div>

        {/* 정류장 목록 */}
        <div className="border-t border-[#f1f5f9] bg-white shrink-0" style={{ maxHeight: "30vh" }}>
          <div className="px-[20px] pt-[12px] pb-[4px]">
            <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[13px]">
              {t("정류장 순서", "Stop Order")}
            </p>
          </div>
          <div className="overflow-y-auto px-[20px] pb-[20px]" style={{ maxHeight: "calc(30vh - 40px)" }}>
            {rawStops.length > 0 ? (
              <div>
                {rawStops.map((stop: any, index: number) => {
                  const isFirst = index === 0;
                  const isLast = index === rawStops.length - 1;
                  const dotColor = isFirst ? color : isLast ? "#1e3a8a" : "#94a3b8";
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="rounded-full size-[24px] flex items-center justify-center font-['Public_Sans'] font-bold text-[10px] text-white shrink-0 z-10"
                          style={{ backgroundColor: dotColor }}
                        >
                          {index + 1}
                        </div>
                        {!isLast && <div className="w-[2px] flex-1 min-h-[16px] bg-[#e2e8f0]" />}
                      </div>
                      <div className={`flex-1 py-[2px] ${!isLast ? "pb-[10px]" : ""}`}>
                        <p
                          className="font-['Public_Sans'] font-semibold text-[13px]"
                          style={{ color: isFirst ? color : isLast ? "#1e3a8a" : "#0f172a" }}
                        >
                          {stop.name}
                        </p>
                        {isFirst && (
                          <p className="font-['Public_Sans'] text-[10px]" style={{ color }}>
                            {t("출발", "Departure")}
                          </p>
                        )}
                        {isLast && (
                          <p className="font-['Public_Sans'] text-[10px] text-[#1e3a8a]">
                            {t("도착", "Arrival")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[#94a3b8] text-[13px] font-['Public_Sans'] py-4">
                {t("정류장 정보가 없습니다", "No stop information")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
