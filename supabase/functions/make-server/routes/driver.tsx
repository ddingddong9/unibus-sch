// Driver Routes - 버스 기사 전용 API

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireDriver } from "../middleware/auth.tsx";

const driver = new Hono();

const toClientBusType = (type: string) => type === 'shuttle' ? 'campus' : type === 'commute' ? 'commuter' : type;

// 운행 가능한 버스 목록 조회
driver.get("/buses", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');
    const { data: buses, error } = await db
      .from('buses')
      .select('id, name, type, capacity, status, is_running, current_driver_id, assigned_driver_id')
      .eq('status', 'active')
      .or(`assigned_driver_id.is.null,assigned_driver_id.eq.${driverId}`)
      .order('id');

    if (error) {
      return c.json({ success: false, error: "Failed to fetch buses" }, 500);
    }

    const formattedBuses = buses?.map(bus => ({
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
    })) || [];

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
      .select('id, name, status, is_running, current_driver_id, assigned_driver_id')
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

    // 기사가 이미 다른 버스 운행 중이면 먼저 종료
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

    console.log(`✅ Driver ${driverId} started bus ${busId}`);

    return c.json({ success: true, data: { busId, driverId } });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to start driving" }, 500);
  }
});

// GPS 위치 전송 (5초마다 프론트에서 호출)
driver.post("/location", requireDriver, async (c) => {
  try {
    const driverId = c.get('userId');
    const { lat, lng, speed, heading } = await c.req.json();

    if (lat === undefined || lng === undefined) {
      return c.json({ success: false, error: "lat, lng are required" }, 400);
    }

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
        latitude: lat,
        longitude: lng,
        speed: speed || 0,
        heading: heading || 0,
      });

    if (insertError) {
      return c.json({ success: false, error: "Failed to save location" }, 500);
    }

    return c.json({ success: true, data: { busId: bus.id, lat, lng } });
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
      .select('id, name, type, capacity, status, is_running, current_driver_id, assigned_driver_id')
      .eq('current_driver_id', driverId)
      .eq('is_running', true)
      .single();

    const activeBus = bus ? {
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
    } : null;

    return c.json({ success: true, data: { activeBus } });
  } catch (error: any) {
    return c.json({ success: true, data: { activeBus: null } });
  }
});

export default driver;
