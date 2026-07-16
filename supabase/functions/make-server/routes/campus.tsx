import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { enforceRateLimit, getRequestIdentity } from "../security/rate-limit.ts";

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
let memoryCache: { hash: string; path: [number, number][]; expiresAt: number } | null = null;

const routeInputHash = async (points: Array<{ lat: number; lng: number }>) => {
  const input = points.map((point) => [Number(point.lng).toFixed(7), Number(point.lat).toFixed(7)]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(input)));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const fallbackPath = (stops: Array<{ lat: number; lng: number }>) => {
  const path: [number, number][] = [];
  const allStops = [...stops, stops[0]];
  for (let index = 0; index < allStops.length - 1; index += 1) {
    const from = allStops[index];
    const to = allStops[index + 1];
    for (let step = 1; step <= 20; step += 1) {
      const ratio = step / 20;
      path.push([
        from.lng + (to.lng - from.lng) * ratio,
        from.lat + (to.lat - from.lat) * ratio,
      ]);
    }
  }
  return path;
};

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

  return { id: route.id, stops: visibleStops, routePoints };
};

campus.get("/path", async (c) => {
  const clientId  = Deno.env.get("NAVER_CLIENT_ID");
  const secretKey = Deno.env.get("NAVER_SECRET_KEY");

  const storedRoute = await getStoredCampusRoute();
  const visibleStops = storedRoute?.stops?.length ? storedRoute.stops : STOPS;
  const routePoints = storedRoute?.routePoints?.length ? storedRoute.routePoints : ROUTE_POINTS;
  const inputHash = await routeInputHash(routePoints);

  c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");

  if (storedRoute?.id) {
    const { data: cached } = await db
      .from("route_path_cache")
      .select("input_hash, path")
      .eq("route_id", storedRoute.id)
      .maybeSingle();
    if (cached?.input_hash === inputHash && Array.isArray(cached.path) && cached.path.length > 1) {
      return c.json({ success: true, data: { path: cached.path, stops: visibleStops, cached: true } });
    }
  }

  if (memoryCache?.hash === inputHash && memoryCache.expiresAt > Date.now()) {
    return c.json({ success: true, data: { path: memoryCache.path, stops: visibleStops, cached: true } });
  }

  const limited = await enforceRateLimit(c, "campus-path", getRequestIdentity(c), 30, 600);
  if (limited) return limited;

  const start     = `${routePoints[0].lng},${routePoints[0].lat}`;
  const goal      = `${routePoints[routePoints.length - 1].lng},${routePoints[routePoints.length - 1].lat}`;
  const waypoints = routePoints.slice(1, -1).slice(0, 5).map((point) => `${point.lng},${point.lat}`).join("|");
  const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=traoptimal`;

  let path: [number, number][] = [];
  if (clientId && secretKey) {
    try {
      const response = await fetch(url, {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY": secretKey,
        },
      });
      const data = await response.json();
      if (response.ok && data.code === 0) {
        path = data.route?.traoptimal?.[0]?.path ?? [];
      } else {
        console.warn("Directions5 API returned a non-success response", data.code);
      }
    } catch (error) {
      console.warn("Directions5 API request failed", error);
    }
  }

  if (path.length < 2) path = fallbackPath(visibleStops);

  memoryCache = { hash: inputHash, path, expiresAt: Date.now() + 30 * 60 * 1000 };
  if (storedRoute?.id) {
    const { error } = await db.from("route_path_cache").upsert({
      route_id: storedRoute.id,
      input_hash: inputHash,
      path,
      generated_at: new Date().toISOString(),
    });
    if (error) console.warn("Campus route cache write failed", error.message);
  }

  return c.json({ success: true, data: { path, stops: visibleStops, cached: false } });
});

export default campus;
