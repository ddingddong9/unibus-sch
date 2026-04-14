// Campus shuttle route path via Naver Directions API (with straight-line fallback)

import { Hono } from "npm:hono";

const campus = new Hono();

const STOPS = [
  { id: "rear-gate", name: "후문",   lat: 36.772760, lng: 126.933816 },
  { id: "hyang3",    name: "향3",    lat: 36.768228, lng: 126.935383 },
  { id: "hyang1",    name: "향1",    lat: 36.767905, lng: 126.932505 },
  { id: "library",   name: "도서관", lat: 36.768856, lng: 126.931303 },
  { id: "main-gate", name: "정문",   lat: 36.769014, lng: 126.927978 },
];

// 두 점 사이 보간 (steps개의 [lng, lat] 좌표)
function interpolate(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  steps: number
): [number, number][] {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / steps;
    return [from.lng + (to.lng - from.lng) * t, from.lat + (to.lat - from.lat) * t];
  });
}

// 전체 fallback 경로 (정류장 간 직선 보간 30점씩)
function getFallbackPath(): [number, number][] {
  return STOPS.flatMap((stop, i) => {
    if (i === STOPS.length - 1) return [];
    return interpolate(stop, STOPS[i + 1], 30);
  });
}

campus.get("/path", async (c) => {
  const clientId  = Deno.env.get("NAVER_CLIENT_ID");
  const secretKey = Deno.env.get("NAVER_SECRET_KEY");

  // Naver Directions API 시도
  if (clientId && secretKey) {
    try {
      const start     = `${STOPS[0].lng},${STOPS[0].lat}`;
      const goal      = `${STOPS[4].lng},${STOPS[4].lat}`;
      const waypoints = STOPS.slice(1, 4).map(s => `${s.lng},${s.lat}`).join("|");

      // trafast 옵션으로 시도 (tracomfort보다 더 넓게 지원)
      const url = `https://naveropenapi.apigw.naver.com/map-direction/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=trafast`;

      const res = await fetch(url, {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY":    secretKey,
        },
      });

      const data = await res.json();
      console.log("Naver Directions response code:", data.code, "message:", data.message);

      if (data.code === 0) {
        const path: [number, number][] = data.route?.trafast?.[0]?.path ?? [];
        if (path.length > 0) {
          console.log(`✅ Directions API path: ${path.length} points`);
          return c.json({ success: true, data: { path, stops: STOPS, source: "directions" } });
        }
      }

      console.warn("⚠️ Directions API returned no path, using fallback. code:", data.code, data.message);
    } catch (e) {
      console.error("❌ Directions API error:", e);
    }
  }

  // Fallback: 직선 보간 경로
  const path = getFallbackPath();
  console.log(`✅ Fallback path: ${path.length} points`);
  return c.json({ success: true, data: { path, stops: STOPS, source: "fallback" } });
});

export default campus;
