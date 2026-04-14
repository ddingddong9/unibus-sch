// Campus shuttle route path via Naver Directions API

import { Hono } from "npm:hono";

const campus = new Hono();

// 학내순환 정류장 (순서대로)
const STOPS = [
  { id: "rear-gate", name: "후문",   lat: 36.772760, lng: 126.933816 },
  { id: "hyang3",    name: "향3",    lat: 36.768228, lng: 126.935383 },
  { id: "hyang1",    name: "향1",    lat: 36.767905, lng: 126.932505 },
  { id: "library",   name: "도서관", lat: 36.768856, lng: 126.931303 },
  { id: "main-gate", name: "정문",   lat: 36.769014, lng: 126.927978 },
];

// GET /campus/path — 학내순환 도로 경로 좌표 반환
campus.get("/path", async (c) => {
  const clientId  = Deno.env.get("NAVER_CLIENT_ID");
  const secretKey = Deno.env.get("NAVER_SECRET_KEY");

  if (!clientId || !secretKey) {
    console.error("❌ Naver API keys not configured");
    return c.json({ success: false, error: "Naver API keys not configured" }, 500);
  }

  // 후문(start) → 향3|향1|도서관(waypoints) → 정문(goal)
  const start     = `${STOPS[0].lng},${STOPS[0].lat}`;
  const goal      = `${STOPS[4].lng},${STOPS[4].lat}`;
  const waypoints = STOPS.slice(1, 4).map(s => `${s.lng},${s.lat}`).join("|");

  const url = `https://naveropenapi.apigw.naver.com/map-direction/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=tracomfort`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY":    secretKey,
      },
    });

    const data = await res.json();

    if (data.code !== 0) {
      console.error("❌ Naver Directions error:", data);
      return c.json({ success: false, error: data.message || "Directions API error" }, 500);
    }

    // tracomfort 첫 번째 경로의 path ([[lng, lat], ...])
    const path: [number, number][] = data.route?.tracomfort?.[0]?.path ?? [];

    console.log(`✅ Campus path fetched: ${path.length} points`);

    return c.json({
      success: true,
      data: { path, stops: STOPS },
    });
  } catch (e: any) {
    console.error("❌ Directions fetch error:", e);
    return c.json({ success: false, error: "Failed to fetch directions" }, 500);
  }
});

export default campus;
