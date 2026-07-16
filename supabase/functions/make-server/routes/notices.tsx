// Notice Routes (관계형 DB 버전 - JOIN 쿼리)

import { Hono } from "npm:hono";
import { db } from "../db.tsx";
import { requireAdmin } from "../middleware/auth.tsx";
import { CreateNoticeRequest } from "../types/index.tsx";

const notices = new Hono<{ Variables: { userId: string } }>();
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_NOTICE_IMAGES = 10;
const validCategories = new Set(['general', 'route', 'system', 'lost']);
const validPriorities = new Set(['low', 'medium', 'high', 'urgent']);
const imageExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

const hasValidImageSignature = (mimeType: string, bytes: Uint8Array) => {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    .every((value, index) => bytes[index] === value);
  if (mimeType === 'image/gif') {
    const header = new TextDecoder().decode(bytes.slice(0, 6));
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (mimeType === 'image/webp') {
    return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF'
      && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  }
  return false;
};

const normalizeImageUrls = (value: unknown) => {
  if (!Array.isArray(value) || value.length > MAX_NOTICE_IMAGES) return null;

  const supabaseUrl = Deno.env.get('DB_URL') || Deno.env.get('SUPABASE_URL') || '';
  let storageOrigin = '';
  try {
    storageOrigin = new URL(supabaseUrl).origin;
  } catch {
    return null;
  }

  const urls: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.length > 2048) return null;
    try {
      const url = new URL(item);
      if (url.origin !== storageOrigin
        || !url.pathname.startsWith('/storage/v1/object/public/notice-images/')) return null;
      urls.push(url.href);
    } catch {
      return null;
    }
  }
  return urls;
};

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
      imageUrls: notice.image_urls ?? [],
      contentBelow: notice.content_below ?? '',
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
      imageUrls: notice.image_urls ?? [],
      contentBelow: notice.content_below ?? '',
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

// Upload notice image (admin only)
notices.post("/images", requireAdmin, async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      return c.json({ success: false, error: "Image file is required" }, 400);
    }

    const extension = imageExtensions.get(file.type);
    if (!extension) {
      return c.json({ success: false, error: "JPEG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다" }, 400);
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return c.json({ success: false, error: "이미지는 5MB 이하여야 합니다" }, 413);
    }

    const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!hasValidImageSignature(file.type, signature)) {
      return c.json({ success: false, error: "파일 형식과 실제 이미지 내용이 일치하지 않습니다" }, 400);
    }

    const filename = `${Date.now()}_${crypto.randomUUID()}.${extension}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from("notice-images")
      .upload(filename, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Notice image upload error:", uploadError);
      return c.json({ success: false, error: "Failed to upload image" }, 500);
    }

    const { data } = db.storage
      .from("notice-images")
      .getPublicUrl(filename);

    return c.json({ success: true, data: { url: data.publicUrl } });
  } catch (error: any) {
    console.error("❌ Notice image upload error:", error);
    return c.json({ success: false, error: "Failed to upload image" }, 500);
  }
});

// Create notice (admin only)
notices.post("/", requireAdmin, async (c) => {
  try {
    const { title, content, category, priority, imageUrls, contentBelow, isPinned }: CreateNoticeRequest & { isPinned?: boolean } = await c.req.json();

    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedContent = typeof content === 'string' ? content.trim() : '';
    const normalizedContentBelow = typeof contentBelow === 'string' ? contentBelow.trim() : '';
    const normalizedCategory = category || 'general';
    const normalizedPriority = priority || 'medium';
    const normalizedImages = normalizeImageUrls(imageUrls ?? []);

    if (!normalizedTitle || !normalizedContent) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }
    if (normalizedTitle.length > 255 || normalizedContent.length > 20_000 || normalizedContentBelow.length > 20_000) {
      return c.json({ success: false, error: "공지 내용이 허용 길이를 초과했습니다" }, 400);
    }
    if (!validCategories.has(normalizedCategory) || !validPriorities.has(normalizedPriority)) {
      return c.json({ success: false, error: "공지 분류 또는 중요도가 올바르지 않습니다" }, 400);
    }
    if (!normalizedImages) {
      return c.json({ success: false, error: "공지 이미지는 전용 저장소의 이미지 10개까지만 사용할 수 있습니다" }, 400);
    }
    if (isPinned !== undefined && typeof isPinned !== 'boolean') {
      return c.json({ success: false, error: "Invalid pinned state" }, 400);
    }

    const userId = c.get('userId');

    // 공지사항 생성 (관계형 DB)
    const { data: notice, error: insertError } = await db
      .from('notices')
      .insert({
        title: normalizedTitle,
        content: normalizedContent,
        category: normalizedCategory,
        priority: normalizedPriority,
        author_id: userId,
        is_pinned: isPinned ?? false,
        image_urls: normalizedImages,
        content_below: normalizedContentBelow,
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
      imageUrls: notice.image_urls ?? [],
      contentBelow: notice.content_below ?? '',
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
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || !updates.title.trim() || updates.title.trim().length > 255) {
        return c.json({ success: false, error: "Invalid notice title" }, 400);
      }
      dbUpdates.title = updates.title.trim();
    }
    if (updates.content !== undefined) {
      if (typeof updates.content !== 'string' || !updates.content.trim() || updates.content.trim().length > 20_000) {
        return c.json({ success: false, error: "Invalid notice content" }, 400);
      }
      dbUpdates.content = updates.content.trim();
    }
    if (updates.category !== undefined) {
      if (!validCategories.has(updates.category)) return c.json({ success: false, error: "Invalid notice category" }, 400);
      dbUpdates.category = updates.category;
    }
    if (updates.priority !== undefined) {
      if (!validPriorities.has(updates.priority)) return c.json({ success: false, error: "Invalid notice priority" }, 400);
      dbUpdates.priority = updates.priority;
    }
    if (updates.isPinned !== undefined) {
      if (typeof updates.isPinned !== 'boolean') return c.json({ success: false, error: "Invalid pinned state" }, 400);
      dbUpdates.is_pinned = updates.isPinned;
    }
    if (updates.imageUrls !== undefined) {
      const imageUrls = normalizeImageUrls(updates.imageUrls);
      if (!imageUrls) return c.json({ success: false, error: "Invalid notice images" }, 400);
      dbUpdates.image_urls = imageUrls;
    }
    if (updates.contentBelow !== undefined) {
      if (typeof updates.contentBelow !== 'string' || updates.contentBelow.length > 20_000) {
        return c.json({ success: false, error: "Invalid notice content" }, 400);
      }
      dbUpdates.content_below = updates.contentBelow.trim();
    }

    if (Object.keys(dbUpdates).length === 0) {
      return c.json({ success: false, error: "No valid updates provided" }, 400);
    }

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
      imageUrls: updatedNotice.image_urls ?? [],
      contentBelow: updatedNotice.content_below ?? '',
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
