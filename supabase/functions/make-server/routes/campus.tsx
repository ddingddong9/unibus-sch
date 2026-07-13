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

// 정문 → 후문은 교내를 가로지르지 않고 온천대로와 순천향로를 이용한다.
const OUTER_RETURN_WAYPOINTS = [
  { lat: 36.769380, lng: 126.927631 },
  { lat: 36.771585, lng: 126.929795 },
  { lat: 36.774798, lng: 126.932610 },
  { lat: 36.773641, lng: 126.933540 },
  { lat: 36.772936, lng: 126.934107 },
];

const OUTER_RETURN_FALLBACK = [
  { lat: 36.769014, lng: 126.927978 },
  { lat: 36.769380, lng: 126.927631 },
  { lat: 36.769700, lng: 126.927521 },
  { lat: 36.770127, lng: 126.928039 },
  { lat: 36.770792, lng: 126.928952 },
  { lat: 36.771585, lng: 126.929795 },
  { lat: 36.773278, lng: 126.931320 },
  { lat: 36.774595, lng: 126.932422 },
  { lat: 36.774798, lng: 126.932610 },
  { lat: 36.774053, lng: 126.933208 },
  { lat: 36.773641, lng: 126.933540 },
  { lat: 36.773328, lng: 126.933792 },
  { lat: 36.773166, lng: 126.933923 },
  { lat: 36.772936, lng: 126.934107 },
  { lat: 36.772808, lng: 126.933885 },
  { lat: 36.772760, lng: 126.933816 },
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

  const mainGate = visibleStops.find((stop: any) => stop.id === "main-gate" || stop.name?.includes("정문")) || STOPS[4];
  const rearGate = visibleStops.find((stop: any) => stop.id === "rear-gate" || stop.name?.includes("후문")) || STOPS[0];
  const outerFallback = [
    { lat: mainGate.lat, lng: mainGate.lng },
    ...OUTER_RETURN_FALLBACK.slice(1, -1),
    { lat: rearGate.lat, lng: rearGate.lng },
  ];
  const fetchDirections = async (points: any[]) => {
    const start = `${points[0].lng},${points[0].lat}`;
    const goal = `${points[points.length - 1].lng},${points[points.length - 1].lat}`;
    const waypoints = points.slice(1, -1).slice(0, 5).map((point) => `${point.lng},${point.lat}`).join("|");
    const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=traoptimal`;
    const response = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": secretKey,
      },
    });
    return response.json();
  };

  let data: any;
  let outerData: any;
  try {
    [data, outerData] = await Promise.all([
      fetchDirections(routePoints),
      fetchDirections([mainGate, ...OUTER_RETURN_WAYPOINTS, rearGate]),
    ]);
  } catch (e: any) {
    console.error("fetch error:", e.message);
    return c.json({ success: false, error: "fetch failed: " + e.message }, 502);
  }
  console.log("Directions5 API response code:", data.code, data.message ?? data.error?.message, "outer:", outerData.code);

  if (data.code === 0) {
    const path: [number, number][] = data.route?.traoptimal?.[0]?.path ?? [];
    if (path.length > 0) {
      const naverOuterPath: [number, number][] = outerData.code === 0
        ? outerData.route?.traoptimal?.[0]?.path ?? []
        : [];
      const hasNaverOuterPath = naverOuterPath.length > 1;
      const outerPath = hasNaverOuterPath
        ? naverOuterPath
        : outerFallback.map((point) => [point.lng, point.lat] as [number, number]);
      return c.json({
        success: true,
        data: {
          path: [...path, ...outerPath.slice(path.length > 0 ? 1 : 0)],
          stops: visibleStops,
          source: hasNaverOuterPath ? "naver" : "naver-with-outer-fallback",
        },
      });
    }
  }

  // 본 노선 API 실패 시 정류장을 보간하되 정문 → 후문은 외곽 도로 좌표를 유지한다.
  const fallback: [number, number][] = [];
  for (let i = 0; i < visibleStops.length - 1; i++) {
    const from = visibleStops[i], to = visibleStops[i + 1];
    for (let s = 1; s <= 20; s++) {
      const t = s / 20;
      fallback.push([from.lng + (to.lng - from.lng) * t, from.lat + (to.lat - from.lat) * t]);
    }
  }
  fallback.push(...outerFallback.map((point) => [point.lng, point.lat] as [number, number]));
  console.warn("Directions5 fallback. code:", data.code, data.message ?? JSON.stringify(data.error));
  return c.json({ success: true, data: { path: fallback, stops: visibleStops, source: "fallback", debug: { code: data.code, message: data.message, error: data.error } } });
});

export default campus;
