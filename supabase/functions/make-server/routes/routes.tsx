// Route Management (관계형 DB 버전)

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAdmin } from "../middleware/auth.tsx";

const routes = new Hono();

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

        return {
          id: route.id,
          name: route.name,
          type: route.type,
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

    const formattedRoute = {
      id: route.id,
      name: route.name,
      type: route.type,
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
    const { name, type, description, color, region, schedule, duration, fare, stops } = await c.req.json();

    if (!name || !type) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // 노선 생성
    const { data: route, error: routeError } = await db
      .from('routes')
      .insert({
        name,
        type,
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
        latitude: stop.lat,
        longitude: stop.lng,
        arrival_time: stop.arrivalTime || null,
      }));

      const { error: stopsError } = await db
        .from('route_stops')
        .insert(stopsData);

      if (stopsError) {
        console.error("❌ Stops creation error:", stopsError);
        // 노선 생성은 성공했지만 정류장 추가 실패
      }
    }

    console.log(`✅ Route created: ${route.id}`);

    return c.json({
      success: true,
      data: {
        id: route.id,
        name: route.name,
        type: route.type,
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
    const { name, description, color, isActive, region, schedule, duration, fare, stops } = await c.req.json();

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
    if (description !== undefined) dbUpdates.description = description;
    if (color) dbUpdates.color = color;
    if (isActive !== undefined) dbUpdates.is_active = isActive;
    if (region !== undefined) dbUpdates.region = region;
    if (schedule !== undefined) dbUpdates.schedule = schedule;
    if (duration !== undefined) dbUpdates.duration = duration;
    if (fare !== undefined) dbUpdates.fare = fare;

    const { data: updatedRoute, error: updateError } = await db
      .from('routes')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedRoute) {
      console.error("❌ Route update error:", updateError);
      return c.json({ success: false, error: "Failed to update route" }, 500);
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
        latitude: stop.lat,
        longitude: stop.lng,
        arrival_time: stop.arrivalTime || null,
      }));

      await db
        .from('route_stops')
        .insert(stopsData);
    }

    console.log(`✅ Route updated: ${id}`);

    return c.json({
      success: true,
      data: {
        id: updatedRoute.id,
        name: updatedRoute.name,
        type: updatedRoute.type,
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

// 정류장 조회
routes.get("/:id/stops", async (c) => {
  try {
    const id = c.req.param("id");

    // route_stops 테이블에서 해당 노선 정류장 가져오기
    const { data: stops, error } = await db
      .from('route_stops')
      .select('*')
      .eq('route_id', id)
      .order('stop_order');

    if (error) {
      console.error("❌ Get stops error:", error);
      return c.json({ success: false, error: "Failed to fetch stops" }, 500);
    }

    const formattedStops = stops.map(stop => ({
      id: stop.id,
      name: stop.stop_name,
      order: stop.stop_order,
      lat: stop.latitude,
      lng: stop.longitude,
      arrivalTime: stop.arrival_time,
    }));

    console.log(`✅ Fetched stops for route: ${id}`);
    return c.json({ success: true, data: formattedStops });

  } catch (error: any) {
    console.error("❌ Get stops exception:", error);
    return c.json({ success: false, error: "Server error" }, 500);
  }
});

// 정류장 추가
routes.post("/:id/stops", requireAdmin, async (c) => {
  try {
    const routeId = c.req.param("id");
    const body = await c.req.json();

    if (!body.name || !body.lat || !body.lng) {
      return c.json({ success: false, error: "Missing required fields (name, lat, lng)" }, 400);
    }

    const newStopData = {
      route_id: routeId,
      stop_name: body.name,
      stop_order: body.order, 
      latitude: body.lat,
      longitude: body.lng,
      arrival_time: body.arrivalTime || null,
    };

    const { data: newStop, error } = await db
      .from('route_stops')
      .insert(newStopData)
      .select() 
      .single();

    if (error) {
      console.error("❌ Add stop error:", error);
      return c.json({ success: false, error: "Failed to add stop" }, 500);
    }

    console.log(`✅ Stop added to route: ${routeId}`);
    return c.json({ success: true, data: newStop }, 201);

  } catch (error: any) {
    console.error("❌ Add stop exception:", error);
    return c.json({ success: false, error: "Server error" }, 500);
  }
});

export default routes;
