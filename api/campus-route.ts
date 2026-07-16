type VercelRequest = {
  method?: string;
  url?: string;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  end(): void;
  json(body: unknown): void;
};

const STOPS = [
  { id: "rear-gate", name: "후문",   lat: 36.772760, lng: 126.933816 },
  { id: "hyang3",    name: "향3",    lat: 36.768228, lng: 126.935383 },
  { id: "hyang1",    name: "향1",    lat: 36.767905, lng: 126.932505 },
  { id: "library",   name: "도서관", lat: 36.768856, lng: 126.930700 },
  { id: "main-gate", name: "정문",   lat: 36.769014, lng: 126.927978 },
];

let memoryCache: { path: [number, number][]; expiresAt: number } | null = null;

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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  if (new URL(req.url || "/api/campus-route", "https://unibus.invalid").search) {
    return res.status(400).json({ success: false, error: "Query parameters are not supported" });
  }

  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("CDN-Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return res.json({ success: true, data: { path: memoryCache.path, stops: STOPS, source: "cache" } });
  }

  const clientId  = process.env.VITE_NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const secretKey = process.env.NAVER_SECRET_KEY;

  if (!clientId || !secretKey) {
    const path = getFallbackPath();
    memoryCache = { path, expiresAt: Date.now() + 30 * 60 * 1000 };
    return res.json({ success: true, data: { path, stops: STOPS, source: "fallback" } });
  }

  try {
    const start     = `${STOPS[0].lng},${STOPS[0].lat}`;
    const goal      = `${STOPS[4].lng},${STOPS[4].lat}`;
    const waypoints = STOPS.slice(1, 4).map(s => `${s.lng},${s.lat}`).join("|");
    const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=traoptimal`;

    const apiRes = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY":    secretKey,
      },
    });

    const data = await apiRes.json();

    if (apiRes.ok && data.code === 0) {
      const path: [number, number][] = data.route?.traoptimal?.[0]?.path ?? [];
      if (path.length > 0) {
        memoryCache = { path, expiresAt: Date.now() + 30 * 60 * 1000 };
        return res.json({ success: true, data: { path, stops: STOPS, source: "directions5" } });
      }
    }

    console.warn("Naver Directions returned a non-success response");
  } catch {
    console.warn("Naver Directions request failed");
  }

  const path = getFallbackPath();
  memoryCache = { path, expiresAt: Date.now() + 5 * 60 * 1000 };
  return res.json({ success: true, data: { path, stops: STOPS, source: "fallback" } });
}
