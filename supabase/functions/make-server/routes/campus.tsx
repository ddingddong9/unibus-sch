import { Hono } from "npm:hono";

const campus = new Hono();

const STOPS = [
  { id: "rear-gate", name: "후문",   lat: 36.772760, lng: 126.933816 },
  { id: "hyang3",    name: "향3",    lat: 36.768228, lng: 126.935383 },
  { id: "hyang1",    name: "향1",    lat: 36.767905, lng: 126.932505 },
  { id: "library",   name: "도서관", lat: 36.768856, lng: 126.931303 },
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
  const url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=traoptimal`;

  const res = await fetch(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY":    secretKey,
    },
  });

  const data = await res.json();
  console.log("Directions API response code:", data.code, data.message ?? data.error?.message);

  if (data.code === 0) {
    const path: [number, number][] = data.route?.traoptimal?.[0]?.path ?? [];
    if (path.length > 0) {
      return c.json({ success: true, data: { path, stops: STOPS } });
    }
  }

  return c.json({ success: false, error: `Directions API error: ${data.code} ${data.message ?? JSON.stringify(data.error)}` }, 502);
});

export default campus;
