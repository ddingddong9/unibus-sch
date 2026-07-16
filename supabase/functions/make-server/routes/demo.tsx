import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAdmin } from "../middleware/auth.tsx";

const demo = new Hono<{ Variables: { userId: string } }>();

const formatSession = (session: any) => ({
  id: session.id,
  status: session.status,
  plans: session.plans || [],
  startedAt: session.started_at,
  endedAt: session.ended_at,
});

demo.get("/status", requireAdmin, async (c) => {
  const { data, error } = await db.from("demo_sessions")
    .select("*").eq("status", "active").order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return c.json({ success: false, error: "데모 상태를 확인하지 못했습니다" }, 500);
  return c.json({ success: true, data: data ? formatSession(data) : null });
});

demo.post("/start", requireAdmin, async (c) => {
  try {
    const adminId = c.get("userId");
    const { plans } = await c.req.json();
    if (!Array.isArray(plans) || plans.length === 0 || plans.length > 5) {
      return c.json({ success: false, error: "데모 버스를 1~5대 선택해 주세요" }, 400);
    }

    const { data: active } = await db.from("demo_sessions").select("id").eq("status", "active").limit(1).maybeSingle();
    if (active) return c.json({ success: false, error: "이미 복구되지 않은 데모 세션이 있습니다" }, 409);

    const busIds = [...new Set(plans.map((plan: any) => String(plan.busId || "")).filter(Boolean))];
    if (busIds.length !== plans.length) return c.json({ success: false, error: "데모 버스 정보가 올바르지 않습니다" }, 400);

    const { data: buses, error: busError } = await db.from("buses")
      .select("id, type, status, current_route_id, assigned_driver_id, current_driver_id, is_running")
      .in("id", busIds);
    if (busError || buses?.length !== busIds.length) return c.json({ success: false, error: "일부 데모 버스를 찾지 못했습니다" }, 404);
    if ((buses || []).some((bus: any) => bus.is_running)) {
      return c.json({ success: false, error: "실제 운행 중인 버스는 데모에 사용할 수 없습니다" }, 409);
    }

    const snapshot = (buses || []).map((bus: any) => ({
      busId: bus.id,
      type: bus.type,
      status: bus.status,
      currentRouteId: bus.current_route_id,
      assignedDriverId: bus.assigned_driver_id,
      currentDriverId: bus.current_driver_id,
      isRunning: bus.is_running,
    }));
    const { data: session, error: sessionError } = await db.from("demo_sessions").insert({
      snapshot,
      plans,
      created_by: adminId,
    }).select("*").single();
    if (sessionError || !session) return c.json({ success: false, error: "데모 복구 지점을 만들지 못했습니다" }, 500);

    try {
      await Promise.all(plans.map((plan: any) => db.from("buses").update({
        type: plan.kind === "campus" ? "shuttle" : "commute",
        status: "active",
        current_route_id: plan.routeId || null,
        current_driver_id: null,
        is_running: false,
      }).eq("id", plan.busId).throwOnError()));
    } catch (error) {
      await Promise.all(snapshot.map((bus: any) => db.from("buses").update({
        type: bus.type,
        status: bus.status,
        current_route_id: bus.currentRouteId,
        assigned_driver_id: bus.assignedDriverId,
        current_driver_id: bus.currentDriverId,
        is_running: bus.isRunning,
      }).eq("id", bus.busId)));
      await db.from("demo_sessions").update({ status: "failed", ended_at: new Date().toISOString() }).eq("id", session.id);
      throw error;
    }

    await db.from("admin_action_logs").insert({ admin_id: adminId, action: "demo_started", target_type: "demo_session", target_id: session.id });
    return c.json({ success: true, data: formatSession(session) });
  } catch (error) {
    console.error("❌ Demo start error:", error);
    return c.json({ success: false, error: "데모 시작에 실패했습니다" }, 500);
  }
});

demo.post("/stop", requireAdmin, async (c) => {
  try {
    const adminId = c.get("userId");
    const { data: session, error } = await db.from("demo_sessions")
      .select("*").eq("status", "active").order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!session) return c.json({ success: true, data: null });

    const snapshot = Array.isArray(session.snapshot) ? session.snapshot : [];
    await Promise.all(snapshot.map((bus: any) => db.from("buses").update({
      type: bus.type,
      status: bus.status,
      current_route_id: bus.currentRouteId,
      assigned_driver_id: bus.assignedDriverId,
      current_driver_id: bus.currentDriverId,
      is_running: bus.isRunning,
    }).eq("id", bus.busId).throwOnError()));

    const endedAt = new Date().toISOString();
    const { data: ended } = await db.from("demo_sessions")
      .update({ status: "completed", ended_at: endedAt }).eq("id", session.id).select("*").single();
    await db.from("admin_action_logs").insert({ admin_id: adminId, action: "demo_stopped", target_type: "demo_session", target_id: session.id });
    return c.json({ success: true, data: ended ? formatSession(ended) : null });
  } catch (error) {
    console.error("❌ Demo stop error:", error);
    return c.json({ success: false, error: "데모 상태 복구에 실패했습니다" }, 500);
  }
});

export default demo;
