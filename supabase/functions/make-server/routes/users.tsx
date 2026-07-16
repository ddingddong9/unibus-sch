// User Management Routes (Admin only)

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAdmin } from "../middleware/auth.tsx";

const users = new Hono<{ Variables: { userId: string } }>();

// 전체 사용자 목록 조회
users.get("/", requireAdmin, async (c) => {
  try {
    const { data, error } = await db
      .from('users')
      .select('id, email, name, student_id, role, provider, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ success: false, error: "Failed to fetch users" }, 500);
    }

    const formatted = data?.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      studentId: u.student_id,
      role: u.role,
      provider: u.provider,
      createdAt: u.created_at,
    })) || [];

    return c.json({ success: true, data: formatted });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to fetch users" }, 500);
  }
});

// 사용자 기본 정보 변경
users.put("/:id", requireAdmin, async (c) => {
  try {
    const targetId = c.req.param("id");
    const adminId = c.get('userId');
    const { name } = await c.req.json();

    const nextName = typeof name === "string" ? name.trim() : "";
    if (!nextName) {
      return c.json({ success: false, error: "이름을 입력해주세요" }, 400);
    }

    if (nextName.length > 50) {
      return c.json({ success: false, error: "이름은 50자 이하로 입력해주세요" }, 400);
    }

    const { data: updated, error } = await db
      .from('users')
      .update({ name: nextName })
      .eq('id', targetId)
      .select('id, email, name, student_id, role, provider, created_at')
      .single();

    if (error || !updated) {
      return c.json({ success: false, error: "Failed to update user" }, 500);
    }

    await db.from('admin_action_logs').insert({
      admin_id: adminId,
      action: 'user_name_updated',
      target_type: 'user',
      target_id: targetId,
    });

    return c.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        studentId: updated.student_id,
        role: updated.role,
        provider: updated.provider,
        createdAt: updated.created_at,
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to update user" }, 500);
  }
});

// 사용자 역할 변경
users.put("/:id/role", requireAdmin, async (c) => {
  try {
    const targetId = c.req.param("id");
    const adminId = c.get('userId');
    const { role } = await c.req.json();

    if (!['user', 'admin', 'driver'].includes(role)) {
      return c.json({ success: false, error: "Invalid role. Must be user, admin, or driver" }, 400);
    }

    // 자기 자신의 역할은 변경 불가
    if (targetId === adminId) {
      return c.json({ success: false, error: "자신의 역할은 변경할 수 없습니다" }, 400);
    }

    const { data: target } = await db
      .from('users')
      .select('id, name, role')
      .eq('id', targetId)
      .single();

    if (!target) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    // driver → 다른 역할로 변경 시 운행 중이면 자동 종료
    if (role !== 'driver') {
      const { data: drivenBuses, error: busesError } = await db
        .from('buses')
        .select('id, is_running, current_driver_id')
        .or(`current_driver_id.eq.${targetId},assigned_driver_id.eq.${targetId}`);

      if (busesError) {
        return c.json({ success: false, error: "Failed to verify the driver's active buses" }, 500);
      }

      for (const bus of drivenBuses || []) {
        if (bus.is_running && bus.current_driver_id === targetId) {
          const { error: stopError } = await db.rpc('admin_force_stop_bus', { target_bus_id: bus.id });
          if (stopError) {
            return c.json({ success: false, error: "운행 종료 후 역할을 변경해 주세요" }, 409);
          }
        }
      }

      const { error: unassignError } = await db
        .from('buses')
        .update({ current_driver_id: null, assigned_driver_id: null })
        .or(`current_driver_id.eq.${targetId},assigned_driver_id.eq.${targetId}`);
      if (unassignError) {
        return c.json({ success: false, error: "Failed to clear driver assignments" }, 500);
      }
    }

    const { error: updateError } = await db
      .from('users')
      .update({ role })
      .eq('id', targetId);

    if (updateError) {
      return c.json({ success: false, error: "Failed to update role" }, 500);
    }

    console.log(`✅ Role updated for user ${target.id} → ${role}`);

    await db.from('admin_action_logs').insert({
      admin_id: adminId,
      action: 'user_role_updated',
      target_type: 'user',
      target_id: targetId,
      metadata: { previousRole: target.role, role },
    });

    return c.json({ success: true, data: { id: targetId, role } });
  } catch (error: any) {
    return c.json({ success: false, error: "Failed to update role" }, 500);
  }
});

export default users;
