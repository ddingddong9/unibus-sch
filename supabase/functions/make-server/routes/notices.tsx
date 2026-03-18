// Notice Routes (관계형 DB 버전 - JOIN 쿼리)

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAuth, requireAdmin } from "../middleware/auth.tsx";
import { CreateNoticeRequest } from "../types/index.tsx";

const notices = new Hono();

// Get all notices (public) - JOIN으로 작성자 정보 포함
notices.get("/", async (c) => {
  try {
    // notices_with_author 뷰 사용 (JOIN 쿼리 최적화)
    const { data: allNotices, error } = await db
      .from('notices_with_author')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Get notices error:", error);
      return c.json({ success: false, error: "Failed to fetch notices" }, 500);
    }

    // 프론트엔드 호환성을 위해 필드명 변환
    const formattedNotices = allNotices?.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      isPinned: notice.is_pinned,
      viewCount: notice.view_count,
      authorId: notice.author_id,
      authorName: notice.author_name,
      createdAt: notice.created_at,
      updatedAt: notice.updated_at,
    })) || [];

    console.log(`✅ Fetched ${formattedNotices.length} notices`);

    return c.json({ success: true, data: formattedNotices });
  } catch (error: any) {
    console.error("❌ Get notices error:", error);
    return c.json({ success: false, error: "Failed to fetch notices" }, 500);
  }
});

// Get single notice - JOIN으로 작성자 정보 포함
notices.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // notices_with_author 뷰에서 조회
    const { data: notice, error } = await db
      .from('notices_with_author')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !notice) {
      return c.json({ success: false, error: "Notice not found" }, 404);
    }

    // 조회수 증가
    await db
      .from('notices')
      .update({ view_count: notice.view_count + 1 })
      .eq('id', id);

    // 프론트엔드 호환성을 위해 필드명 변환
    const formattedNotice = {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      isPinned: notice.is_pinned,
      viewCount: notice.view_count + 1,
      authorId: notice.author_id,
      authorName: notice.author_name,
      createdAt: notice.created_at,
      updatedAt: notice.updated_at,
    };

    console.log(`✅ Fetched notice: ${id}`);

    return c.json({ success: true, data: formattedNotice });
  } catch (error: any) {
    console.error("❌ Get notice error:", error);
    return c.json({ success: false, error: "Failed to fetch notice" }, 500);
  }
});

// Create notice (admin only)
notices.post("/", requireAdmin, async (c) => {
  try {
    const { title, content, category, priority }: CreateNoticeRequest = await c.req.json();
    
    if (!title || !content) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const userId = c.get('userId');

    // 공지사항 생성 (관계형 DB)
    const { data: notice, error: insertError } = await db
      .from('notices')
      .insert({
        title,
        content,
        category: category || 'general',
        priority: priority || 'medium',
        author_id: userId,
      })
      .select('*')
      .single();

    if (insertError || !notice) {
      console.error("❌ Notice creation error:", insertError);
      return c.json({ success: false, error: "Failed to create notice" }, 500);
    }

    // 작성자 정보 조회
    const { data: author } = await db
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    // 프론트엔드 호환성을 위해 필드명 변환
    const formattedNotice = {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      isPinned: notice.is_pinned,
      viewCount: notice.view_count,
      authorId: notice.author_id,
      authorName: author?.name || 'Admin',
      createdAt: notice.created_at,
      updatedAt: notice.updated_at,
    };
    
    console.log(`✅ Notice created: ${notice.id} by ${userId}`);

    return c.json({ success: true, data: formattedNotice });
  } catch (error: any) {
    console.error("❌ Create notice error:", error);
    return c.json({ success: false, error: "Failed to create notice" }, 500);
  }
});

// Update notice (admin only)
notices.put("/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    // 공지사항 존재 여부 확인
    const { data: existingNotice } = await db
      .from('notices')
      .select('id')
      .eq('id', id)
      .single();
    
    if (!existingNotice) {
      return c.json({ success: false, error: "Notice not found" }, 404);
    }

    // snake_case로 변환
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.content) dbUpdates.content = updates.content;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;

    // 공지사항 수정 (관계형 DB)
    const { data: updatedNotice, error: updateError } = await db
      .from('notices')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updatedNotice) {
      console.error("❌ Notice update error:", updateError);
      return c.json({ success: false, error: "Failed to update notice" }, 500);
    }

    // 작성자 정보 조회
    const { data: author } = await db
      .from('users')
      .select('name')
      .eq('id', updatedNotice.author_id)
      .single();

    // 프론트엔드 호환성을 위해 필드명 변환
    const formattedNotice = {
      id: updatedNotice.id,
      title: updatedNotice.title,
      content: updatedNotice.content,
      category: updatedNotice.category,
      priority: updatedNotice.priority,
      isPinned: updatedNotice.is_pinned,
      viewCount: updatedNotice.view_count,
      authorId: updatedNotice.author_id,
      authorName: author?.name || 'Admin',
      createdAt: updatedNotice.created_at,
      updatedAt: updatedNotice.updated_at,
    };
    
    console.log(`✅ Notice updated: ${id}`);

    return c.json({ success: true, data: formattedNotice });
  } catch (error: any) {
    console.error("❌ Update notice error:", error);
    return c.json({ success: false, error: "Failed to update notice" }, 500);
  }
});

// Delete notice (admin only)
notices.delete("/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    
    // 공지사항 존재 여부 확인
    const { data: existingNotice } = await db
      .from('notices')
      .select('id')
      .eq('id', id)
      .single();
    
    if (!existingNotice) {
      return c.json({ success: false, error: "Notice not found" }, 404);
    }

    // 공지사항 삭제 (관계형 DB)
    const { error: deleteError } = await db
      .from('notices')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("❌ Notice deletion error:", deleteError);
      return c.json({ success: false, error: "Failed to delete notice" }, 500);
    }
    
    console.log(`✅ Notice deleted: ${id}`);

    return c.json({ success: true, message: "Notice deleted successfully" });
  } catch (error: any) {
    console.error("❌ Delete notice error:", error);
    return c.json({ success: false, error: "Failed to delete notice" }, 500);
  }
});

export default notices;
