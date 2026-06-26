// Route Management (관계형 DB 버전)

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAdmin } from "../middleware/auth.tsx";

const routes = new Hono();

const toClientRouteType = (type: string) => type === 'shuttle' ? 'campus' : type === 'commute' ? 'commuter' : type;
const toDbRouteType = (type: string) => type === 'campus' ? 'shuttle' : type === 'commuter' ? 'commute' : type;

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
          color: route.color,
          region: route.region,
          schedule: route.schedule,
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

    const path = await buildNaverPath(routePoints, clientId, secretKey);

    return c.json({ success: true, data: { stops: resolved, shapePoints: shapePoints.map(formatShapePoint), path } });
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
      color: route.color,
      region: route.region,
      schedule: route.schedule,
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
    const { name, type, description, color, region, schedule, duration, fare, stops, shapePoints } = await c.req.json();

    if (!name || !type) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // 노선 생성
    const { data: route, error: routeError } = await db
      .from('routes')
      .insert({
        name,
        type: toDbRouteType(type),
        description: description || null,
        color: color || '#1E3B8A',
        region: region || null,
        schedule: schedule || null,
        duration: duration || null,
        fare: fare || null,
        is_active: true,
      })
      .select()
      .single();

    if (routeError || !route) {
      console.error("❌ Route creation error:", routeError);
      return c.json({ success: false, error: "Failed to create route" }, 500);
    }

    // 정류장 추가
    if (stops && stops.length > 0) {
      const stopsData = stops.map((stop: any, index: number) => ({
        route_id: route.id,
        stop_name: stop.name,
        stop_order: stop.order || index + 1,
        latitude: stop.lat ?? null,
        longitude: stop.lng ?? null,
        arrival_time: stop.arrivalTime || null,
      }));

      const { error: stopsError } = await db
        .from('route_stops')
        .insert(stopsData);

      if (stopsError) {
        console.error("❌ Stops creation error:", stopsError);
        return c.json({ success: false, error: "정류장 추가 실패: " + stopsError.message }, 500);
      }
    }

    if (shapePoints && shapePoints.length > 0) {
      const shapePointsData = shapePoints
        .filter((point: any) => point.lat != null && point.lng != null)
        .map((point: any, index: number) => ({
          route_id: route.id,
          name: point.name || '경로 보정점',
          after_stop_order: point.afterStopOrder || point.after_stop_order || 1,
          point_order: point.order || point.pointOrder || index + 1,
          latitude: point.lat,
          longitude: point.lng,
        }));

      if (shapePointsData.length > 0) {
        const { error: shapeInsertError } = await db
          .from('route_shape_points')
          .insert(shapePointsData);

        if (shapeInsertError) {
          console.error("❌ Shape points creation error:", shapeInsertError);
          return c.json({ success: false, error: "경로 보정점 추가 실패: " + shapeInsertError.message }, 500);
        }
      }
    }

    console.log(`✅ Route created: ${route.id}`);

    return c.json({
      success: true,
      data: {
        id: route.id,
        name: route.name,
        type: toClientRouteType(route.type),
        description: route.description,
        color: route.color,
        region: route.region,
        schedule: route.schedule,
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
    const { name, type, description, color, isActive, region, schedule, duration, fare, stops, shapePoints } = await c.req.json();

    // 노선 존재 여부 확인
    const { data: existingRoute } = await db
      .from('routes')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingRoute) {
      return c.json({ success: false, error: "Route not found" }, 404);
    }

    // 노선 수정
    const dbUpdates: any = {};
    if (name) dbUpdates.name = name;
    if (type) dbUpdates.type = toDbRouteType(type);
    if (description !== undefined) dbUpdates.description = description;
    if (color) dbUpdates.color = color;
    if (isActive !== undefined) dbUpdates.is_active = isActive;
    if (region !== undefined) dbUpdates.region = region;
    if (schedule !== undefined) dbUpdates.schedule = schedule;
    if (duration !== undefined) dbUpdates.duration = duration;
    if (fare !== undefined) dbUpdates.fare = fare;

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

    // 정류장 업데이트 (있는 경우)
    if (stops && stops.length > 0) {
      // 기존 정류장 삭제
      await db
        .from('route_stops')
        .delete()
        .eq('route_id', id);

      // 새 정류장 추가
      const stopsData = stops.map((stop: any, index: number) => ({
        route_id: id,
        stop_name: stop.name,
        stop_order: stop.order || index + 1,
        latitude: stop.lat ?? null,
        longitude: stop.lng ?? null,
        arrival_time: stop.arrivalTime || null,
      }));

      const { error: stopsInsertError } = await db
        .from('route_stops')
        .insert(stopsData);

      if (stopsInsertError) {
        console.error("❌ Stops update error:", stopsInsertError);
        return c.json({ success: false, error: "정류장 저장 실패: " + stopsInsertError.message }, 500);
      }
    }

    if (shapePoints !== undefined) {
      await db
        .from('route_shape_points')
        .delete()
        .eq('route_id', id);

      const shapePointsData = (shapePoints || [])
        .filter((point: any) => point.lat != null && point.lng != null)
        .map((point: any, index: number) => ({
          route_id: id,
          name: point.name || '경로 보정점',
          after_stop_order: point.afterStopOrder || point.after_stop_order || 1,
          point_order: point.order || point.pointOrder || index + 1,
          latitude: point.lat,
          longitude: point.lng,
        }));

      if (shapePointsData.length > 0) {
        const { error: shapeInsertError } = await db
          .from('route_shape_points')
          .insert(shapePointsData);

        if (shapeInsertError) {
          console.error("❌ Shape points update error:", shapeInsertError);
          return c.json({ success: false, error: "경로 보정점 저장 실패: " + shapeInsertError.message }, 500);
        }
      }
    }

    console.log(`✅ Route updated: ${id}`);

    return c.json({
      success: true,
      data: {
        id: updatedRoute.id,
        name: updatedRoute.name,
        type: toClientRouteType(updatedRoute.type),
        description: updatedRoute.description,
        color: updatedRoute.color,
        region: updatedRoute.region,
        schedule: updatedRoute.schedule,
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
