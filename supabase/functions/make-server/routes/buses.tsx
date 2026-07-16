// Bus Routes (관계형 DB 버전)

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { getOptionalUser, requireAdmin, requireDriver } from "../middleware/auth.tsx";

const buses = new Hono<{
  Variables: {
    userId: string;
    userRole: string;
  };
}>();

const toClientBusType = (type: string) => type === 'shuttle' ? 'campus' : type === 'commute' ? 'commuter' : type;
const toDbBusType = (type: string) => type === 'campus' ? 'shuttle' : type === 'commuter' || type === 'direct' ? 'commute' : type;
const validBusTypes = new Set(['shuttle', 'commute']);
const validBusStatuses = new Set(['active', 'inactive', 'maintenance']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const createBusId = (type: string) => {
  const prefix = toDbBusType(type) === 'shuttle' ? 'SH' : 'CM';
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  return `${prefix}-${suffix}`;
};

// Get all buses - JOIN으로 노선 정보 포함
buses.get("/", async (c) => {
  try {
    const isAdmin = (await getOptionalUser(c))?.role === 'admin';
    // buses_with_routes 뷰 사용
    const { data: allBuses, error } = await db
      .from('buses_with_routes')
      .select('*')
      .order('id');

    if (error) {
      console.error("❌ Get buses error:", error);
      return c.json({ success: false, error: "Failed to fetch buses" }, 500);
    }

    const busIds = (allBuses || []).map((bus: any) => bus.id);
    const [{ data: activeTrips }, { data: latestLocations }] = busIds.length > 0
      ? await Promise.all([
        db.from('bus_trips')
        .select('id, bus_id, route_id, service_phase, planned_departure_at, current_stop_order')
        .in('bus_id', busIds)
        .eq('status', 'active'),
        db.from('bus_latest_state')
          .select('bus_id, latitude, longitude, speed, heading, timestamp')
          .in('bus_id', busIds),
      ])
      : [{ data: [] }, { data: [] }];
    const tripByBus = new Map((activeTrips || []).map((trip: any) => [trip.bus_id, trip]));
    const locationByBus = new Map((latestLocations || []).map((location: any) => [location.bus_id, location]));

    // 프론트엔드 호환성을 위해 필드명 변환
    const formattedBuses = allBuses?.map(bus => ({
      id: bus.id,
      name: bus.name,
      type: toClientBusType(bus.type),
      capacity: bus.capacity,
      status: bus.status,
      isRunning: bus.is_running,
      currentRoute: bus.route_id ? {
        id: bus.route_id,
        name: bus.route_name,
        color: bus.route_color,
      } : null,
      activeTrip: tripByBus.has(bus.id) ? {
        id: tripByBus.get(bus.id).id,
        routeId: tripByBus.get(bus.id).route_id,
        servicePhase: tripByBus.get(bus.id).service_phase,
        plannedDepartureAt: tripByBus.get(bus.id).planned_departure_at,
        currentStopOrder: tripByBus.get(bus.id).current_stop_order,
      } : null,
      location: locationByBus.has(bus.id) ? {
        lat: locationByBus.get(bus.id).latitude,
        lng: locationByBus.get(bus.id).longitude,
        speed: locationByBus.get(bus.id).speed,
        heading: locationByBus.get(bus.id).heading,
        timestamp: locationByBus.get(bus.id).timestamp,
      } : null,
      lastLocationAt: locationByBus.get(bus.id)?.timestamp || null,
      ...(isAdmin ? {
        licensePlate: bus.license_plate,
        currentDriverId: bus.current_driver_id,
        currentDriverName: bus.current_driver_name,
        assignedDriverId: bus.assigned_driver_id,
        assignedDriverName: bus.assigned_driver_name,
        createdAt: bus.created_at,
        updatedAt: bus.updated_at,
      } : {}),
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
    const isAdmin = (await getOptionalUser(c))?.role === 'admin';

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
      status: bus.status,
      isRunning: bus.is_running,
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
      ...(isAdmin ? {
        licensePlate: bus.license_plate,
        currentDriverId: bus.current_driver_id,
        currentDriverName: bus.current_driver_name,
        assignedDriverId: bus.assigned_driver_id,
        assignedDriverName: bus.assigned_driver_name,
        createdAt: bus.created_at,
        updatedAt: bus.updated_at,
      } : {}),
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
    // 5초마다 upsert되는 버스별 최신 상태를 직접 조회한다.
    const { data: locations, error } = await db
      .from('bus_latest_state')
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
    const busName = typeof name === 'string' ? name.trim() : '';

    if (!busName || !type) {
      return c.json({ success: false, error: "Missing required fields: name, type" }, 400);
    }

    if (busName.length > 100) {
      return c.json({ success: false, error: "Bus name must be 100 characters or fewer" }, 400);
    }

    const dbType = toDbBusType(String(type));
    if (!validBusTypes.has(dbType)) {
      return c.json({ success: false, error: "Invalid bus type" }, 400);
    }

    const normalizedCapacity = capacity === undefined || capacity === null || capacity === '' ? 45 : Number(capacity);
    if (!Number.isInteger(normalizedCapacity) || normalizedCapacity < 1 || normalizedCapacity > 100) {
      return c.json({ success: false, error: "Capacity must be an integer between 1 and 100" }, 400);
    }

    const normalizedLicensePlate = typeof licensePlate === 'string' ? licensePlate.trim() : '';
    if (normalizedLicensePlate.length > 30) {
      return c.json({ success: false, error: "License plate must be 30 characters or fewer" }, 400);
    }

    if (routeId && !UUID_PATTERN.test(String(routeId))) {
      return c.json({ success: false, error: "Invalid route ID" }, 400);
    }

    const { data: bus, error: insertError } = await db
      .from('buses')
      .insert({
        id: createBusId(type),
        name: busName,
        type: dbType,
        capacity: normalizedCapacity,
        license_plate: normalizedLicensePlate || null,
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

    const latitude = Number(lat);
    const longitude = Number(lng);
    const normalizedSpeed = speed === undefined ? 0 : Number(speed);
    const normalizedHeading = heading === undefined ? 0 : Number(heading);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !Number.isFinite(normalizedSpeed) || normalizedSpeed < 0 || normalizedSpeed > 250
      || !Number.isFinite(normalizedHeading) || normalizedHeading < 0 || normalizedHeading >= 360) {
      return c.json({ success: false, error: "Invalid location data" }, 400);
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
        latitude,
        longitude,
        speed: normalizedSpeed,
        heading: Math.round(normalizedHeading),
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
    if (updates.name !== undefined) {
      const name = String(updates.name).trim();
      if (!name || name.length > 100) {
        return c.json({ success: false, error: "Bus name is required" }, 400);
      }
      dbUpdates.name = name;
    }
    if (updates.type !== undefined) {
      const dbType = toDbBusType(String(updates.type));
      if (!validBusTypes.has(dbType)) return c.json({ success: false, error: "Invalid bus type" }, 400);
      dbUpdates.type = dbType;
    }
    if (updates.capacity !== undefined) {
      const capacity = Number(updates.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
        return c.json({ success: false, error: "Capacity must be an integer between 1 and 100" }, 400);
      }
      dbUpdates.capacity = capacity;
    }
    if (updates.licensePlate !== undefined) {
      const licensePlate = String(updates.licensePlate || '').trim();
      if (licensePlate.length > 30) return c.json({ success: false, error: "Invalid license plate" }, 400);
      dbUpdates.license_plate = licensePlate || null;
    }
    if (updates.status !== undefined) {
      const status = String(updates.status);
      if (!validBusStatuses.has(status)) return c.json({ success: false, error: "Invalid bus status" }, 400);
      dbUpdates.status = status;
    }
    if (updates.currentRouteId !== undefined) {
      if (updates.currentRouteId !== null && !UUID_PATTERN.test(String(updates.currentRouteId))) {
        return c.json({ success: false, error: "Invalid route ID" }, 400);
      }
      dbUpdates.current_route_id = updates.currentRouteId;
    }
    if (updates.assignedDriverId !== undefined) {
      if (updates.assignedDriverId === null || updates.assignedDriverId === "") {
        dbUpdates.assigned_driver_id = null;
      } else {
        const { data: driver, error: driverError } = await db
          .from('users')
          .select('id, role')
          .eq('id', updates.assignedDriverId)
          .single();

        if (driverError || !driver || driver.role !== 'driver') {
          return c.json({ success: false, error: "선택한 사용자는 버스 기사가 아닙니다" }, 400);
        }

        dbUpdates.assigned_driver_id = updates.assignedDriverId;
      }
    }

    if (updates.isRunning === false) {
      dbUpdates.is_running = false;
      dbUpdates.current_driver_id = null;
    }

    if (Object.keys(dbUpdates).length === 0) {
      return c.json({ success: false, error: "No valid updates provided" }, 400);
    }

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
        isRunning: updatedBus.is_running,
        currentDriverId: updatedBus.current_driver_id,
        assignedDriverId: updatedBus.assigned_driver_id,
        currentRouteId: updatedBus.current_route_id,
        updatedAt: updatedBus.updated_at,
      }
    });
  } catch (error: any) {
    console.error("❌ Update bus error:", error);
    return c.json({ success: false, error: "Failed to update bus" }, 500);
  }
});

// Force-stop a live trip atomically so the bus and trip records stay aligned.
buses.post("/:id/force-stop", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const adminId = c.get("userId");
    const { reason = "관리자 강제 종료" } = await c.req.json().catch(() => ({}));
    const { data: existingBus } = await db.from("buses").select("id").eq("id", id).maybeSingle();
    if (!existingBus) return c.json({ success: false, error: "Bus not found" }, 404);

    const { error } = await db.rpc("admin_force_stop_bus", { target_bus_id: id });
    if (error) {
      console.error("❌ Force-stop error:", error);
      return c.json({ success: false, error: "운행 기록을 정리하지 못했습니다" }, 500);
    }

    await db.from("admin_action_logs").insert({
      admin_id: adminId,
      action: "bus_force_stopped",
      target_type: "bus",
      target_id: id,
      metadata: { reason: String(reason).slice(0, 300) },
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Force-stop error:", error);
    return c.json({ success: false, error: "강제 운행 종료에 실패했습니다" }, 500);
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
