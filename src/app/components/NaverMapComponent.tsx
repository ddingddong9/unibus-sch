import { useEffect, useRef } from "react";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  buses?: Array<{ id: string; position: { lat: number; lng: number }; label: string }>;
  stops?: Array<{ id: string; name: string; position: { lat: number; lng: number } }>;
  userLocation?: { lat: number; lng: number } | null;
  focusLocation?: { lat: number; lng: number; zoom?: number; key?: number } | null;
  fitBoundsKey?: number;
  onBusClick?: (busId: string) => void;
  clientId?: string;
}

declare global {
  interface Window { naver: any; }
}

const BUS_MARKER_CONTENT = (label: string) => `
  <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
    <div style="background:#1e3a8a;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px white,0 10px 15px -3px rgba(0,0,0,0.15);">
      <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
        <path d="M11.667 6.667H10V5h1.667v1.667zM10 10h1.667V8.333H10V10zm-8.333 0H3.333V8.333H1.667V10zm0-3.333H3.333V5H1.667v1.667zM5 15h3.333v-1.667H5V15zM12.5 3.333h-1.667V2.5c0-.917-.75-1.667-1.666-1.667h-6.5C1.75.833 1 1.583 1 2.5v10c0 .917.75 1.667 1.667 1.667H3.333v.833c0 .917.75 1.667 1.667 1.667h6.667c.916 0 1.666-.75 1.666-1.667v-10c0-.917-.75-1.667-1.666-1.667zm-10 10V2.5h6.667v1.667H5c-.917 0-1.667.75-1.667 1.666v7.5H2.5z" fill="white"/>
      </svg>
    </div>
    <div style="margin-top:4px;background:white;padding:3px 9px;border-radius:4px;border:1px solid rgba(30,58,138,0.15);box-shadow:0 1px 4px rgba(0,0,0,0.08);white-space:nowrap;">
      <span style="font-family:'Public Sans',sans-serif;font-weight:900;font-size:10px;color:#1e3a8a;line-height:15px;">${label}</span>
    </div>
  </div>
`;

const STOP_MARKER_CONTENT = (name: string) => `
  <div style="display:flex;flex-direction:column;align-items:center;">
    <div style="background:white;width:30px;height:30px;border-radius:50%;border:2.5px solid #1e3a8a;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="12" rx="2" fill="#1e3a8a"/>
        <rect x="3" y="9" width="18" height="1.5" fill="white" opacity="0.6"/>
        <rect x="7" y="5" width="1.5" height="12" fill="white" opacity="0.3"/>
        <rect x="15.5" y="5" width="1.5" height="12" fill="white" opacity="0.3"/>
        <circle cx="7.5" cy="19" r="2" fill="#1e3a8a"/>
        <circle cx="16.5" cy="19" r="2" fill="#1e3a8a"/>
      </svg>
    </div>
    <div style="margin-top:3px;background:white;padding:2px 6px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.12);white-space:nowrap;border:1px solid rgba(30,58,138,0.08);">
      <span style="font-family:'Public Sans',sans-serif;font-size:9px;font-weight:700;color:#0f172a;">${name}</span>
    </div>
  </div>
`;

const USER_MARKER_CONTENT = () => `
  <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(30,58,138,0.18);"></div>
    <div style="position:relative;width:14px;height:14px;border-radius:50%;background:#1e3a8a;border:3px solid white;box-shadow:0 2px 8px rgba(30,58,138,0.4);"></div>
  </div>
`;

export default function NaverMapComponent({
  center = { lat: 36.7694, lng: 126.9322 },
  zoom = 16,
  buses = [],
  stops = [],
  userLocation = null,
  focusLocation = null,
  fitBoundsKey = 0,
  onBusClick,
  clientId = import.meta.env.VITE_NAVER_CLIENT_ID || "YOUR_NAVER_CLIENT_ID",
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const busMarkersRef = useRef<any[]>([]);
  const stopMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const scriptLoadedRef = useRef<boolean>(false);

  // 항상 최신 값 참조 (stale closure 방지)
  const busesRef = useRef(buses);
  busesRef.current = buses;
  const stopsRef = useRef(stops);
  stopsRef.current = stops;
  const onBusClickRef = useRef(onBusClick);
  onBusClickRef.current = onBusClick;
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  const updateBusMarkers = () => {
    if (!mapInstance.current || !window.naver) return;
    busMarkersRef.current.forEach(m => { try { m.setMap(null); } catch (_) {} });
    busMarkersRef.current = [];
    busesRef.current.forEach(bus => {
      try {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(bus.position.lat, bus.position.lng),
          map: mapInstance.current,
          icon: {
            content: BUS_MARKER_CONTENT(bus.label),
            size: new window.naver.maps.Size(40, 60),
            anchor: new window.naver.maps.Point(20, 60),
          },
          zIndex: 20,
        });
        window.naver.maps.Event.addListener(marker, 'click', () => {
          onBusClickRef.current?.(bus.id);
        });
        busMarkersRef.current.push(marker);
      } catch (e) { console.error("버스 마커 오류:", e); }
    });
  };

  const updateStopMarkers = () => {
    if (!mapInstance.current || !window.naver) return;
    stopMarkersRef.current.forEach(m => { try { m.setMap(null); } catch (_) {} });
    stopMarkersRef.current = [];
    stopsRef.current.forEach(stop => {
      try {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(stop.position.lat, stop.position.lng),
          map: mapInstance.current,
          icon: {
            content: STOP_MARKER_CONTENT(stop.name),
            size: new window.naver.maps.Size(30, 50),
            anchor: new window.naver.maps.Point(15, 30),
          },
          zIndex: 10,
        });
        stopMarkersRef.current.push(marker);
      } catch (e) { console.error("정류장 마커 오류:", e); }
    });
  };

  const updateUserMarker = (loc: { lat: number; lng: number } | null) => {
    if (!mapInstance.current || !window.naver) return;
    if (userMarkerRef.current) {
      try { userMarkerRef.current.setMap(null); } catch (_) {}
      userMarkerRef.current = null;
    }
    if (!loc) return;
    try {
      userMarkerRef.current = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(loc.lat, loc.lng),
        map: mapInstance.current,
        icon: {
          content: USER_MARKER_CONTENT(),
          size: new window.naver.maps.Size(28, 28),
          anchor: new window.naver.maps.Point(14, 14),
        },
        zIndex: 30,
      });
    } catch (e) { console.error("사용자 마커 오류:", e); }
  };

  // 지도 초기화
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || mapInstance.current) return;
      try {
        mapInstance.current = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
        });
        window.naver.maps.Event.addListener(mapInstance.current, 'idle', () => {
          updateBusMarkers();
          updateStopMarkers();
        });
      } catch (e) { console.error("네이버 지도 초기화 오류:", e); }
    };

    if (window.naver?.maps) { initializeMap(); return; }
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => { if (window.naver?.maps) initializeMap(); };
    script.onerror = () => console.error("네이버 지도 API 로드 실패. Client ID를 확인하세요.");
    document.head.appendChild(script);

    return () => {
      busMarkersRef.current.forEach(m => { try { m.setMap(null); } catch (_) {} });
      stopMarkersRef.current.forEach(m => { try { m.setMap(null); } catch (_) {} });
    };
  }, []);

  // 버스 마커 갱신
  useEffect(() => { updateBusMarkers(); }, [buses]);

  // 정류장 마커 갱신
  useEffect(() => { updateStopMarkers(); }, [stops]);

  // 사용자 위치 마커 갱신
  useEffect(() => { updateUserMarker(userLocation ?? null); }, [userLocation]);

  // 특정 위치로 포커스 (버스 클릭 / 사용자 위치 버튼)
  useEffect(() => {
    if (!focusLocation || !mapInstance.current || !window.naver) return;
    mapInstance.current.setCenter(new window.naver.maps.LatLng(focusLocation.lat, focusLocation.lng));
    mapInstance.current.setZoom(focusLocation.zoom ?? 18);
  }, [focusLocation]);

  // 전체보기 (모든 정류장이 보이도록 fitBounds)
  useEffect(() => {
    if (!fitBoundsKey || !mapInstance.current || !window.naver) return;
    const currentStops = stopsRef.current;
    if (currentStops.length === 0) return;
    const bounds = new window.naver.maps.LatLngBounds();
    currentStops.forEach(s => bounds.extend(new window.naver.maps.LatLng(s.position.lat, s.position.lng)));
    mapInstance.current.fitBounds(bounds, { padding: 80 });
  }, [fitBoundsKey]);

  const handleZoomIn = () => { mapInstance.current?.setZoom(mapInstance.current.getZoom() + 1); };
  const handleZoomOut = () => { mapInstance.current?.setZoom(mapInstance.current.getZoom() - 1); };

  // 내 위치 버튼: 사용자 위치가 있으면 그쪽으로, 없으면 캠퍼스 중심으로
  const handleLocate = () => {
    if (!mapInstance.current || !window.naver) return;
    const loc = userLocationRef.current ?? center;
    mapInstance.current.setCenter(new window.naver.maps.LatLng(loc.lat, loc.lng));
    mapInstance.current.setZoom(18);
  };

  return (
    <>
      <div ref={mapRef} className="absolute inset-0 w-full h-full z-0" style={{ background: '#e2e8f0' }} />

      {/* 지도 컨트롤 버튼 */}
      <div className="absolute content-stretch flex flex-col gap-[8px] items-start right-[16px] top-[128px] z-20">
        <button
          onClick={handleZoomIn}
          className="bg-white content-stretch flex items-center justify-center p-px relative rounded-[12px] shrink-0 size-[40px] border border-[#f1f5f9] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] hover:bg-gray-50 active:scale-95 transition-all"
        >
          <div className="relative shrink-0 size-[14px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
              <path d="M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z" fill="#334155" />
            </svg>
          </div>
        </button>

        <button
          onClick={handleZoomOut}
          className="bg-white content-stretch flex items-center justify-center p-px relative rounded-[12px] shrink-0 size-[40px] border border-[#f1f5f9] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] hover:bg-gray-50 active:scale-95 transition-all"
        >
          <div className="h-[2px] relative shrink-0 w-[14px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 2">
              <path d="M0 2V0H14V2H0V2" fill="#334155" />
            </svg>
          </div>
        </button>

        <div className="pt-[8px]">
          <button
            onClick={handleLocate}
            className="bg-white content-stretch flex items-center justify-center p-px relative rounded-[12px] shrink-0 size-[40px] border border-[rgba(30,58,138,0.05)] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] hover:bg-blue-50 active:scale-95 transition-all"
          >
            <div className="relative shrink-0 size-[21.9px]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.9 21.9">
                <path d="M10.95 10.95C12.1546 10.95 13.31 10.4705 14.1539 9.62661C14.9978 8.78271 15.4773 7.62728 15.4773 6.42273C15.4773 5.21817 14.9978 4.06274 14.1539 3.21884C13.31 2.37495 12.1546 1.89545 10.95 1.89545C9.74546 1.89545 8.59003 2.37495 7.74613 3.21884C6.90224 4.06274 6.42273 5.21817 6.42273 6.42273C6.42273 7.62728 6.90224 8.78271 7.74613 9.62661C8.59003 10.4705 9.74546 10.95 10.95 10.95ZM10.95 0C12.6572 0 14.2944 0.677588 15.5034 1.88656C16.7124 3.09554 17.39 4.73271 17.39 6.43991C17.39 12.2698 10.95 21.9 10.95 21.9C10.95 21.9 4.51 12.2698 4.51 6.43991C4.51 4.73271 5.18759 3.09554 6.39656 1.88656C7.60554 0.677588 9.24271 0 10.95 0Z" fill="#1E3A8A" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
