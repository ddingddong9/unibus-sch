import { Hono } from "npm:hono";

const campus = new Hono();

const STOPS = [
  { id: "rear-gate", name: "후문",   lat: 36.772760, lng: 126.933816 },
  { id: "hyang3",    name: "향3",    lat: 36.768228, lng: 126.935383 },
  { id: "hyang1",    name: "향1",    lat: 36.767905, lng: 126.932505 },
  { id: "library",   name: "도서관", lat: 36.768856, lng: 126.930700 },
  { id: "main-gate", name: "정문",   lat: 36.769014, lng: 126.927978 },
];

campus.get("/path", async (c) => {
  const clientId  = Deno.env.get("NAVER_CLIENT_ID");
  const secretKey = Deno.env.get("NAVER_SECRET_KEY");

  if (!clientId || !secretKey) {
    return c.json({ success: false, error: "Naver API keys not configured" }, 500);
  }

  const start     = `${STOPS[0].lng},${STOPS[0].lat}`;
  const goal      = `${STOPS[4].lng},${STOPS[4].lat}`;
  const waypoints = STOPS.slice(1, 4).map(s => `${s.lng},${s.lat}`).join("|");
  const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=traoptimal`;

  let res: Response;
  let data: any;
  try {
    res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY":    secretKey,
      },
    });
    data = await res.json();
  } catch (e: any) {
    console.error("fetch error:", e.message);
    return c.json({ success: false, error: "fetch failed: " + e.message }, 502);
  }
  console.log("Directions5 API response code:", data.code, data.message ?? data.error?.message);

  if (data.code === 0) {
    const path: [number, number][] = data.route?.traoptimal?.[0]?.path ?? [];
    if (path.length > 0) {
      return c.json({ success: true, data: { path, stops: STOPS } });
    }
  }

  // fallback: 정류장 직선 연결 (API 실패 시)
  const fallback: [number, number][] = [];
  const allStops = [...STOPS, STOPS[0]]; // 순환: 마지막 → 후문
  for (let i = 0; i < allStops.length - 1; i++) {
    const from = allStops[i], to = allStops[i + 1];
    for (let s = 1; s <= 20; s++) {
      const t = s / 20;
      fallback.push([from.lng + (to.lng - from.lng) * t, from.lat + (to.lat - from.lat) * t]);
    }
  }
  console.warn("Directions5 fallback. code:", data.code, data.message ?? JSON.stringify(data.error));
  return c.json({ success: true, data: { path: fallback, stops: STOPS, source: "fallback", debug: { code: data.code, message: data.message, error: data.error } } });
});

export default campus;
