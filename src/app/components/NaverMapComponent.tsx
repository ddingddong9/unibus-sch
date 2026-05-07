import { useEffect, useRef } from "react";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  buses?: Array<{
    id: string;
    position: { lat: number; lng: number };
    heading?: number; // [변경] heading 추가
    label: string;
  }>;
  stops?: Array<{ id: string; name: string; position: { lat: number; lng: number } }>;
  userLocation?: { lat: number; lng: number } | null;
  focusLocation?: { lat: number; lng: number; zoom?: number; key?: number } | null;
  fitBoundsKey?: number;
  routePath?: [number, number][]; // [[lng, lat], ...] from Naver Directions API
  onBusClick?: (busId: string) => void;
  clientId?: string;
}

declare global {
  interface Window { naver: any; }
}

// [변경] rotation 파라미터 추가 — 마커 아이콘 원형부만 회전
const BUS_MARKER_CONTENT = (label: string, rotation = 0) => `
  <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.25));">
    <div style="background:#1e3b8a;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;transform:rotate(${rotation}deg);transition:transform 0.3s ease;">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="5" width="20" height="13" rx="2" fill="white"/>
        <rect x="2" y="9" width="20" height="2" fill="#1e3b8a" opacity="0.3"/>
        <rect x="6" y="5" width="1.5" height="13" fill="#1e3b8a" opacity="0.2"/>
        <rect x="16.5" y="5" width="1.5" height="13" fill="#1e3b8a" opacity="0.2"/>
        <circle cx="7" cy="20" r="2" fill="white" stroke="#1e3b8a" stroke-width="1.5"/>
        <circle cx="17" cy="20" r="2" fill="white" stroke="#1e3b8a" stroke-width="1.5"/>
        <rect x="4" y="6.5" width="7" height="4" rx="0.5" fill="#1e3b8a" opacity="0.5"/>
        <rect x="13" y="6.5" width="7" height="4" rx="0.5" fill="#1e3b8a" opacity="0.5"/>
      </svg>
    </div>
    <div style="margin-top:3px;background:#1e3b8a;color:white;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:800;letter-spacing:0.3px;white-space:nowrap;font-family:sans-serif;">
      ${label}
    </div>
  </div>
`;

const STOP_MARKER_CONTENT = (name: string) => `
  <div style="display:flex;flex-direction:column;align-items:center;cursor:default;">
    <div style="background:#1e3b8a;color:white;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;font-family:sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.2);letter-spacing:0.2px;">
      ${name}
    </div>
    <div style="width:2.5px;height:10px;background:#1e3b8a;"></div>
    <div style="width:9px;height:9px;border-radius:50%;background:#1e3b8a;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>
  </div>
`;

const USER_MARKER_CONTENT = () => `
  <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(30,58,138,0.18);"></div>
    <div style="position:relative;width:14px;height:14px;border-radius:50%;background:#1e3a8a;border:3px solid white;box-shadow:0 2px 8px rgba(30,58,138,0.4);"></div>
  </div>
`;

// [변경] RAF 보간 상수
const INTERP_MS = 600; // 500ms 업데이트 주기에 맞춘 보간 시간

// [변경] cubic ease-in-out (요청 스펙과 동일)
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function NaverMapComponent({
  center = { lat: 36.7694, lng: 126.9322 },
  zoom = 16,
  buses = [],
  stops = [],
  userLocation = null,
  focusLocation = null,
  fitBoundsKey = 0,
  routePath = [],
  onBusClick,
  clientId = import.meta.env.VITE_NAVER_CLIENT_ID || "YOUR_NAVER_CLIENT_ID",
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const busMarkersRef = useRef<any[]>([]);
  const stopMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const scriptLoadedRef = useRef<boolean>(false);

  const busesRef = useRef(buses);
  busesRef.current = buses;
  const stopsRef = useRef(stops);
  stopsRef.current = stops;
  const onBusClickRef = useRef(onBusClick);
  onBusClickRef.current = onBusClick;
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;
  const routePathRef = useRef(routePath);
  routePathRef.current = routePath;

  // ── snap-to-segment: GPS 좌표를 경로 선분 위 최근접 점으로 스냅 ──
  const snapToSegment = (
    px: number, py: number,
    ax: number, ay: number,
    bx: number, by: number
  ): { x: number; y: number; t: number; dist: number } => {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      return { x: ax, y: ay, t: 0, dist: (px - ax) ** 2 + (py - ay) ** 2 };
    }
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const cx = ax + t * dx, cy = ay + t * dy;
    return { x: cx, y: cy, t, dist: (px - cx) ** 2 + (py - cy) ** 2 };
  };

  // ── [변경] RAF 기반 마커 보간 ──
  const animateMarker = (
    marker: any,
    fromLat: number, fromLng: number, fromHeading: number,
    toLat: number, toLng: number, toHeading: number
  ) => {
    // [변경] 위치 변화 없으면 skip
    if (fromLat === toLat && fromLng === toLng) return;

    // [변경] 이전 RAF 취소 (중복 실행 방지)
    if (marker.__animRafId) {
      cancelAnimationFrame(marker.__animRafId);
      marker.__animRafId = null;
    }

    const route = routePathRef.current;
    let waypoints: { lat: number; lng: number }[] = [];

    if (route.length > 1) {
      const searchFrom: number = marker.__routeIdx ?? 0;
      const searchEnd = Math.min(searchFrom + Math.ceil(route.length * 0.5) + 10, route.length - 1);

      // snap-to-segment: 목적지를 경로 선분 위로 스냅
      let bestDist = Infinity;
      let bestIdx = searchFrom;
      let bestSnap = { x: toLng, y: toLat };

      for (let i = searchFrom; i < searchEnd; i++) {
        const [aLng, aLat] = route[i];
        const [bLng, bLat] = route[i + 1] ?? route[i];
        const snap = snapToSegment(toLng, toLat, aLng, aLat, bLng, bLat);
        if (snap.dist < bestDist) {
          bestDist = snap.dist;
          bestIdx = snap.t >= 0.5 ? i + 1 : i;
          bestSnap = { x: snap.x, y: snap.y };
        }
      }

      if (bestIdx > searchFrom) {
        waypoints = [
          ...route.slice(searchFrom, bestIdx).map(([lng, lat]) => ({ lat, lng })),
          { lat: bestSnap.y, lng: bestSnap.x },
        ];
        marker.__routeIdx = bestIdx;
      }
    }

    // 경로 없거나 스냅 실패 → 직선
    if (waypoints.length < 2) {
      waypoints = [{ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng }];
    }

    // [변경] heading 최단경로 회전 (예: 350° → 10° 는 +20° 회전)
    const headingDelta = ((toHeading - fromHeading) % 360 + 540) % 360 - 180;

    // [변경] heading 변경 시 아이콘 1회 업데이트 (per-frame setIcon 회피)
    if (Math.abs(headingDelta) > 5) {
      try {
        marker.setIcon({
          content: BUS_MARKER_CONTENT(marker.__label ?? '', Math.round(toHeading)),
          size: new window.naver.maps.Size(40, 60),
          anchor: new window.naver.maps.Point(20, 60),
        });
      } catch (_) {}
    }

    const segCount = waypoints.length - 1;
    const startTime = performance.now(); // [변경] performance.now() 기반

    // [변경] requestAnimationFrame 루프
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawT = Math.min(elapsed / INTERP_MS, 1);
      const t = easeInOut(rawT);

      const segIdx = Math.min(Math.floor(t * segCount), segCount - 1);
      const segT = t * segCount - segIdx;
      const from = waypoints[segIdx];
      const to   = waypoints[segIdx + 1] ?? waypoints[segIdx];

      const lat = from.lat + (to.lat - from.lat) * segT;
      const lng = from.lng + (to.lng - from.lng) * segT;

      try {
        marker.setPosition(new window.naver.maps.LatLng(lat, lng));
      } catch (_) {}

      if (rawT < 1) {
        marker.__animRafId = requestAnimationFrame(tick);
      } else {
        marker.__animRafId = null;
      }
    };

    marker.__animRafId = requestAnimationFrame(tick);
  };

  const updateBusMarkers = () => {
    if (!mapInstance.current || !window.naver) return;

    const currentBuses = busesRef.current;
    const existingMap = new Map<string, any>(
      busMarkersRef.current.map(m => [m.__busId, m])
    );
    const newMarkers: any[] = [];

    currentBuses.forEach(bus => {
      const existing = existingMap.get(bus.id);
      if (existing) {
        // [변경] in-flight 이어받기: 현재 마커 위치를 새 출발점으로 사용
        const pos = existing.getPosition();
        const fromLat = pos.lat();
        const fromLng = pos.lng();
        const fromHeading: number = existing.__heading ?? 0;

        animateMarker(
          existing,
          fromLat, fromLng, fromHeading,
          bus.position.lat, bus.position.lng, bus.heading ?? 0
        );
        existing.__heading = bus.heading ?? 0;
        existingMap.delete(bus.id);
        newMarkers.push(existing);
      } else {
        // 새 마커 생성
        try {
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(bus.position.lat, bus.position.lng),
            map: mapInstance.current,
            icon: {
              content: BUS_MARKER_CONTENT(bus.label, bus.heading ?? 0),
              size: new window.naver.maps.Size(40, 60),
              anchor: new window.naver.maps.Point(20, 60),
            },
            zIndex: 20,
          });
          marker.__busId = bus.id;
          marker.__label = bus.label;
          marker.__heading = bus.heading ?? 0;
          marker.__routeIdx = 0;
          marker.__animRafId = null; // [변경] RAF ID 초기화
          window.naver.maps.Event.addListener(marker, 'click', () => {
            onBusClickRef.current?.(bus.id);
          });
          newMarkers.push(marker);
        } catch (e) { console.error("버스 마커 오류:", e); }
      }
    });

    // [변경] 없어진 버스: RAF 취소 후 마커 제거
    existingMap.forEach(m => {
      if (m.__animRafId) {
        cancelAnimationFrame(m.__animRafId);
        m.__animRafId = null;
      }
      try { m.setMap(null); } catch (_) {}
    });
    busMarkersRef.current = newMarkers;
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

  const updatePolyline = (path: [number, number][]) => {
    if (!mapInstance.current || !window.naver) return;
    if (polylineRef.current) {
      try { polylineRef.current.setMap(null); } catch (_) {}
      polylineRef.current = null;
    }
    if (!path || path.length === 0) return;
    try {
      const latLngPath = path.map(([lng, lat]) => new window.naver.maps.LatLng(lat, lng));
      polylineRef.current = new window.naver.maps.Polyline({
        path: latLngPath,
        strokeColor: '#1e3a8a',
        strokeWeight: 5,
        strokeOpacity: 0.75,
        strokeStyle: 'solid',
        map: mapInstance.current,
        zIndex: 5,
      });
    } catch (e) { console.error("폴리라인 오류:", e); }
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
          if (routePathRef.current?.length) updatePolyline(routePathRef.current);
        });
      } catch (e) { console.error("네이버 지도 초기화 오류:", e); }
    };

    if (window.naver?.maps) { initializeMap(); return; }
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => { if (window.naver?.maps) initializeMap(); };
    script.onerror = () => console.error("네이버 지도 API 로드 실패. Client ID를 확인하세요.");
    document.head.appendChild(script);

    // [변경] cleanup: 모든 RAF 취소
    return () => {
      busMarkersRef.current.forEach(m => {
        if (m.__animRafId) {
          cancelAnimationFrame(m.__animRafId);
          m.__animRafId = null;
        }
        try { m.setMap(null); } catch (_) {}
      });
      stopMarkersRef.current.forEach(m => { try { m.setMap(null); } catch (_) {} });
      if (polylineRef.current) { try { polylineRef.current.setMap(null); } catch (_) {} }
    };
  }, []);

  useEffect(() => { updateBusMarkers(); }, [buses]);
  useEffect(() => { updateStopMarkers(); }, [stops]);
  useEffect(() => { updateUserMarker(userLocation ?? null); }, [userLocation]);
  useEffect(() => { updatePolyline(routePath); }, [routePath]);

  useEffect(() => {
    if (!focusLocation || !mapInstance.current || !window.naver) return;
    mapInstance.current.setCenter(new window.naver.maps.LatLng(focusLocation.lat, focusLocation.lng));
    mapInstance.current.setZoom(focusLocation.zoom ?? 18);
  }, [focusLocation]);

  useEffect(() => {
    if (!fitBoundsKey || !mapInstance.current || !window.naver) return;
    const currentStops = stopsRef.current;
    if (currentStops.length === 0) return;
    const bounds = new window.naver.maps.LatLngBounds();
    currentStops.forEach(s => bounds.extend(new window.naver.maps.LatLng(s.position.lat, s.position.lng)));
    mapInstance.current.fitBounds(bounds, { padding: 80 });
  }, [fitBoundsKey]);

  const handleZoomIn  = () => { mapInstance.current?.setZoom(mapInstance.current.getZoom() + 1); };
  const handleZoomOut = () => { mapInstance.current?.setZoom(mapInstance.current.getZoom() - 1); };
  const handleLocate  = () => {
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
