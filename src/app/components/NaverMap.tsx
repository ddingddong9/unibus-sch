import { useEffect, useRef } from "react";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    label: string;
    icon?: string;
  }>;
}

declare global {
  interface Window {
    naver: any;
  }
}

export default function NaverMap({ 
  center = { lat: 36.7995, lng: 127.0753 }, // 순천향대학교 좌표
  zoom = 16,
  markers = []
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstances = useRef<any[]>([]);

  useEffect(() => {
    // Load Naver Maps script
    const loadNaverMaps = () => {
      if (window.naver && window.naver.maps) {
        initMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID`;
      script.async = true;
      script.onload = () => {
        if (window.naver && window.naver.maps) {
          initMap();
        }
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.naver || !window.naver.maps) return;

      // Create map
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: zoom,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
      });

      // Add markers
      updateMarkers();
    };

    const updateMarkers = () => {
      if (!mapInstance.current || !window.naver) return;

      // Clear existing markers
      markerInstances.current.forEach(marker => marker.setMap(null));
      markerInstances.current = [];

      // Add new markers
      markers.forEach(markerData => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(markerData.position.lat, markerData.position.lng),
          map: mapInstance.current,
          icon: {
            content: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="background: #1e3b8a; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px white, 0 10px 15px -3px rgba(0,0,0,0.1);">
                  <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
                    <path d="M11.667 6.667H10V5h1.667v1.667zM10 10h1.667V8.333H10V10zm-8.333 0H3.333V8.333H1.667V10zm0-3.333H3.333V5H1.667v1.667zM5 15h3.333v-1.667H5V15zM12.5 3.333h-1.667V2.5c0-.917-.75-1.667-1.666-1.667h-6.5C1.75.833 1 1.583 1 2.5v10c0 .917.75 1.667 1.667 1.667H3.333v.833c0 .917.75 1.667 1.667 1.667h6.667c.916 0 1.666-.75 1.666-1.667v-10c0-.917-.75-1.667-1.666-1.667zm-10 10V2.5h6.667v1.667H5c-.917 0-1.667.75-1.667 1.666v7.5H2.5z" fill="white"/>
                  </svg>
                </div>
                <div style="margin-top: 4px; background: white; padding: 3px 9px; border-radius: 4px; border: 1px solid rgba(30,58,138,0.1); box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
                  <span style="font-family: 'Public Sans', sans-serif; font-weight: 900; font-size: 10px; color: #1e3b8a; line-height: 15px;">${markerData.label}</span>
                </div>
              </div>
            `,
            anchor: new window.naver.maps.Point(20, 60),
          },
        });
        markerInstances.current.push(marker);
      });
    };

    loadNaverMaps();

    return () => {
      markerInstances.current.forEach(marker => marker.setMap(null));
    };
  }, [center.lat, center.lng, zoom, markers]);

  return (
    <div 
      ref={mapRef} 
      className="absolute inset-0 w-full h-full"
      style={{ background: '#e2e8f0' }}
    />
  );
}
