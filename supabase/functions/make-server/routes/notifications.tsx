// Background notification routes.

import { Hono } from "npm:hono";
import webpush from "npm:web-push";
import { db } from "../db.tsx";
import { requireAdmin, requireAuth } from "../middleware/auth.tsx";

const notifications = new Hono<{ Variables: { userId: string } }>();
const validTargets = new Set(["all", "campus", "commuter", "system"]);

const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@sch.ac.kr";

const targetCategory: Record<string, "general" | "route" | "system"> = {
  all: "general",
  campus: "route",
  commuter: "route",
  system: "system",
};

const formatNotice = (notice: any, authorName = "Admin") => ({
  id: notice.id,
  title: notice.title,
  content: notice.content,
  category: notice.category,
  priority: notice.priority,
  isPinned: notice.is_pinned,
  viewCount: notice.view_count,
  authorId: notice.author_id,
  authorName,
  imageUrls: notice.image_urls ?? [],
  contentBelow: notice.content_below ?? "",
  createdAt: notice.created_at,
  updatedAt: notice.updated_at,
});

const getTargetUserIds = async (target: string) => {
  let query = db.from("users").select("id, role");

  if (target === "campus") {
    query = query.in("role", ["user", "driver"]);
  } else if (target === "commuter") {
    query = query.eq("role", "user");
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((user) => user.id);
};

const sendPushNotifications = async (target: string, payload: Record<string, unknown>) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("⚠️ VAPID keys are not configured. Skipping background push.");
    return { attempted: 0, sent: 0, failed: 0 };
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const targetUserIds = await getTargetUserIds(target);
  if (targetUserIds.length === 0) return { attempted: 0, sent: 0, failed: 0 };

  const { data: subscriptions, error } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("enabled", true)
    .in("user_id", targetUserIds);

  if (error || !subscriptions?.length) {
    if (error) console.error("❌ Push subscription query error:", error);
    return { attempted: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (error: any) {
      failed += 1;
      const statusCode = error?.statusCode || error?.status;
      await db
        .from("push_subscriptions")
        .update({
          enabled: statusCode === 404 || statusCode === 410 ? false : true,
          last_error: error?.message || "Push send failed",
        })
        .eq("id", subscription.id);
    }
  }));

  return { attempted: subscriptions.length, sent, failed };
};

const recordDelivery = async (noticeId: string, target: string, result: { attempted: number; sent: number; failed: number }, adminId: string) => {
  const { error } = await db.from("notification_deliveries").insert({
    notice_id: noticeId,
    target,
    attempted: result.attempted,
    sent: result.sent,
    failed: result.failed,
    created_by: adminId,
  });
  if (error) console.error("❌ Notification delivery history error:", error);
};

notifications.get("/vapid-public-key", async (c) => {
  return c.json({ success: true, data: { publicKey: vapidPublicKey } });
});

notifications.post("/subscribe", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { subscription } = await c.req.json();
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return c.json({ success: false, error: "Invalid push subscription" }, 400);
    }

    const { data, error } = await db
      .from("push_subscriptions")
      .upsert({
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: c.req.header("user-agent") || null,
        enabled: true,
        last_error: null,
      }, { onConflict: "endpoint" })
      .select("id")
      .single();

    if (error) {
      console.error("❌ Push subscribe error:", error);
      return c.json({ success: false, error: "Failed to save push subscription" }, 500);
    }

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("❌ Push subscribe error:", error);
    return c.json({ success: false, error: "Failed to save push subscription" }, 500);
  }
});

notifications.post("/unsubscribe", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { endpoint } = await c.req.json();

    if (!endpoint) {
      return c.json({ success: false, error: "endpoint is required" }, 400);
    }

    await db
      .from("push_subscriptions")
      .update({ enabled: false })
      .eq("user_id", userId)
      .eq("endpoint", endpoint);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("❌ Push unsubscribe error:", error);
    return c.json({ success: false, error: "Failed to disable push subscription" }, 500);
  }
});

notifications.post("/send", requireAdmin, async (c) => {
  try {
    const userId = c.get("userId");
    const { title, message, target = "all" } = await c.req.json();

    if (!title || !message) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }
    if (!validTargets.has(target)) return c.json({ success: false, error: "Invalid notification target" }, 400);

    const category = targetCategory[target] || "general";
    const priority = category === "system" ? "high" : "medium";

    const { data: notice, error: insertError } = await db
      .from("notices")
      .insert({
        title,
        content: message,
        category,
        priority,
        author_id: userId,
        image_urls: [],
        content_below: "",
      })
      .select("*")
      .single();

    if (insertError || !notice) {
      console.error("❌ Notification notice creation error:", insertError);
      return c.json({ success: false, error: "Failed to create notification" }, 500);
    }

    const { data: author } = await db
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    const formattedNotice = formatNotice(notice, author?.name || "Admin");
    const pushResult = await sendPushNotifications(target, {
      title: formattedNotice.title,
      body: formattedNotice.content,
      url: "/notice",
      noticeId: formattedNotice.id,
      createdAt: formattedNotice.createdAt,
    });
    await recordDelivery(formattedNotice.id, target, pushResult, userId);

    return c.json({ success: true, data: { notice: formattedNotice, push: pushResult } });
  } catch (error: any) {
    console.error("❌ Notification send error:", error);
    return c.json({ success: false, error: "Failed to send notification" }, 500);
  }
});

notifications.post("/send-existing", requireAdmin, async (c) => {
  try {
    const adminId = c.get("userId");
    const { noticeId, target = "all" } = await c.req.json();
    if (!noticeId || !validTargets.has(target)) {
      return c.json({ success: false, error: "공지와 발송 대상을 확인해 주세요" }, 400);
    }

    const { data: notice, error } = await db.from("notices").select("*").eq("id", noticeId).single();
    if (error || !notice) return c.json({ success: false, error: "공지를 찾을 수 없습니다" }, 404);

    const push = await sendPushNotifications(target, {
      title: notice.title,
      body: notice.content,
      url: "/notice",
      noticeId: notice.id,
      createdAt: notice.created_at,
    });
    await recordDelivery(notice.id, target, push, adminId);
    await db.from("admin_action_logs").insert({
      admin_id: adminId,
      action: "notice_push_sent",
      target_type: "notice",
      target_id: notice.id,
      metadata: { target, ...push },
    });
    return c.json({ success: true, data: push });
  } catch (error) {
    console.error("❌ Existing notice push error:", error);
    return c.json({ success: false, error: "푸시 발송에 실패했습니다" }, 500);
  }
});

notifications.get("/history", requireAdmin, async (c) => {
  try {
    const { data, error } = await db.from("notification_deliveries")
      .select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    const noticeIds = [...new Set((data || []).map((item: any) => item.notice_id).filter(Boolean))];
    const { data: notices } = noticeIds.length
      ? await db.from("notices").select("id, title").in("id", noticeIds)
      : { data: [] };
    const titleById = new Map((notices || []).map((notice: any) => [notice.id, notice.title]));
    return c.json({ success: true, data: (data || []).map((item: any) => ({
      id: item.id,
      noticeId: item.notice_id,
      noticeTitle: titleById.get(item.notice_id) || "삭제된 공지",
      target: item.target,
      attempted: item.attempted,
      sent: item.sent,
      failed: item.failed,
      createdAt: item.created_at,
    })) });
  } catch (error) {
    console.error("❌ Notification history error:", error);
    return c.json({ success: false, error: "발송 이력을 불러오지 못했습니다" }, 500);
  }
});

export default notifications;
