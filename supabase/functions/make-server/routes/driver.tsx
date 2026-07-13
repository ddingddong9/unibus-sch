// Driver Routes - 버스 기사 전용 API

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireDriver } from "../middleware/auth.tsx";

const driver = new Hono<{
  Variables: {
    userId: string;
    userRole: string;
  };
}>();

const toClientBusType = (type: string) => type === 'shuttle' ? 'campus' : type === 'commute' ? 'commuter' : type;
const toClientRouteType = toClientBusType;

const formatRoute = (route: any, stops: any[] = []) => route ? {
  id: route.id,
  name: route.name,
  type: toClientRouteType(route.type),
  shuttleVariant: route.shuttle_variant,
  color: route.color,
  description: route.description,
  region: route.region,
  schedule: route.schedule,
  duration: route.duration,
  fare: route.fare,
  stops: stops.map((stop) => ({
    id: stop.id,
    name: stop.stop_name,
    order: stop.stop_order,
    lat: stop.latitude,
    lng: stop.longitude,
    arrivalTime: stop.arrival_time,
  })),
} : null;

const attachCurrentRoutes = async (buses: any[] = [], driverId: string) => {
  const routeIds = [...new Set(buses.map((bus) => bus.current_route_id).filter(Boolean))];
  const routeMap = new Map<string, any>();
  const stopsMap = new Map<string, any[]>();
  const tripMap = new Map<string, any>();
  const busIds = buses.map((bus) => bus.id);

  const [routeResult, stopResult, tripResult] = await Promise.all([
    routeIds.length > 0
      ? db.from('routes').select('id, name, type, shuttle_variant, color, description, region, schedule, duration, fare').in('id', routeIds)
      : Promise.resolve({ data: [], error: null }),
    routeIds.length > 0
      ? db.from('route_stops').select('*').in('route_id', routeIds).order('stop_order')
      : Promise.resolve({ data: [], error: null }),
    busIds.length > 0
      ? db.from('bus_trips').select('id, bus_id, route_id, status, current_stop_order, started_at, updated_at').in('bus_id', busIds).eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (!routeResult.error) {
    (routeResult.data || []).forEach((route: any) => routeMap.set(route.id, route));
  }

  if (!stopResult.error) {
    (stopResult.data || []).forEach((stop: any) => {
      const routeStops = stopsMap.get(stop.route_id) || [];
      routeStops.push(stop);
      stopsMap.set(stop.route_id, routeStops);
    });
  }

  if (!tripResult.error) {
    (tripResult.data || []).forEach((trip: any) => tripMap.set(trip.bus_id, trip));
  }

  return buses.map((bus) => ({
    id: bus.id,
    name: bus.name,
    type: toClientBusType(bus.type),
    capacity: bus.capacity,
    status: bus.status,
    is_running: bus.is_running,
    current_driver_id: bus.current_driver_id,
    assigned_driver_id: bus.assigned_driver_id,
    is_assigned_to_me: bus.assigned_driver_id === driverId,
    is_shared: !bus.assigned_driver_id,
    currentRoute: formatRoute(routeMap.get(bus.current_route_id), stopsMap.get(bus.current_route_id) || []),
    activeTrip: tripMap.has(bus.id) ? {
      id: tripMap.get(bus.id).id,
      routeId: tripMap.get(bus.id).route_id,
      status: tripMap.get(bus.id).status,
      currentStopOrder: tripMap.get(bus.id).current_stop_order,
      startedAt: tripMap.get(bus.id).started_at,
      updatedAt: tripMap.get(bus.id).updated_at,
    } : null,
  }));
};

// 운행 가능한 버스 목록 조회
driver.get("/buses", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');
    const { data: buses, error } = await db
      .from('buses')
      .select('id, name, type, capacity, status, is_running, current_driver_id, assigned_driver_id, current_route_id')
      .eq('status', 'active')
      .or(`assigned_driver_id.is.null,assigned_driver_id.eq.${driverId}`)
      .order('id');

    if (error) {
      return c.json({ success: false, error: "Failed to fetch buses" }, 500);
    }

    const formattedBuses = await attachCurrentRoutes(buses || [], driverId);

    return c.json({ success: true, data: formattedBuses });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to fetch buses" }, 500);
  }
});

// 운행 시작 - 버스 선택 후 GPS 전송 시작
driver.post("/start", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');
    const { busId } = await c.req.json();

    if (!busId) {
      return c.json({ success: false, error: "busId is required" }, 400);
    }

    // 버스 존재 여부 + 이미 운행 중인지 확인
    const { data: bus, error: busError } = await db
      .from('buses')
      .select('id, name, status, is_running, current_driver_id, assigned_driver_id, current_route_id')
      .eq('id', busId)
      .single();

    if (busError || !bus) {
      return c.json({ success: false, error: "Bus not found" }, 404);
    }

    if (bus.status !== 'active') {
      return c.json({ success: false, error: "운행 가능한 상태의 버스가 아닙니다" }, 409);
    }

    if (bus.assigned_driver_id && bus.assigned_driver_id !== driverId) {
      return c.json({ success: false, error: "본인에게 배정된 버스만 운행할 수 있습니다" }, 403);
    }

    if (bus.is_running && bus.current_driver_id !== driverId) {
      return c.json({ success: false, error: "이미 다른 기사가 운행 중인 버스입니다" }, 409);
    }

    const now = new Date().toISOString();

    // 기사가 이미 다른 버스 운행 중이면 먼저 종료
    await db
      .from('bus_trips')
      .update({ status: 'completed', ended_at: now })
      .eq('driver_id', driverId)
      .eq('status', 'active');
    await db
      .from('bus_trips')
      .update({ status: 'completed', ended_at: now })
      .eq('bus_id', busId)
      .eq('status', 'active');
    await db
      .from('buses')
      .update({ is_running: false, current_driver_id: null })
      .eq('current_driver_id', driverId);

    // 운행 시작
    const { error: updateError } = await db
      .from('buses')
      .update({ is_running: true, current_driver_id: driverId })
      .eq('id', busId);

    if (updateError) {
      return c.json({ success: false, error: "Failed to start driving" }, 500);
    }

    const { data: trip, error: tripError } = await db
      .from('bus_trips')
      .insert({
        bus_id: busId,
        route_id: bus.current_route_id,
        driver_id: driverId,
        status: 'active',
        current_stop_order: 0,
      })
      .select()
      .single();

    if (tripError || !trip) {
      await db
        .from('buses')
        .update({ is_running: false, current_driver_id: null })
        .eq('id', busId);
      return c.json({ success: false, error: "Failed to create driving trip" }, 500);
    }

    console.log(`✅ Driver ${driverId} started bus ${busId}`);

    return c.json({ success: true, data: { busId, driverId, tripId: trip.id } });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to start driving" }, 500);
  }
});

// 현재 통과한 정류장을 기록해 기사 재접속과 사용자 안내에 반영
driver.put("/progress", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');
    const { stopOrder } = await c.req.json();
    const normalizedOrder = Number(stopOrder);
    if (!Number.isInteger(normalizedOrder) || normalizedOrder < 0) {
      return c.json({ success: false, error: "올바른 정류장 순서가 필요합니다" }, 400);
    }

    const { data: activeTrip, error: activeTripError } = await db
      .from('bus_trips')
      .select('id, route_id')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .single();

    if (activeTripError || !activeTrip) {
      return c.json({ success: false, error: "운행 중인 회차가 없습니다" }, 404);
    }

    if (activeTrip.route_id && normalizedOrder > 0) {
      const { data: lastStop } = await db
        .from('route_stops')
        .select('stop_order')
        .eq('route_id', activeTrip.route_id)
        .order('stop_order', { ascending: false })
        .limit(1)
        .single();
      if (!lastStop || normalizedOrder > lastStop.stop_order) {
        return c.json({ success: false, error: "노선 범위를 벗어난 정류장입니다" }, 400);
      }
    }

    const { data: trip, error } = await db
      .from('bus_trips')
      .update({ current_stop_order: normalizedOrder })
      .eq('id', activeTrip.id)
      .select('id, route_id, current_stop_order, started_at, updated_at')
      .single();

    if (error || !trip) {
      return c.json({ success: false, error: "운행 중인 회차가 없습니다" }, 404);
    }

    return c.json({ success: true, data: {
      id: trip.id,
      routeId: trip.route_id,
      currentStopOrder: trip.current_stop_order,
      startedAt: trip.started_at,
      updatedAt: trip.updated_at,
    } });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to update trip progress" }, 500);
  }
});

// GPS 위치 전송 (5초마다 프론트에서 호출)
driver.post("/location", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');
    const { lat, lng, speed, heading } = await c.req.json();
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
    ) {
      return c.json({ success: false, error: "올바른 GPS 좌표가 필요합니다" }, 400);
    }
    const normalizedSpeed = Math.max(0, Math.min(55, Number(speed) || 0));
    const normalizedHeading = ((Number(heading) || 0) % 360 + 360) % 360;

    // 이 기사가 운행 중인 버스 조회
    const { data: bus, error: busError } = await db
      .from('buses')
      .select('id')
      .eq('current_driver_id', driverId)
      .eq('is_running', true)
      .single();

    if (busError || !bus) {
      return c.json({ success: false, error: "운행 중인 버스가 없습니다" }, 404);
    }

    // 위치 저장
    const { error: insertError } = await db
      .from('bus_locations')
      .insert({
        bus_id: bus.id,
        latitude,
        longitude,
        speed: normalizedSpeed,
        heading: normalizedHeading,
      });

    if (insertError) {
      return c.json({ success: false, error: "Failed to save location" }, 500);
    }

    return c.json({ success: true, data: { busId: bus.id, lat: latitude, lng: longitude } });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to update location" }, 500);
  }
});

// 운행 종료
driver.post("/stop", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');

    const { data: bus, error: busError } = await db
      .from('buses')
      .select('id, name')
      .eq('current_driver_id', driverId)
      .eq('is_running', true)
      .single();

    if (busError || !bus) {
      return c.json({ success: false, error: "운행 중인 버스가 없습니다" }, 404);
    }

    const { error: updateError } = await db
      .from('buses')
      .update({ is_running: false, current_driver_id: null })
      .eq('id', bus.id);

    if (updateError) {
      return c.json({ success: false, error: "Failed to stop driving" }, 500);
    }

    await db
      .from('bus_trips')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('driver_id', driverId)
      .eq('status', 'active');

    console.log(`✅ Driver ${driverId} stopped bus ${bus.id}`);

    return c.json({ success: true, data: { busId: bus.id } });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to stop driving" }, 500);
  }
});

// 현재 운행 상태 조회 (앱 재진입 시 복원용)
driver.get("/status", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');

    const { data: bus } = await db
      .from('buses')
      .select('id, name, type, capacity, status, is_running, current_driver_id, assigned_driver_id, current_route_id')
      .eq('current_driver_id', driverId)
      .eq('is_running', true)
      .single();

    const activeBus = bus ? (await attachCurrentRoutes([bus], driverId))[0] : null;

    return c.json({ success: true, data: { activeBus } });
  } catch (error: any) {
    return c.json({ success: true, data: { activeBus: null } });
  }
});

export default driver;
