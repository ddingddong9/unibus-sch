// Bus Routes (관계형 DB 버전)

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAdmin, requireDriver } from "../middleware/auth.tsx";

const buses = new Hono();

const toClientBusType = (type: string) => type === 'shuttle' ? 'campus' : type === 'commute' ? 'commuter' : type;
const toDbBusType = (type: string) => type === 'campus' ? 'shuttle' : type === 'commuter' || type === 'direct' ? 'commute' : type;

// Get all buses - JOIN으로 노선 정보 포함
buses.get("/", async (c) => {
  try {
    // buses_with_routes 뷰 사용
    const { data: allBuses, error } = await db
      .from('buses_with_routes')
      .select('*')
      .order('id');

    if (error) {
      console.error("❌ Get buses error:", error);
      return c.json({ success: false, error: "Failed to fetch buses" }, 500);
    }

    // 프론트엔드 호환성을 위해 필드명 변환
    const formattedBuses = allBuses?.map(bus => ({
      id: bus.id,
      name: bus.name,
      type: toClientBusType(bus.type),
      capacity: bus.capacity,
      licensePlate: bus.license_plate,
      status: bus.status,
      currentRoute: bus.route_id ? {
        id: bus.route_id,
        name: bus.route_name,
        color: bus.route_color,
      } : null,
      createdAt: bus.created_at,
      updatedAt: bus.updated_at,
    })) || [];

    console.log(`✅ Fetched ${formattedBuses.length} buses`);

    return c.json({ success: true, data: formattedBuses });
  } catch (error: any) {
    console.error("❌ Get buses error:", error);
    return c.json({ success: false, error: "Failed to fetch buses" }, 500);
  }
});

// Get bus by ID with current location
buses.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // 버스 정보 조회
    const { data: bus, error: busError } = await db
      .from('buses_with_routes')
      .select('*')
      .eq('id', id)
      .single();

    if (busError || !bus) {
      return c.json({ success: false, error: "Bus not found" }, 404);
    }

    // 최신 위치 조회
    const { data: location } = await db
      .from('bus_locations')
      .select('*')
      .eq('bus_id', id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // 프론트엔드 호환성을 위해 필드명 변환
    const formattedBus = {
      id: bus.id,
      name: bus.name,
      type: toClientBusType(bus.type),
      capacity: bus.capacity,
      licensePlate: bus.license_plate,
      status: bus.status,
      currentRoute: bus.route_id ? {
        id: bus.route_id,
        name: bus.route_name,
        color: bus.route_color,
      } : null,
      location: location ? {
        lat: location.latitude,
        lng: location.longitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp,
      } : null,
      createdAt: bus.created_at,
      updatedAt: bus.updated_at,
    };

    console.log(`✅ Fetched bus: ${id}`);

    return c.json({ success: true, data: formattedBus });
  } catch (error: any) {
    console.error("❌ Get bus error:", error);
    return c.json({ success: false, error: "Failed to fetch bus" }, 500);
  }
});

// Get all bus locations (latest)
buses.get("/locations/latest", async (c) => {
  try {
    // latest_bus_locations 뷰 사용
    const { data: locations, error } = await db
      .from('latest_bus_locations')
      .select('*');

    if (error) {
      console.error("❌ Get locations error:", error);
      return c.json({ success: false, error: "Failed to fetch locations" }, 500);
    }

    // 프론트엔드 호환성을 위해 필드명 변환
    const formattedLocations = locations?.map(loc => ({
      busId: loc.bus_id,
      lat: loc.latitude,
      lng: loc.longitude,
      speed: loc.speed,
      heading: loc.heading,
      timestamp: loc.timestamp,
    })) || [];

    console.log(`✅ Fetched ${formattedLocations.length} latest bus locations`);

    return c.json({ success: true, data: formattedLocations });
  } catch (error: any) {
    console.error("❌ Get locations error:", error);
    return c.json({ success: false, error: "Failed to fetch locations" }, 500);
  }
});

// Create bus (admin only)
buses.post("/", requireAdmin, async (c) => {
  try {
    const { name, type, capacity, licensePlate, routeId } = await c.req.json();

    if (!name || !type) {
      return c.json({ success: false, error: "Missing required fields: name, type" }, 400);
    }

    const { data: bus, error: insertError } = await db
      .from('buses')
      .insert({
        name,
        type: toDbBusType(type),
        capacity: capacity || 45,
        license_plate: licensePlate || null,
        current_route_id: routeId || null,
        status: 'inactive',
      })
      .select()
      .single();

    if (insertError || !bus) {
      console.error("❌ Bus creation error:", insertError);
      return c.json({ success: false, error: "Failed to create bus" }, 500);
    }

    console.log(`✅ Bus created: ${bus.id}`);

    return c.json({
      success: true,
      data: {
        id: bus.id,
        name: bus.name,
        type: toClientBusType(bus.type),
        capacity: bus.capacity,
        licensePlate: bus.license_plate,
        status: bus.status,
        currentRouteId: bus.current_route_id,
        createdAt: bus.created_at,
      }
    });
  } catch (error: any) {
    console.error("❌ Create bus error:", error);
    return c.json({ success: false, error: "Failed to create bus" }, 500);
  }
});

// Update bus location (드라이버/관리자 전용 - 위치 위조 방지)
buses.post("/:id/location", requireDriver, async (c) => {
  try {
    const busId = c.req.param("id");
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const { lat, lng, speed, heading } = await c.req.json();

    if (lat === undefined || lng === undefined) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // 버스 존재 여부 확인
    const { data: bus } = await db
      .from('buses')
      .select('id')
      .eq('id', busId)
      .single();

    if (!bus) {
      return c.json({ success: false, error: "Bus not found" }, 404);
    }

    // 위치 위조 방지
    if (userRole === 'driver') {
      const { data: ownedBus, error: ownedBusError } = await db
        .from('buses')
        .select('id')
        .eq('id', busId)
        .eq('current_driver_id', userId)
        .eq('is_running', true)
        .single();

      if (ownedBusError || !ownedBus) {
        return c.json({ success: false, error: "Forbidden: You can only update your currently assigned bus location" }, 403);
      }
    }

    // 위치 추가
    const { data: location, error: insertError } = await db
      .from('bus_locations')
      .insert({
        bus_id: busId,
        latitude: lat,
        longitude: lng,
        speed: speed || 0,
        heading: heading || 0,
      })
      .select()
      .single();

    if (insertError || !location) {
      console.error("❌ Location update error:", insertError);
      return c.json({ success: false, error: "Failed to update location" }, 500);
    }

    console.log(`✅ Bus location updated: ${busId}`);

    return c.json({ 
      success: true, 
      data: {
        busId: location.bus_id,
        lat: location.latitude,
        lng: location.longitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp,
      }
    });
  } catch (error: any) {
    console.error("❌ Update location error:", error);
    return c.json({ success: false, error: "Failed to update location" }, 500);
  }
});

// Update bus (admin only)
buses.put("/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    // 버스 존재 여부 확인
    const { data: existingBus } = await db
      .from('buses')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingBus) {
      return c.json({ success: false, error: "Bus not found" }, 404);
    }

    // snake_case로 변환
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.type) dbUpdates.type = toDbBusType(updates.type);
    if (updates.capacity) dbUpdates.capacity = updates.capacity;
    if (updates.licensePlate) dbUpdates.license_plate = updates.licensePlate;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.currentRouteId !== undefined) dbUpdates.current_route_id = updates.currentRouteId;

    // 버스 수정
    const { data: updatedBus, error: updateError } = await db
      .from('buses')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedBus) {
      console.error("❌ Bus update error:", updateError);
      return c.json({ success: false, error: "Failed to update bus" }, 500);
    }

    console.log(`✅ Bus updated: ${id}`);

    return c.json({ 
      success: true, 
      data: {
        id: updatedBus.id,
        name: updatedBus.name,
        type: toClientBusType(updatedBus.type),
        capacity: updatedBus.capacity,
        licensePlate: updatedBus.license_plate,
        status: updatedBus.status,
        currentRouteId: updatedBus.current_route_id,
        updatedAt: updatedBus.updated_at,
      }
    });
  } catch (error: any) {
    console.error("❌ Update bus error:", error);
    return c.json({ success: false, error: "Failed to update bus" }, 500);
  }
});

// Delete bus (admin only)
buses.delete("/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");

    const { data: existingBus } = await db
      .from('buses')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingBus) {
      return c.json({ success: false, error: "Bus not found" }, 404);
    }

    if (existingBus.status === 'active') {
      return c.json({ success: false, error: "Cannot delete an active bus. Stop the bus first." }, 409);
    }

    const { error: deleteError } = await db
      .from('buses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("❌ Bus delete error:", deleteError);
      return c.json({ success: false, error: "Failed to delete bus" }, 500);
    }

    console.log(`✅ Bus deleted: ${id}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("❌ Delete bus error:", error);
    return c.json({ success: false, error: "Failed to delete bus" }, 500);
  }
});

export default buses;
