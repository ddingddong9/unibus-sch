import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, ImageIcon, Inbox, Pin, RefreshCw, X } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { NoticeSkeleton } from "../components/SkeletonLoaders";
import UserPageHeader from "../components/UserPageHeader";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import type { Notice } from "../types";
import { clearUnreadNoticeCount, setLastNoticeSeenAt } from "../utils/notificationPreferences";

const categories = ["all", "route", "general", "system", "lost"] as const;
type Category = (typeof categories)[number];

const categoryStyle: Record<Exclude<Category, "all">, { dot: string; badge: string }> = {
  route: { dot: "bg-[#2563eb]", badge: "bg-[#e8f0ff] text-[#1d4ed8]" },
  general: { dot: "bg-[#059669]", badge: "bg-[#e8f8f1] text-[#087f5b]" },
  system: { dot: "bg-[#d97706]", badge: "bg-[#fff4dc] text-[#a16207]" },
  lost: { dot: "bg-[#ea580c]", badge: "bg-[#fff0e8] text-[#c2410c]" },
};

export default function NoticeWrapper() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNotices();
      const sorted = [...data].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setNotices(sorted);
      if (sorted[0]?.createdAt) setLastNoticeSeenAt(sorted[0].createdAt);
      clearUnreadNoticeCount();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("공지사항을 불러오지 못했습니다", "Unable to load notices"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const filteredNotices = useMemo(
    () => selectedCategory === "all" ? notices : notices.filter((notice) => notice.category === selectedCategory),
    [notices, selectedCategory],
  );

  const categoryLabel = (category: Category) => {
    const labels: Record<Category, [string, string]> = {
      all: ["전체", "All"],
      route: ["운행", "Route"],
      general: ["일반", "General"],
      system: ["시스템", "System"],
      lost: ["분실물", "Lost"],
    };
    return t(...labels[category]);
  };

  const formatDate = (dateString: string) => new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    year: new Date(dateString).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  }).format(new Date(dateString));

  const isNew = (dateString: string) => Date.now() - new Date(dateString).getTime() < 3 * 86_400_000;

  return (
    <div className="relative size-full bg-[#f4f6f9]">
      <main className="h-[100dvh] overflow-y-auto pb-[112px] scrollbar-hide">
        <UserPageHeader
          title={t("공지사항", "Notices")}
          subtitle={t("운행 변경과 서비스 소식", "Service and route updates")}
          action={<Bell size={21} className="text-[#1e3a8a]" />}
        />

        <div className="border-b border-[#e3e8ef] bg-[#f4f6f9] px-4 py-3">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-[#e5eaf0] p-1 scrollbar-hide">
            {categories.map((category) => {
              const count = category === "all" ? notices.length : notices.filter((notice) => notice.category === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setExpandedNotice(null);
                  }}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 font-['Public_Sans'] text-[12px] font-bold transition-colors ${selectedCategory === category ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"}`}
                >
                  {categoryLabel(category)}
                  {count > 0 && <span className={`text-[10px] ${selectedCategory === category ? "text-[#1e3a8a]" : "text-[#94a3b8]"}`}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          {loading ? <NoticeSkeleton /> : error ? (
            <div className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
              <RefreshCw size={28} className="mx-auto mb-3 text-[#ef4444]" />
              <p className="font-['Public_Sans'] text-[15px] font-bold text-[#0f172a]">{t("공지를 불러오지 못했습니다", "Unable to load notices")}</p>
              <p className="mt-1 break-words font-['Public_Sans'] text-[12px] text-[#64748b]">{error}</p>
              <button type="button" onClick={loadNotices} className="mt-5 h-10 rounded-lg bg-[#1e3a8a] px-5 font-['Public_Sans'] text-[13px] font-bold text-white">{t("다시 시도", "Retry")}</button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredNotices.map((notice) => {
                const expanded = expandedNotice === notice.id;
                const style = categoryStyle[notice.category];
                return (
                  <motion.article
                    layout
                    key={notice.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className={`overflow-hidden rounded-lg border bg-white ${notice.isPinned ? "border-[#b8c8e8] shadow-[0_4px_16px_rgba(30,58,138,0.08)]" : "border-[#dfe5ec]"}`}
                  >
                    <button type="button" onClick={() => setExpandedNotice(expanded ? null : notice.id)} className="w-full px-4 py-4 text-left active:bg-[#f8fafc]">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 size-2.5 shrink-0 rounded-full ${style.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded px-1.5 py-0.5 font-['Public_Sans'] text-[10px] font-bold ${style.badge}`}>{categoryLabel(notice.category)}</span>
                            {notice.isPinned && <span className="flex items-center gap-1 rounded bg-[#edf2ff] px-1.5 py-0.5 font-['Public_Sans'] text-[10px] font-bold text-[#1e3a8a]"><Pin size={10} fill="currentColor" />{t("중요", "Pinned")}</span>}
                            {isNew(notice.createdAt) && <span className="rounded bg-[#ef4444] px-1.5 py-0.5 font-['Public_Sans'] text-[10px] font-bold text-white">NEW</span>}
                          </div>
                          <h2 className="font-['Public_Sans'] text-[15px] font-bold leading-6 text-[#0f172a]">{notice.title}</h2>
                          <div className="mt-1 flex items-center gap-2 font-['Public_Sans'] text-[11px] text-[#94a3b8]">
                            <span>{formatDate(notice.createdAt)}</span>
                            {notice.imageUrls && notice.imageUrls.length > 0 && <span className="flex items-center gap-1"><ImageIcon size={12} />{notice.imageUrls.length}</span>}
                          </div>
                        </div>
                        <ChevronDown size={18} className={`mt-1 shrink-0 text-[#94a3b8] transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="mx-4 border-t border-[#edf1f5] pb-5 pt-4">
                            <p className="whitespace-pre-wrap font-['Public_Sans'] text-[14px] leading-6 text-[#334155]">{notice.content}</p>
                            {notice.imageUrls && notice.imageUrls.length > 0 && (
                              <div className={`mt-4 grid gap-2 ${notice.imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                                {notice.imageUrls.map((url, index) => (
                                  <button key={url} type="button" onClick={() => setLightboxImage(url)} className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f1f5f9]">
                                    <img src={url} alt={t(`공지 첨부 이미지 ${index + 1}`, `Notice image ${index + 1}`)} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                            {notice.contentBelow && <p className="mt-4 whitespace-pre-wrap font-['Public_Sans'] text-[14px] leading-6 text-[#475569]">{notice.contentBelow}</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}

          {!loading && !error && filteredNotices.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-white px-6 py-14 text-center">
              <Inbox size={30} className="mx-auto mb-3 text-[#94a3b8]" />
              <p className="font-['Public_Sans'] text-[15px] font-bold text-[#0f172a]">{t("아직 공지가 없습니다", "No notices yet")}</p>
              <p className="mt-1 font-['Public_Sans'] text-[12px] text-[#64748b]">{t("새 소식이 등록되면 이곳에 표시됩니다", "New updates will appear here")}</p>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxImage(null)}>
            <motion.img initial={{ scale: 0.96 }} animate={{ scale: 1 }} src={lightboxImage} alt={t("확대된 공지 이미지", "Expanded notice image")} className="max-h-full max-w-full rounded-lg object-contain" onClick={(event) => event.stopPropagation()} />
            <button type="button" aria-label={t("닫기", "Close")} onClick={() => setLightboxImage(null)} className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur"><X size={22} /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
