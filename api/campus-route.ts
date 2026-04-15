import type { VercelRequest, VercelResponse } from "@vercel/node";

const STOPS = [
  { id: "rear-gate", name: "후문",   lat: 36.772760, lng: 126.933816 },
  { id: "hyang3",    name: "향3",    lat: 36.768228, lng: 126.935383 },
  { id: "hyang1",    name: "향1",    lat: 36.767905, lng: 126.932505 },
  { id: "library",   name: "도서관", lat: 36.768856, lng: 126.931303 },
  { id: "main-gate", name: "정문",   lat: 36.769014, lng: 126.927978 },
];

function getFallbackPath(): [number, number][] {
  const STEPS = 30;
  const path: [number, number][] = [];
  for (let i = 0; i < STOPS.length - 1; i++) {
    const from = STOPS[i];
    const to   = STOPS[i + 1];
    for (let s = 1; s <= STEPS; s++) {
      const t = s / STEPS;
      path.push([from.lng + (to.lng - from.lng) * t, from.lat + (to.lat - from.lat) * t]);
    }
  }
  return path;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clientId  = process.env.VITE_NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const secretKey = process.env.VITE_NAVER_SECRET_KEY || process.env.NAVER_SECRET_KEY;

  if (!clientId || !secretKey) {
    console.warn("Naver keys missing, using fallback");
    return res.json({ success: true, data: { path: getFallbackPath(), stops: STOPS, source: "fallback_no_key", debug: { clientIdSet: !!clientId, secretKeySet: !!secretKey } } });
  }

  try {
    const start     = `${STOPS[0].lng},${STOPS[0].lat}`;
    const goal      = `${STOPS[4].lng},${STOPS[4].lat}`;
    const waypoints = STOPS.slice(1, 4).map(s => `${s.lng},${s.lat}`).join("|");
    const url = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=traoptimal`;

    const apiRes = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY":    secretKey,
      },
    });

    const data = await apiRes.json();
    console.log("Naver Directions:", data.code, data.message);

    if (data.code === 0) {
      const path: [number, number][] = data.route?.traoptimal?.[0]?.path ?? [];
      if (path.length > 0) {
        return res.json({ success: true, data: { path, stops: STOPS, source: "directions5" } });
      }
    }

    console.warn("Directions5 failed, fallback. code:", data.code, data.message);
    return res.json({ success: true, data: { path: getFallbackPath(), stops: STOPS, source: "fallback_api_error", apiCode: data.code, apiMessage: data.message } });
  } catch (e: any) {
    console.error("Directions error:", e.message);
    return res.json({ success: true, data: { path: getFallbackPath(), stops: STOPS, source: "fallback_exception", error: e.message } });
  }
}
