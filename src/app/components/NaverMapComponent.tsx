import { useEffect, useRef } from "react";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  buses?: Array<{
    id: string;
    position: { lat: number; lng: number };
    label: string;
  }>;
  clientId?: string;
}

declare global {
  interface Window {
    naver: any;
  }
}

const BUS_MARKER_CONTENT = (label: string) => `
  <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
    <div style="background: #1e3b8a; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px white, 0 10px 15px -3px rgba(0,0,0,0.1);">
      <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
        <path d="M11.667 6.667H10V5h1.667v1.667zM10 10h1.667V8.333H10V10zm-8.333 0H3.333V8.333H1.667V10zm0-3.333H3.333V5H1.667v1.667zM5 15h3.333v-1.667H5V15zM12.5 3.333h-1.667V2.5c0-.917-.75-1.667-1.666-1.667h-6.5C1.75.833 1 1.583 1 2.5v10c0 .917.75 1.667 1.667 1.667H3.333v.833c0 .917.75 1.667 1.667 1.667h6.667c.916 0 1.666-.75 1.666-1.667v-10c0-.917-.75-1.667-1.666-1.667zm-10 10V2.5h6.667v1.667H5c-.917 0-1.667.75-1.667 1.666v7.5H2.5z" fill="white"/>
      </svg>
    </div>
    <div style="margin-top: 4px; background: white; padding: 3px 9px; border-radius: 4px; border: 1px solid rgba(30,58,138,0.1); box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); white-space: nowrap;">
      <span style="font-family: 'Public Sans', sans-serif; font-weight: 900; font-size: 10px; color: #1e3b8a; line-height: 15px;">${label}</span>
    </div>
  </div>
`;

export default function NaverMapComponent({
  center = { lat: 36.7995, lng: 127.0753 },
  zoom = 16,
  buses = [],
  clientId = import.meta.env.VITE_NAVER_CLIENT_ID || "YOUR_NAVER_CLIENT_ID"
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const scriptLoadedRef = useRef<boolean>(false);
  // ref로 최신 buses 유지 (idle 콜백의 stale closure 방지)
  const busesRef = useRef(buses);
  busesRef.current = buses;

  const updateMarkers = () => {
    if (!mapInstance.current || !window.naver) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    busesRef.current.forEach(bus => {
      try {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(bus.position.lat, bus.position.lng),
          map: mapInstance.current,
          icon: {
            content: BUS_MARKER_CONTENT(bus.label),
            size: new window.naver.maps.Size(40, 60),
            anchor: new window.naver.maps.Point(20, 60)
          }
        });
        markersRef.current.push(marker);
      } catch (error) {
        console.error("마커 생성 오류:", error);
      }
    });
  };

  // 지도 초기화 (clientId, center, zoom 변경 시)
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
        // 지도 준비 완료 후 마커 표시
        window.naver.maps.Event.addListener(mapInstance.current, 'idle', updateMarkers);
      } catch (error) {
        console.error("네이버 지도 초기화 오류:", error);
      }
    };

    if (window.naver?.maps) {
      initializeMap();
      return;
    }

    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement("script");
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    console.log("[NaverMap] Loading with clientId:", clientId);
    script.onload = () => { if (window.naver?.maps) initializeMap(); };
    script.onerror = () => console.error("네이버 지도 API를 로드할 수 없습니다. Client ID를 확인해주세요.");
    document.head.appendChild(script);

    return () => {
      markersRef.current.forEach(marker => { try { marker.setMap(null); } catch (_) {} });
    };
  }, [center.lat, center.lng, zoom, clientId]);

  // 버스 위치 변경 시 마커 업데이트
  useEffect(() => {
    updateMarkers();
  }, [buses]);

  const handleZoomIn = () => { mapInstance.current?.setZoom(mapInstance.current.getZoom() + 1); };
  const handleZoomOut = () => { mapInstance.current?.setZoom(mapInstance.current.getZoom() - 1); };
  const handleLocate = () => {
    if (mapInstance.current && window.naver) {
      mapInstance.current.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
      mapInstance.current.setZoom(zoom);
    }
  };

  return (
    <>
      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ background: '#e2e8f0' }}
      />

      {/* Custom Map Controls */}
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
