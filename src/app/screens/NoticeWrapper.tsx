import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import type { Notice } from "../types";
import { NoticeSkeleton } from "../components/SkeletonLoaders";

const listContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
};

export default function NoticeWrapper() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNotices();
      setNotices(data);
    } catch (err) {
      console.error("Failed to load notices:", err);
      setError(err instanceof Error ? err.message : "공지사항을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = selectedCategory === "all" 
    ? notices 
    : notices.filter(n => n.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "route": return "bg-[#3b82f6] text-white";
      case "system": return "bg-[#f59e0b] text-white";
      case "general": return "bg-[#10b981] text-white";
      case "lost": return "bg-[#f97316] text-white";
      default: return "bg-[#64748b] text-white";
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { ko: string; en: string }> = {
      route: { ko: "운행정보", en: "Route" },
      system: { ko: "시스템", en: "System" },
      general: { ko: "일반", en: "General" },
      lost: { ko: "분실물", en: "Lost & Found" },
    };
    return language === "ko" ? (labels[category]?.ko || category) : (labels[category]?.en || category);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isNew = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays < 3; // New if less than 3 days old
  };

  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-start relative size-full">
      <div className="bg-white content-stretch flex flex-col items-start overflow-auto pb-[120px] relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full" style={{ height: '100dvh' }}>
        {/* Header */}
        <div className="sticky top-0 z-30 w-full pt-safe">
          <div className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] flex items-center justify-between pb-[12px] pt-[16px] px-[16px] w-full">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center justify-center size-[40px] hover:bg-gray-100 rounded-full active:scale-95 transition-all"
            >
              <svg className="w-3 h-5" fill="none" viewBox="0 0 12 20" stroke="#0F172A" strokeWidth="2">
                <path d="M11 1L1 10L11 19" />
              </svg>
            </button>

            <div className="flex flex-col items-center">
              <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px] leading-[22.5px]">{t("공지사항", "Notice")}</p>
              <p className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[10px] leading-[15px] tracking-[1px] uppercase">
                {t("업데이트 및 공지", "Updates & Announcements")}
              </p>
            </div>

            <div className="w-[40px]" />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 px-[16px] py-[12px] overflow-x-auto scrollbar-hide border-b border-[#f1f5f9]">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-[9999px] font-['Public_Sans'] font-semibold text-[12px] whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-[#1e3a8a] text-white"
                  : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
              }`}
            >
              {t("전체", "All")}
            </button>
            <button
              onClick={() => setSelectedCategory("route")}
              className={`px-4 py-2 rounded-[9999px] font-['Public_Sans'] font-semibold text-[12px] whitespace-nowrap transition-all ${
                selectedCategory === "route"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
              }`}
            >
              {t("운행정보", "Route")}
            </button>
            <button
              onClick={() => setSelectedCategory("general")}
              className={`px-4 py-2 rounded-[9999px] font-['Public_Sans'] font-semibold text-[12px] whitespace-nowrap transition-all ${
                selectedCategory === "general"
                  ? "bg-[#10b981] text-white"
                  : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
              }`}
            >
              {t("일반", "General")}
            </button>
            <button
              onClick={() => setSelectedCategory("system")}
              className={`px-4 py-2 rounded-[9999px] font-['Public_Sans'] font-semibold text-[12px] whitespace-nowrap transition-all ${
                selectedCategory === "system"
                  ? "bg-[#f59e0b] text-white"
                  : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
              }`}
            >
              {t("시스템", "System")}
            </button>
            <button
              onClick={() => setSelectedCategory("lost")}
              className={`px-4 py-2 rounded-[9999px] font-['Public_Sans'] font-semibold text-[12px] whitespace-nowrap transition-all ${
                selectedCategory === "lost"
                  ? "bg-[#f97316] text-white"
                  : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
              }`}
            >
              {t("분실물", "Lost & Found")}
            </button>
          </div>
        </div>

        {/* Notice List */}
        <div className="flex-1 w-full px-[16px] py-[16px] space-y-3 overflow-y-auto scrollbar-hide">
          {loading ? (
            <motion.div
              key="notice-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <NoticeSkeleton />
            </motion.div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-[#fee2e2] rounded-full p-6 mb-4">
                <svg className="w-12 h-12 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
              </div>
              <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] mb-1">{t("불러오기 실패", "Failed to load")}</p>
              <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[14px] mb-4">{error}</p>
              <button
                onClick={loadNotices}
                className="bg-[#1e3a8a] text-white px-6 py-2 rounded-[9999px] font-['Public_Sans'] font-semibold text-[14px] hover:bg-[#1e40af] active:scale-95 transition-all"
              >
                {t("다시 시도", "Retry")}
              </button>
            </div>
          ) : (
            <>
              <motion.div
                key={selectedCategory}
                variants={listContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {filteredNotices.map((notice) => (
                  <motion.button
                    key={notice.id}
                    variants={listItem}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[16px] p-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-[4px] font-['Public_Sans'] font-bold text-[10px] uppercase ${getCategoryColor(notice.category)}`}>
                            {getCategoryLabel(notice.category)}
                          </span>
                          {isNew(notice.createdAt) && (
                            <span className="bg-[#ef4444] text-white px-2 py-1 rounded-[4px] font-['Public_Sans'] font-bold text-[10px] uppercase">
                              NEW
                            </span>
                          )}
                        </div>
                        <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] leading-[24px] mb-1">
                          {notice.title}
                        </h3>
                        <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[12px] leading-[16px]">
                          {formatDate(notice.createdAt)}
                        </p>
                      </div>
                      <motion.svg
                        animate={{ rotate: expandedNotice === notice.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-5 h-5 text-[#64748b] shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </div>

                    <AnimatePresence>
                      {expandedNotice === notice.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
                            <p className="font-['Public_Sans'] font-normal text-[#475569] text-[14px] leading-[22px]">
                              {notice.content}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </motion.div>

              {filteredNotices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-[#f1f5f9] rounded-full p-6 mb-4">
                    <svg className="w-12 h-12 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] mb-1">{t("공지사항 없음", "No notices")}</p>
                  <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[14px]">
                    {t("현재 공지사항이 없습니다", "No notices at the moment")}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}