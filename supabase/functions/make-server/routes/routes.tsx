// Route Management (관계형 DB 버전)

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAdmin } from "../middleware/auth.tsx";

const routes = new Hono();

const toClientRouteType = (type: string) => type === 'shuttle' ? 'campus' : type === 'commute' ? 'commuter' : type;
const toDbRouteType = (type: string) => type === 'campus' ? 'shuttle' : type === 'commuter' ? 'commute' : type;
const SHUTTLE_VARIANTS = new Set([
  'campus_loop',
  'campus_to_station',
  'station_to_campus',
  'station_to_campus_loop',
]);

const normalizeShuttleVariant = (type: string, variant?: string | null) => {
  if (toDbRouteType(type) !== 'shuttle') return null;
  if (variant && SHUTTLE_VARIANTS.has(variant)) return variant;
  return 'campus_loop';
};

const normalizeServiceRules = (type: string, variant?: string | null, input: any = {}) => {
  const boundedNumber = (value: unknown, fallback: number, min: number, max: number) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  };
  if (toDbRouteType(type) !== 'shuttle') {
    return {
      schedule_basis: input.scheduleBasis ?? null,
      interval_minutes: input.intervalMinutes ?? null,
      departure_offset_minutes: input.departureOffsetMinutes ?? 0,
      boarding_wait_minutes: input.boardingWaitMinutes ?? 0,
      continuation_route_id: input.continuationRouteId ?? null,
    };
  }

  const normalizedVariant = normalizeShuttleVariant(type, variant);
  return {
    schedule_basis: normalizedVariant === 'campus_to_station'
      ? 'train_departure'
      : normalizedVariant === 'campus_loop' ? 'bus_departure' : 'train_arrival',
    interval_minutes: normalizedVariant === 'campus_loop'
      ? boundedNumber(input.intervalMinutes, 10, 1, 180) : null,
    departure_offset_minutes: normalizedVariant === 'campus_to_station'
      ? boundedNumber(input.departureOffsetMinutes, 10, 0, 120) : 0,
    boarding_wait_minutes: normalizedVariant === 'station_to_campus' || normalizedVariant === 'station_to_campus_loop'
      ? boundedNumber(input.boardingWaitMinutes, 5, 0, 120) : 0,
    continuation_route_id: normalizedVariant === 'station_to_campus_loop'
      ? input.continuationRouteId ?? null : null,
  };
};

const validateServiceRules = (type: string, variant: string | null | undefined, input: any, requireSchedule = false) => {
  const errors: string[] = [];
  if (toDbRouteType(type) !== 'shuttle') return errors;
  const normalizedVariant = normalizeShuttleVariant(type, variant);
  const scheduleTokens = String(input.schedule || '').split(/[,\n]/).map((value) => value.trim()).filter(Boolean);
  if (input.schedule !== undefined && scheduleTokens.some((value) => !/^([01]?\d|2[0-3]):[0-5]\d$/.test(value))) {
    errors.push('시간표는 08:20과 같은 24시간 형식으로 입력해 주세요.');
  }
  if (requireSchedule && normalizedVariant !== 'campus_loop' && scheduleTokens.length === 0) {
    errors.push('신창역 셔틀은 기준이 되는 지하철 도착 또는 출발 시각이 필요합니다.');
  }
  const checkNumber = (value: unknown, min: number, max: number, label: string) => {
    if (value === undefined || value === null) return;
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) errors.push(`${label}은 ${min}~${max}분으로 입력해 주세요.`);
  };
  checkNumber(input.intervalMinutes, 1, 180, '출발 간격');
  checkNumber(input.departureOffsetMinutes, 0, 120, '선출발 시간');
  checkNumber(input.boardingWaitMinutes, 0, 120, '탑승 대기 시간');
  return errors;
};

const formatServiceRules = (route: any) => ({
  scheduleBasis: route.schedule_basis,
  intervalMinutes: route.interval_minutes,
  departureOffsetMinutes: route.departure_offset_minutes,
  boardingWaitMinutes: route.boarding_wait_minutes,
  continuationRouteId: route.continuation_route_id,
});

const validateRouteDetailsInput = (
  type: string,
  shuttleVariant?: string | null,
  stops?: any[],
  shapePoints?: any[],
) => {
  const errors: string[] = [];

  if (stops !== undefined) {
    if (!Array.isArray(stops)) {
      errors.push("정류장 데이터 형식이 올바르지 않습니다.");
    } else {
      const names = stops.map((stop) => String(stop?.name || '').trim()).filter(Boolean);
      const normalized = names.map((name) => name.replace(/\s+/g, '').toLowerCase());
      const allowClosedLoop = toDbRouteType(type) === 'shuttle' && shuttleVariant === 'campus_loop';
      const duplicate = names.find((_, index) => {
        const firstIndex = normalized.indexOf(normalized[index]);
        if (firstIndex === index) return false;
        return !(
          allowClosedLoop &&
          firstIndex === 0 &&
          index === normalized.length - 1
        );
      });
      if (names.length < 2) errors.push("정류장은 최소 2개 이상 필요합니다.");
      if (duplicate) errors.push(`중복된 정류장이 있습니다: ${duplicate}`);
      if (
        toDbRouteType(type) === 'shuttle' &&
        shuttleVariant &&
        shuttleVariant !== 'campus_loop' &&
        !names.some((name) => /신창|순천향대역|순천향대학교역/.test(name))
      ) {
        errors.push("신창역 셔틀은 정류장에 신창역 또는 순천향대역이 포함되어야 합니다.");
      }
    }
  }

  if (shapePoints !== undefined) {
    if (!Array.isArray(shapePoints)) {
      errors.push("경로 보정점 데이터 형식이 올바르지 않습니다.");
    } else if (shapePoints.some((point) =>
      point.lat == null ||
      point.lng == null ||
      !Number.isFinite(Number(point.lat)) ||
      !Number.isFinite(Number(point.lng))
    )) {
      errors.push("좌표가 잘못된 경로 보정점이 있습니다.");
    }
  }

  return errors;
};

const formatShapePoint = (point: any) => ({
  id: point.id,
  name: point.name,
  afterStopOrder: point.after_stop_order,
  order: point.point_order,
  lat: point.latitude,
  lng: point.longitude,
});

const getShapePoints = async (routeId: string) => {
  const { data } = await db
    .from('route_shape_points')
    .select('*')
    .eq('route_id', routeId)
    .order('after_stop_order')
    .order('point_order');

  return data || [];
};

const replaceRouteDetails = async (
  routeId: string,
  options: {
    replaceStops?: boolean;
    stops?: any[];
    replaceShapePoints?: boolean;
    shapePoints?: any[];
  },
) => db.rpc('replace_route_details', {
  p_route_id: routeId,
  p_replace_stops: Boolean(options.replaceStops),
  p_stops: options.stops ?? [],
  p_replace_shape_points: Boolean(options.replaceShapePoints),
  p_shape_points: options.shapePoints ?? [],
});

const buildDirectionsPoints = (stops: any[], shapePoints: any[]) => {
  const points: Array<{ id: string; name: string; order: number; lat: number; lng: number; hidden?: boolean }> = [];
  const shapesByStop = new Map<number, any[]>();

  for (const point of shapePoints) {
    const key = point.after_stop_order;
    const current = shapesByStop.get(key) || [];
    current.push(point);
    shapesByStop.set(key, current);
  }

  for (const stop of stops) {
    if (stop.lat == null || stop.lng == null) continue;
    points.push({ id: stop.id, name: stop.name, order: stop.order, lat: stop.lat, lng: stop.lng });
    const shapes = shapesByStop.get(stop.order) || [];
    for (const shape of shapes) {
      points.push({
        id: shape.id,
        name: shape.name || '경로 보정점',
        order: stop.order,
        lat: shape.latitude,
        lng: shape.longitude,
        hidden: true,
      });
    }
  }

  return points;
};

const routeInputHash = async (points: Array<{ lat: number; lng: number }>) => {
  const input = points.map((point) => [Number(point.lng).toFixed(7), Number(point.lat).toFixed(7)]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(input)));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const buildNaverPath = async (
  routePoints: Array<{ lat: number; lng: number }>,
  clientId?: string | null,
  secretKey?: string | null,
) => {
  if (routePoints.length < 2) {
    return routePoints.map((point) => [point.lng, point.lat] as [number, number]);
  }

  if (!clientId || !secretKey) {
    return routePoints.map((point) => [point.lng, point.lat] as [number, number]);
  }

  const start = `${routePoints[0].lng},${routePoints[0].lat}`;
  const goal = `${routePoints[routePoints.length - 1].lng},${routePoints[routePoints.length - 1].lat}`;
  const waypoints = routePoints.slice(1, -1).slice(0, 5).map((point) => `${point.lng},${point.lat}`).join("|");
  const dirUrl = `https://maps.apigw.ntruss.com/map-direction/v1/driving`
    + `?start=${start}&goal=${goal}`
    + (waypoints ? `&waypoints=${waypoints}` : "")
    + `&option=traoptimal`;

  try {
    const res = await fetch(dirUrl, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": secretKey,
      },
    });
    const data = await res.json();
    if (data.code === 0) {
      return data.route?.traoptimal?.[0]?.path ?? [];
    }
  } catch (error) {
    console.warn("Directions preview failed:", error);
  }

  return routePoints.map((point) => [point.lng, point.lat] as [number, number]);
};

// Get all routes with stops
routes.get("/", async (c) => {
  try {
    // 모든 노선 조회
    const { data: allRoutes, error: routesError } = await db
      .from('routes')
      .select('*')
      .order('type')
      .order('name');

    if (routesError) {
      console.error("❌ Get routes error:", routesError);
      return c.json({ success: false, error: "Failed to fetch routes" }, 500);
    }

    // 각 노선의 정류장 조회
    const routesWithStops = await Promise.all(
      (allRoutes || []).map(async (route) => {
        const { data: stops } = await db
          .from('route_stops')
          .select('*')
          .eq('route_id', route.id)
          .order('stop_order');

        const shapePoints = await getShapePoints(route.id);

        return {
          id: route.id,
          name: route.name,
          type: toClientRouteType(route.type),
          description: route.description,
          shuttleVariant: route.shuttle_variant,
          color: route.color,
          region: route.region,
          schedule: route.schedule,
          ...formatServiceRules(route),
          duration: route.duration,
          fare: route.fare,
          isActive: route.is_active,
          stops: stops?.map(stop => ({
            id: stop.id,
            name: stop.stop_name,
            order: stop.stop_order,
            lat: stop.latitude,
            lng: stop.longitude,
            arrivalTime: stop.arrival_time,
          })) || [],
          shapePoints: shapePoints.map(formatShapePoint),
          createdAt: route.created_at,
          updatedAt: route.updated_at,
        };
      })
    );

    console.log(`✅ Fetched ${routesWithStops.length} routes`);

    return c.json({ success: true, data: routesWithStops });
  } catch (error: any) {
    console.error("❌ Get routes error:", error);
    return c.json({ success: false, error: "Failed to fetch routes" }, 500);
  }
});

// Get route map path — geocode stops without coordinates, return markers + polyline
routes.get("/:id/path", async (c) => {
  try {
    const id = c.req.param("id");
    const clientId  = Deno.env.get("NAVER_CLIENT_ID");
    const secretKey = Deno.env.get("NAVER_SECRET_KEY");

    const { data: stops, error } = await db
      .from("route_stops")
      .select("*")
      .eq("route_id", id)
      .order("stop_order");

    if (error || !stops || stops.length === 0) {
      return c.json({ success: false, error: "No stops found" }, 404);
    }

    // 좌표 없는 정류장은 Naver Geocoding API로 변환
    const resolved = await Promise.all(
      stops.map(async (stop: any) => {
        let lat: number | null = stop.latitude ?? null;
        let lng: number | null = stop.longitude ?? null;

        if ((lat == null || lng == null) && clientId && secretKey) {
          try {
            const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(stop.stop_name)}`;
            const res = await fetch(url, {
              headers: {
                "X-NCP-APIGW-API-KEY-ID": clientId,
                "X-NCP-APIGW-API-KEY":    secretKey,
              },
            });
            const data = await res.json();
            const addr = data.addresses?.[0];
            if (addr) {
              lng = parseFloat(addr.x);
              lat = parseFloat(addr.y);
            }
          } catch (e) {
            console.warn(`Geocoding failed for "${stop.stop_name}":`, e);
          }
        }

        return { id: stop.id, name: stop.stop_name, order: stop.stop_order, lat, lng };
      })
    );

    const validStops = resolved.filter((s) => s.lat != null && s.lng != null);
    const shapePoints = await getShapePoints(id);

    if (validStops.length === 0) {
      return c.json({ success: true, data: { stops: resolved, shapePoints: shapePoints.map(formatShapePoint), path: [] } });
    }

    const routePoints = buildDirectionsPoints(validStops, shapePoints);
    const inputHash = await routeInputHash(routePoints);
    const { data: cachedPath } = await db
      .from('route_path_cache')
      .select('input_hash, path')
      .eq('route_id', id)
      .maybeSingle();

    if (cachedPath?.input_hash === inputHash && Array.isArray(cachedPath.path) && cachedPath.path.length > 1) {
      return c.json({
        success: true,
        data: { stops: resolved, shapePoints: shapePoints.map(formatShapePoint), path: cachedPath.path, cached: true },
      });
    }

    const path = await buildNaverPath(routePoints, clientId, secretKey);

    if (path.length > 1) {
      const { error: cacheError } = await db.from('route_path_cache').upsert({
        route_id: id,
        input_hash: inputHash,
        path,
        generated_at: new Date().toISOString(),
      });
      if (cacheError) console.warn('Route path cache write failed:', cacheError.message);
    }

    return c.json({ success: true, data: { stops: resolved, shapePoints: shapePoints.map(formatShapePoint), path, cached: false } });
  } catch (err: any) {
    console.error("❌ Route path error:", err);
    return c.json({ success: false, error: "Failed to build route path" }, 500);
  }
});

routes.post("/:id/path/preview", requireAdmin, async (c) => {
  try {
    const clientId = Deno.env.get("NAVER_CLIENT_ID");
    const secretKey = Deno.env.get("NAVER_SECRET_KEY");
    const { stops = [], shapePoints = [] } = await c.req.json();
    const routePoints = buildDirectionsPoints(
      stops.map((stop: any, index: number) => ({
        id: stop.id || `stop-${index}`,
        name: stop.name || `정류장 ${index + 1}`,
        order: stop.order || index + 1,
        lat: stop.lat,
        lng: stop.lng,
      })),
      shapePoints.map((point: any, index: number) => ({
        id: point.id || `shape-${index}`,
        name: point.name || '경로 보정점',
        after_stop_order: point.afterStopOrder || point.after_stop_order || 1,
        point_order: point.order || point.pointOrder || index + 1,
        latitude: point.lat,
        longitude: point.lng,
      })),
    );

    const path = await buildNaverPath(routePoints, clientId, secretKey);
    return c.json({ success: true, data: { path } });
  } catch (error: any) {
    console.error("❌ Route path preview error:", error);
    return c.json({ success: false, error: "Failed to preview route path" }, 500);
  }
});

// Get route by ID with stops
routes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // 노선 조회
    const { data: route, error: routeError } = await db
      .from('routes')
      .select('*')
      .eq('id', id)
      .single();

    if (routeError || !route) {
      return c.json({ success: false, error: "Route not found" }, 404);
    }

    // 정류장 조회
    const { data: stops } = await db
      .from('route_stops')
      .select('*')
      .eq('route_id', id)
      .order('stop_order');

    const shapePoints = await getShapePoints(id);

    const formattedRoute = {
      id: route.id,
      name: route.name,
      type: toClientRouteType(route.type),
      description: route.description,
      shuttleVariant: route.shuttle_variant,
      color: route.color,
      region: route.region,
      schedule: route.schedule,
      ...formatServiceRules(route),
      duration: route.duration,
      fare: route.fare,
      isActive: route.is_active,
      stops: stops?.map(stop => ({
        id: stop.id,
        name: stop.stop_name,
        order: stop.stop_order,
        lat: stop.latitude,
        lng: stop.longitude,
        arrivalTime: stop.arrival_time,
      })) || [],
      shapePoints: shapePoints.map(formatShapePoint),
      createdAt: route.created_at,
      updatedAt: route.updated_at,
    };

    console.log(`✅ Fetched route: ${id}`);

    return c.json({ success: true, data: formattedRoute });
  } catch (error: any) {
    console.error("❌ Get route error:", error);
    return c.json({ success: false, error: "Failed to fetch route" }, 500);
  }
});

// Create route (admin only)
routes.post("/", requireAdmin, async (c) => {
  try {
    const payload = await c.req.json();
    const { name, type, shuttleVariant, description, color, region, schedule, duration, fare, isActive, stops, shapePoints } = payload;

    if (!name || !type) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const detailErrors = [
      ...validateRouteDetailsInput(type, shuttleVariant, stops, shapePoints),
      ...validateServiceRules(type, shuttleVariant, payload, true),
    ];
    if (detailErrors.length > 0) {
      return c.json({ success: false, error: detailErrors.join(" ") }, 400);
    }

    // 노선 생성
    const { data: route, error: routeError } = await db
      .from('routes')
      .insert({
        name,
        type: toDbRouteType(type),
        shuttle_variant: normalizeShuttleVariant(type, shuttleVariant),
        description: description || null,
        color: color || '#1E3B8A',
        region: region || null,
        schedule: schedule || null,
        duration: duration || null,
        fare: fare || null,
        is_active: isActive ?? true,
        ...normalizeServiceRules(type, shuttleVariant, payload),
      })
      .select()
      .single();

    if (routeError || !route) {
      console.error("❌ Route creation error:", routeError);
      return c.json({ success: false, error: "Failed to create route" }, 500);
    }

    if (stops !== undefined || shapePoints !== undefined) {
      const { error: detailError } = await replaceRouteDetails(route.id, {
        replaceStops: stops !== undefined,
        stops,
        replaceShapePoints: shapePoints !== undefined,
        shapePoints,
      });

      if (detailError) {
        console.error("❌ Route detail creation error:", detailError);
        await db.from('routes').delete().eq('id', route.id);
        return c.json({ success: false, error: "노선 상세 저장 실패: " + detailError.message }, 500);
      }
    }

    console.log(`✅ Route created: ${route.id}`);

    return c.json({
      success: true,
      data: {
        id: route.id,
        name: route.name,
        type: toClientRouteType(route.type),
        shuttleVariant: route.shuttle_variant,
        description: route.description,
        color: route.color,
        region: route.region,
        schedule: route.schedule,
        ...formatServiceRules(route),
        duration: route.duration,
        fare: route.fare,
        isActive: route.is_active,
        createdAt: route.created_at,
      }
    });
  } catch (error: any) {
    console.error("❌ Create route error:", error);
    return c.json({ success: false, error: "Failed to create route" }, 500);
  }
});

// Update route (admin only)
routes.put("/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const payload = await c.req.json();
    const { name, type, shuttleVariant, description, color, isActive, region, schedule, duration, fare, stops, shapePoints } = payload;

    if (!id) {
      return c.json({ success: false, error: "Route id is required" }, 400);
    }

    // 노선 존재 여부 확인
    const { data: existingRoute } = await db
      .from('routes')
      .select('id, type, shuttle_variant')
      .eq('id', id)
      .single();

    if (!existingRoute) {
      return c.json({ success: false, error: "Route not found" }, 404);
    }

    const nextType = type || toClientRouteType(existingRoute.type);
    const nextShuttleVariant = shuttleVariant !== undefined
      ? shuttleVariant
      : existingRoute.shuttle_variant;
    const detailErrors = [
      ...validateRouteDetailsInput(nextType, nextShuttleVariant, stops, shapePoints),
      ...validateServiceRules(nextType, nextShuttleVariant ?? existingRoute.shuttle_variant, payload),
    ];
    if (detailErrors.length > 0) {
      return c.json({ success: false, error: detailErrors.join(" ") }, 400);
    }

    // 노선 수정
    const dbUpdates: any = {};
    if (name) dbUpdates.name = name;
    if (type) dbUpdates.type = toDbRouteType(type);
    if (type || shuttleVariant !== undefined) {
      dbUpdates.shuttle_variant = normalizeShuttleVariant(type || existingRoute.type, shuttleVariant);
    }
    if (description !== undefined) dbUpdates.description = description;
    if (color) dbUpdates.color = color;
    if (isActive !== undefined) dbUpdates.is_active = isActive;
    if (region !== undefined) dbUpdates.region = region;
    if (schedule !== undefined) dbUpdates.schedule = schedule;
    if (duration !== undefined) dbUpdates.duration = duration;
    if (fare !== undefined) dbUpdates.fare = fare;
    if (type || shuttleVariant !== undefined || payload.scheduleBasis !== undefined || payload.intervalMinutes !== undefined || payload.departureOffsetMinutes !== undefined || payload.boardingWaitMinutes !== undefined || payload.continuationRouteId !== undefined) {
      Object.assign(dbUpdates, normalizeServiceRules(nextType, nextShuttleVariant ?? existingRoute.shuttle_variant, payload));
    }

    let updatedRoute = null;
    if (Object.keys(dbUpdates).length > 0) {
      const { data, error: updateError } = await db
        .from('routes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError || !data) {
        console.error("❌ Route update error:", updateError);
        return c.json({ success: false, error: "Failed to update route" }, 500);
      }
      updatedRoute = data;
    } else {
      const { data, error: refetchError } = await db
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (refetchError || !data) {
        console.error("❌ Route refetch error:", refetchError);
        return c.json({ success: false, error: "Failed to update route" }, 500);
      }
      updatedRoute = data;
    }

    if (stops !== undefined || shapePoints !== undefined) {
      const { error: detailError } = await replaceRouteDetails(id, {
        replaceStops: stops !== undefined,
        stops,
        replaceShapePoints: shapePoints !== undefined,
        shapePoints,
      });

      if (detailError) {
        console.error("❌ Route detail update error:", detailError);
        return c.json({ success: false, error: "노선 상세 저장 실패: " + detailError.message }, 500);
      }
    }

    console.log(`✅ Route updated: ${id}`);

    return c.json({
      success: true,
      data: {
        id: updatedRoute.id,
        name: updatedRoute.name,
        type: toClientRouteType(updatedRoute.type),
        shuttleVariant: updatedRoute.shuttle_variant,
        description: updatedRoute.description,
        color: updatedRoute.color,
        region: updatedRoute.region,
        schedule: updatedRoute.schedule,
        ...formatServiceRules(updatedRoute),
        duration: updatedRoute.duration,
        fare: updatedRoute.fare,
        isActive: updatedRoute.is_active,
        updatedAt: updatedRoute.updated_at,
      }
    });
  } catch (error: any) {
    console.error("❌ Update route error:", error);
    return c.json({ success: false, error: "Failed to update route" }, 500);
  }
});

// Delete route (admin only)
routes.delete("/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");

    // 노선 존재 여부 확인
    const { data: existingRoute } = await db
      .from('routes')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingRoute) {
      return c.json({ success: false, error: "Route not found" }, 404);
    }

    // 노선 삭제 (CASCADE로 정류장도 자동 삭제)
    const { error: deleteError } = await db
      .from('routes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("❌ Route deletion error:", deleteError);
      return c.json({ success: false, error: "Failed to delete route" }, 500);
    }

    console.log(`✅ Route deleted: ${id}`);

    return c.json({ success: true, message: "Route deleted successfully" });
  } catch (error: any) {
    console.error("❌ Delete route error:", error);
    return c.json({ success: false, error: "Failed to delete route" }, 500);
  }
});

export default routes;
