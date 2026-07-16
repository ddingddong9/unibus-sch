import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAdmin, requireAuth } from "../middleware/auth.tsx";

const reports = new Hono<{ Variables: { userId: string } }>();
const categories = new Set(["location", "schedule", "notification", "login", "lost", "other"]);
const statuses = new Set(["open", "in_progress", "resolved"]);

const formatReport = (report: any, user?: any) => ({
  id: report.id,
  userId: report.user_id,
  userName: user?.name || "알 수 없음",
  userEmail: user?.email || "",
  category: report.category,
  title: report.title,
  details: report.details,
  status: report.status,
  relatedBusId: report.related_bus_id,
  relatedRouteId: report.related_route_id,
  adminNote: report.admin_note || "",
  resolvedAt: report.resolved_at,
  createdAt: report.created_at,
  updatedAt: report.updated_at,
});

reports.post("/", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const category = String(body.category || "other");
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();

    if (!categories.has(category) || !title || !details) {
      return c.json({ success: false, error: "문의 유형, 제목, 내용을 모두 입력해 주세요" }, 400);
    }

    const { data, error } = await db.from("user_reports").insert({
      user_id: userId,
      category,
      title: title.slice(0, 160),
      details,
      related_bus_id: body.relatedBusId || null,
      related_route_id: body.relatedRouteId || null,
    }).select("*").single();

    if (error || !data) {
      console.error("❌ Report creation error:", error);
      return c.json({ success: false, error: "문의 접수에 실패했습니다" }, 500);
    }
    return c.json({ success: true, data: formatReport(data) });
  } catch (error) {
    console.error("❌ Report creation error:", error);
    return c.json({ success: false, error: "문의 접수에 실패했습니다" }, 500);
  }
});

reports.get("/", requireAdmin, async (c) => {
  try {
    const status = c.req.query("status");
    let query = db.from("user_reports").select("*").order("created_at", { ascending: false }).limit(200);
    if (status && statuses.has(status)) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;

    const userIds = [...new Set((data || []).map((report: any) => report.user_id))];
    const { data: users } = userIds.length
      ? await db.from("users").select("id, name, email").in("id", userIds)
      : { data: [] };
    const userById = new Map((users || []).map((user: any) => [user.id, user]));
    return c.json({ success: true, data: (data || []).map((report: any) => formatReport(report, userById.get(report.user_id))) });
  } catch (error) {
    console.error("❌ Reports fetch error:", error);
    return c.json({ success: false, error: "문의 목록을 불러오지 못했습니다" }, 500);
  }
});

reports.put("/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const adminId = c.get("userId");
    const body = await c.req.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!statuses.has(body.status)) return c.json({ success: false, error: "올바르지 않은 처리 상태입니다" }, 400);
      updates.status = body.status;
      updates.resolved_at = body.status === "resolved" ? new Date().toISOString() : null;
    }
    if (body.adminNote !== undefined) updates.admin_note = String(body.adminNote).trim();
    if (Object.keys(updates).length === 0) return c.json({ success: false, error: "변경할 내용이 없습니다" }, 400);

    const { data, error } = await db.from("user_reports").update(updates).eq("id", id).select("*").single();
    if (error || !data) return c.json({ success: false, error: "문의 처리 상태 변경에 실패했습니다" }, 500);

    await db.from("admin_action_logs").insert({
      admin_id: adminId,
      action: "report_updated",
      target_type: "user_report",
      target_id: id,
      metadata: updates,
    });
    return c.json({ success: true, data: formatReport(data) });
  } catch (error) {
    console.error("❌ Report update error:", error);
    return c.json({ success: false, error: "문의 처리 상태 변경에 실패했습니다" }, 500);
  }
});

export default reports;
