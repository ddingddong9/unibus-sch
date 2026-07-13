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
const ROUTE_SERVICE_COLUMNS = 'id, name, type, shuttle_variant, color, description, region, schedule, duration, fare, schedule_basis, interval_minutes, departure_offset_minutes, boarding_wait_minutes, continuation_route_id';

const parseSchedule = (schedule?: string | null) => (schedule || '')
  .split(/[,\n]/)
  .map((value) => value.trim())
  .filter((value) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(value))
  .map((value) => value.split(':').map(Number) as [number, number])
  .sort((a, b) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));

const getNextServiceTimes = (route: any, nowMs = Date.now()) => {
  if (!route) return { scheduledEventAt: null, plannedDepartureAt: null };
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const localNow = new Date(nowMs + kstOffsetMs);

  if (route.shuttle_variant === 'campus_loop') {
    const interval = Math.max(1, Number(route.interval_minutes) || 10);
    const currentMinutes = localNow.getUTCHours() * 60 + localNow.getUTCMinutes();
    const nextMinutes = Math.ceil(currentMinutes / interval) * interval;
    const departureMs = Date.UTC(
      localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 0, nextMinutes, 0, 0,
    ) - kstOffsetMs;
    const iso = new Date(departureMs < nowMs ? departureMs + interval * 60_000 : departureMs).toISOString();
    return { scheduledEventAt: iso, plannedDepartureAt: iso };
  }

  const numberOr = (value: unknown, fallback: number) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };
  const before = route.shuttle_variant === 'campus_to_station'
    ? Math.max(0, numberOr(route.departure_offset_minutes, 10)) : 0;
  const after = route.shuttle_variant === 'station_to_campus' || route.shuttle_variant === 'station_to_campus_loop'
    ? Math.max(0, numberOr(route.boarding_wait_minutes, 5)) : 0;

  for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
    for (const [hour, minute] of parseSchedule(route.schedule)) {
      const eventMs = Date.UTC(
        localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate() + dayOffset, hour, minute, 0, 0,
      ) - kstOffsetMs;
      const departureMs = eventMs + (after - before) * 60_000;
      if (departureMs >= nowMs) {
        return {
          scheduledEventAt: new Date(eventMs).toISOString(),
          plannedDepartureAt: new Date(departureMs).toISOString(),
        };
      }
    }
  }
  return { scheduledEventAt: null, plannedDepartureAt: null };
};

const initialServicePhase = (variant?: string | null) => {
  if (variant === 'campus_to_station') return 'to_station';
  if (variant === 'station_to_campus' || variant === 'station_to_campus_loop') return 'waiting_station';
  if (variant === 'campus_loop') return 'campus_loop';
  return 'in_service';
};

const formatRoute = (route: any, stops: any[] = []) => route ? {
  id: route.id,
  name: route.name,
  type: toClientRouteType(route.type),
  shuttleVariant: route.shuttle_variant,
  color: route.color,
  description: route.description,
  region: route.region,
  schedule: route.schedule,
  scheduleBasis: route.schedule_basis,
  intervalMinutes: route.interval_minutes,
  departureOffsetMinutes: route.departure_offset_minutes,
  boardingWaitMinutes: route.boarding_wait_minutes,
  continuationRouteId: route.continuation_route_id,
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
      ? db.from('routes').select(ROUTE_SERVICE_COLUMNS).in('id', routeIds)
      : Promise.resolve({ data: [], error: null }),
    routeIds.length > 0
      ? db.from('route_stops').select('*').in('route_id', routeIds).order('stop_order')
      : Promise.resolve({ data: [], error: null }),
    busIds.length > 0
      ? db.from('bus_trips').select('id, bus_id, route_id, origin_route_id, status, service_phase, current_stop_order, scheduled_event_at, planned_departure_at, one_loop_only, started_at, updated_at').in('bus_id', busIds).eq('status', 'active')
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
      originRouteId: tripMap.get(bus.id).origin_route_id,
      servicePhase: tripMap.get(bus.id).service_phase,
      scheduledEventAt: tripMap.get(bus.id).scheduled_event_at,
      plannedDepartureAt: tripMap.get(bus.id).planned_departure_at,
      oneLoopOnly: tripMap.get(bus.id).one_loop_only,
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

    const { data: previousTrips } = await db
      .from('bus_trips')
      .select('bus_id, origin_route_id')
      .eq('driver_id', driverId)
      .eq('status', 'active');
    const previousTripForBus = (previousTrips || []).find((previous: any) => previous.bus_id === busId);
    const assignedRouteId = previousTripForBus?.origin_route_id || bus.current_route_id;
    await Promise.all((previousTrips || [])
      .filter((previous: any) => previous.origin_route_id)
      .map((previous: any) => db.from('buses')
        .update({ current_route_id: previous.origin_route_id })
        .eq('id', previous.bus_id)));

    const { data: assignedRoute } = assignedRouteId
      ? await db.from('routes').select(ROUTE_SERVICE_COLUMNS).eq('id', assignedRouteId).maybeSingle()
      : { data: null };
    const serviceTimes = getNextServiceTimes(assignedRoute);
    const servicePhase = initialServicePhase(assignedRoute?.shuttle_variant);

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
      .update({ is_running: true, current_driver_id: driverId, current_route_id: assignedRouteId })
      .eq('id', busId);

    if (updateError) {
      return c.json({ success: false, error: "Failed to start driving" }, 500);
    }

    const { data: trip, error: tripError } = await db
      .from('bus_trips')
      .insert({
        bus_id: busId,
        route_id: assignedRouteId,
        origin_route_id: assignedRouteId,
        driver_id: driverId,
        status: 'active',
        current_stop_order: 0,
        service_phase: servicePhase,
        scheduled_event_at: serviceTimes.scheduledEventAt,
        planned_departure_at: serviceTimes.plannedDepartureAt,
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

    return c.json({ success: true, data: {
      busId,
      driverId,
      tripId: trip.id,
      servicePhase: trip.service_phase,
      scheduledEventAt: trip.scheduled_event_at,
      plannedDepartureAt: trip.planned_departure_at,
      oneLoopOnly: trip.one_loop_only,
    } });
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
      .select('id, bus_id, route_id, origin_route_id, service_phase, one_loop_only, current_stop_order, started_at')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .single();

    if (activeTripError || !activeTrip) {
      return c.json({ success: false, error: "운행 중인 회차가 없습니다" }, 404);
    }

    if (activeTrip.service_phase === 'waiting_station') {
      return c.json({ success: false, error: "학생 탑승 완료 후 신창역 출발을 먼저 처리해 주세요" }, 409);
    }

    const [{ data: route }, { data: routeStops }] = await Promise.all([
      activeTrip.route_id
        ? db.from('routes').select(ROUTE_SERVICE_COLUMNS).eq('id', activeTrip.route_id).maybeSingle()
        : Promise.resolve({ data: null }),
      activeTrip.route_id
        ? db.from('route_stops').select('*').eq('route_id', activeTrip.route_id).order('stop_order')
        : Promise.resolve({ data: [] }),
    ]);
    const stops = routeStops || [];
    const lastStopOrder = stops.at(-1)?.stop_order ?? 0;

    if (normalizedOrder > lastStopOrder && lastStopOrder > 0) {
      return c.json({ success: false, error: "노선 범위를 벗어난 정류장입니다" }, 400);
    }

    if (
      normalizedOrder === 0
      && activeTrip.one_loop_only
      && route?.shuttle_variant === 'campus_loop'
      && activeTrip.current_stop_order >= lastStopOrder
    ) {
      const { data: completedLoop, error: loopError } = await db
        .from('bus_trips')
        .update({ service_phase: 'return_to_parking' })
        .eq('id', activeTrip.id)
        .select('*')
        .single();
      if (loopError || !completedLoop) {
        return c.json({ success: false, error: "학내순환 완료 상태를 저장하지 못했습니다" }, 500);
      }
      return c.json({ success: true, data: {
        id: completedLoop.id,
        routeId: completedLoop.route_id,
        currentStopOrder: completedLoop.current_stop_order,
        servicePhase: completedLoop.service_phase,
        oneLoopOnly: completedLoop.one_loop_only,
        startedAt: completedLoop.started_at,
        updatedAt: completedLoop.updated_at,
      } });
    }

    const reachedRearGate = route?.shuttle_variant === 'station_to_campus_loop'
      && stops.some((stop: any) => stop.stop_order === normalizedOrder && /후문/.test(stop.stop_name || ''));

    if (reachedRearGate) {
      let continuationRouteId = route.continuation_route_id;
      if (!continuationRouteId) {
        const { data: fallbackRoute } = await db
          .from('routes')
          .select('id')
          .eq('shuttle_variant', 'campus_loop')
          .eq('is_active', true)
          .order('created_at')
          .limit(1)
          .maybeSingle();
        continuationRouteId = fallbackRoute?.id;
      }
      if (!continuationRouteId) {
        return c.json({ success: false, error: "연결할 학내순환 노선이 없습니다. 관리자 노선 설정을 확인해 주세요" }, 409);
      }

      const [{ data: continuationRoute }, { data: continuationStops }] = await Promise.all([
        db.from('routes').select(ROUTE_SERVICE_COLUMNS).eq('id', continuationRouteId).single(),
        db.from('route_stops').select('*').eq('route_id', continuationRouteId).order('stop_order'),
      ]);
      const rearGateOrder = continuationStops?.find((stop: any) => /후문/.test(stop.stop_name || ''))?.stop_order ?? 0;
      const { data: transitionedTrip, error: transitionError } = await db
        .from('bus_trips')
        .update({
          route_id: continuationRouteId,
          current_stop_order: rearGateOrder,
          service_phase: 'campus_loop',
          one_loop_only: true,
        })
        .eq('id', activeTrip.id)
        .select('*')
        .single();
      if (transitionError || !transitionedTrip || !continuationRoute) {
        return c.json({ success: false, error: "학내순환 연결에 실패했습니다" }, 500);
      }
      const { error: busTransitionError } = await db
        .from('buses')
        .update({ current_route_id: continuationRouteId })
        .eq('id', activeTrip.bus_id);
      if (busTransitionError) {
        await db.from('bus_trips').update({
          route_id: activeTrip.route_id,
          current_stop_order: activeTrip.current_stop_order,
          service_phase: activeTrip.service_phase,
          one_loop_only: activeTrip.one_loop_only,
        }).eq('id', activeTrip.id);
        return c.json({ success: false, error: "버스 노선 전환 상태를 저장하지 못했습니다" }, 500);
      }
      return c.json({ success: true, data: {
        id: transitionedTrip.id,
        routeId: transitionedTrip.route_id,
        currentStopOrder: transitionedTrip.current_stop_order,
        servicePhase: transitionedTrip.service_phase,
        oneLoopOnly: true,
        startedAt: transitionedTrip.started_at,
        updatedAt: transitionedTrip.updated_at,
        currentRoute: formatRoute(continuationRoute, continuationStops || []),
      } });
    }

    const terminalPhase = normalizedOrder === lastStopOrder && [
      'campus_to_station', 'station_to_campus',
    ].includes(route?.shuttle_variant) ? 'return_to_parking' : activeTrip.service_phase;
    const { data: trip, error } = await db
      .from('bus_trips')
      .update({ current_stop_order: normalizedOrder, service_phase: terminalPhase })
      .eq('id', activeTrip.id)
      .select('*')
      .single();

    if (error || !trip) {
      return c.json({ success: false, error: "운행 중인 회차가 없습니다" }, 404);
    }

    return c.json({ success: true, data: {
      id: trip.id,
      routeId: trip.route_id,
      currentStopOrder: trip.current_stop_order,
      servicePhase: trip.service_phase,
      oneLoopOnly: trip.one_loop_only,
      startedAt: trip.started_at,
      updatedAt: trip.updated_at,
    } });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to update trip progress" }, 500);
  }
});

// 신창역에서 열차 도착과 학생 탑승을 확인한 뒤 실제 후문행 운행을 시작한다.
driver.put("/phase", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');
    const { data: activeTrip } = await db
      .from('bus_trips')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .single();
    if (!activeTrip) return c.json({ success: false, error: "운행 중인 회차가 없습니다" }, 404);
    if (activeTrip.service_phase !== 'waiting_station') {
      return c.json({ success: false, error: "현재 단계에서는 신창역 출발 처리가 필요하지 않습니다" }, 409);
    }

    const { data: trip, error } = await db
      .from('bus_trips')
      .update({ service_phase: 'to_campus' })
      .eq('id', activeTrip.id)
      .select('*')
      .single();
    if (error || !trip) return c.json({ success: false, error: "운행 단계를 저장하지 못했습니다" }, 500);
    return c.json({ success: true, data: {
      id: trip.id,
      routeId: trip.route_id,
      currentStopOrder: trip.current_stop_order,
      servicePhase: trip.service_phase,
      oneLoopOnly: trip.one_loop_only,
      scheduledEventAt: trip.scheduled_event_at,
      plannedDepartureAt: trip.planned_departure_at,
      startedAt: trip.started_at,
      updatedAt: trip.updated_at,
    } });
  } catch (_error) {
    return c.json({ success: false, error: "Failed to update service phase" }, 500);
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

    const { data: activeTrip } = await db
      .from('bus_trips')
      .select('id')
      .eq('bus_id', bus.id)
      .eq('status', 'active')
      .maybeSingle();

    // 최신 위치는 upsert하고, 이력은 DB 함수에서 30초 간격으로만 표본 저장한다.
    const { error: insertError } = await db.rpc('record_bus_location', {
      p_bus_id: bus.id,
      p_trip_id: activeTrip?.id ?? null,
      p_latitude: latitude,
      p_longitude: longitude,
      p_speed: normalizedSpeed,
      p_heading: normalizedHeading,
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

    const { data: activeTrip } = await db
      .from('bus_trips')
      .select('id, origin_route_id')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .maybeSingle();

    const { error: updateError } = await db
      .from('buses')
      .update({
        is_running: false,
        current_driver_id: null,
        ...(activeTrip?.origin_route_id ? { current_route_id: activeTrip.origin_route_id } : {}),
      })
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
