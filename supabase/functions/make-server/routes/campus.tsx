import { Hono } from "npm:hono";
import { db } from "../db.tsx";

const campus = new Hono();

const STOPS = [
  { id: "rear-gate", name: "후문",   lat: 36.772760, lng: 126.933816 },
  { id: "hyang3",    name: "향3",    lat: 36.768228, lng: 126.935383 },
  { id: "hyang1",    name: "향1",    lat: 36.767905, lng: 126.932505 },
  { id: "library",   name: "도서관", lat: 36.768856, lng: 126.931303 },
  { id: "main-gate", name: "정문",   lat: 36.769014, lng: 126.927978 },
];

const ROUTE_POINTS = [
  STOPS[0],
  STOPS[1],
  STOPS[2],
  STOPS[3],
  // Directions API shaping point: keep the displayed stop list unchanged,
  // but guide the 도서관 → 정문 segment through the campus access road.
  { id: "library-main-gate-shape", name: "정문 진입로", lat: 36.768960, lng: 126.929760 },
  STOPS[4],
];

const CAMPUS_ROUTE_ID = "00000000-0000-0000-0000-000000000001";

const getStoredCampusRoute = async () => {
  const { data: routeById } = await db
    .from("routes")
    .select("id")
    .eq("id", CAMPUS_ROUTE_ID)
    .maybeSingle();

  const { data: routeByName } = routeById ? { data: null } : await db
    .from("routes")
    .select("id")
    .eq("type", "shuttle")
    .ilike("name", "%학내순환%")
    .limit(1)
    .maybeSingle();

  const route = routeById || routeByName;
  if (!route) return null;

  const { data: stops } = await db
    .from("route_stops")
    .select("*")
    .eq("route_id", route.id)
    .order("stop_order");

  if (!stops || stops.length < 2) return null;

  const { data: shapePoints } = await db
    .from("route_shape_points")
    .select("*")
    .eq("route_id", route.id)
    .order("after_stop_order")
    .order("point_order");

  const visibleStops = stops
    .filter((stop: any) => stop.latitude != null && stop.longitude != null)
    .map((stop: any) => ({
      id: stop.id,
      name: stop.stop_name,
      lat: stop.latitude,
      lng: stop.longitude,
      order: stop.stop_order,
    }));

  const shapesByStop = new Map<number, any[]>();
  for (const point of shapePoints || []) {
    const current = shapesByStop.get(point.after_stop_order) || [];
    current.push(point);
    shapesByStop.set(point.after_stop_order, current);
  }

  const routePoints: any[] = [];
  for (const stop of visibleStops) {
    routePoints.push(stop);
    for (const point of shapesByStop.get(stop.order) || []) {
      routePoints.push({
        id: point.id,
        name: point.name || "경로 보정점",
        lat: point.latitude,
        lng: point.longitude,
      });
    }
  }

  return { stops: visibleStops, routePoints };
};

campus.get("/path", async (c) => {
  const clientId  = Deno.env.get("NAVER_CLIENT_ID");
  const secretKey = Deno.env.get("NAVER_SECRET_KEY");

  if (!clientId || !secretKey) {
    return c.json({ success: false, error: "Naver API keys not configured" }, 500);
  }

  const storedRoute = await getStoredCampusRoute();
  const visibleStops = storedRoute?.stops?.length ? storedRoute.stops : STOPS;
  const routePoints = storedRoute?.routePoints?.length ? storedRoute.routePoints : ROUTE_POINTS;

  const start     = `${routePoints[0].lng},${routePoints[0].lat}`;
  const goal      = `${routePoints[routePoints.length - 1].lng},${routePoints[routePoints.length - 1].lat}`;
  const waypoints = routePoints.slice(1, -1).slice(0, 5).map(s => `${s.lng},${s.lat}`).join("|");
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
      return c.json({ success: true, data: { path, stops: visibleStops } });
    }
  }

  // fallback: 정류장 직선 연결 (API 실패 시)
  const fallback: [number, number][] = [];
  const allStops = [...visibleStops, visibleStops[0]]; // 순환: 마지막 → 첫 정류장
  for (let i = 0; i < allStops.length - 1; i++) {
    const from = allStops[i], to = allStops[i + 1];
    for (let s = 1; s <= 20; s++) {
      const t = s / 20;
      fallback.push([from.lng + (to.lng - from.lng) * t, from.lat + (to.lat - from.lat) * t]);
    }
  }
  console.warn("Directions5 fallback. code:", data.code, data.message ?? JSON.stringify(data.error));
  return c.json({ success: true, data: { path: fallback, stops: visibleStops, source: "fallback", debug: { code: data.code, message: data.message, error: data.error } } });
});

export default campus;
