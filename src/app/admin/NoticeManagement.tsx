import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Search, ImagePlus, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";
import type { Notice } from "../types";

export default function NoticeManagement() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general" as Notice["category"],
    priority: "medium" as Notice["priority"],
    imageUrls: [] as string[],
    contentBelow: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const data = await api.getNotices();
      setNotices(data);
    } catch (error) {
      console.error("Failed to load notices:", error);
    }
  };

  const handleCreate = () => {
    setEditingNotice(null);
    setFormData({ title: "", content: "", category: "general", priority: "medium", imageUrls: [], contentBelow: "" });
    setShowModal(true);
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      imageUrls: notice.imageUrls ?? [],
      contentBelow: notice.contentBelow ?? "",
    });
    setShowModal(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(files.map(f => api.uploadNoticeImage(f)));
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...uploaded] }));
    } catch {
      alert("이미지 업로드 실패. 다시 시도해주세요.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      if (editingNotice) {
        const updated = await api.updateNotice(editingNotice.id, formData);
        setNotices(notices.map(n => n.id === editingNotice.id ? updated : n));
      } else {
        const newNotice = await api.createNotice(formData);
        setNotices([newNotice, ...notices]);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save notice:", error);
      alert("Failed to save notice");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("이 공지사항을 삭제하시겠습니까?")) {
      try {
        await api.deleteNotice(id);
        setNotices(notices.filter(n => n.id !== id));
      } catch (error) {
        console.error("Failed to delete notice:", error);
        alert("Failed to delete notice");
      }
    }
  };

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryLabel: Record<Notice["category"], string> = {
    general: "일반",
    route: "운행정보",
    system: "시스템",
    lost: "분실물",
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">
              공지사항 관리
            </h1>
            <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
              총 {notices.length}개의 공지사항
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-[#1e3b8a] text-white font-['Public_Sans'] font-semibold text-[15px] rounded-lg hover:bg-[#1e3b8a]/90 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            새 공지사항
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="공지사항 검색..."
              className="w-full h-[48px] pl-12 pr-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] w-[50%]">제목</th>
                <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] w-[15%]">카테고리</th>
                <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] w-[15%]">작성일</th>
                <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] w-[10%]">상태</th>
                <th className="px-6 py-4 text-center font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] w-[10%]">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotices.map((notice) => (
                <tr key={notice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-['Public_Sans'] font-medium text-[#0f172a] text-[15px]">
                      {notice.title}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 bg-[#1e3b8a]/10 text-[#1e3b8a] rounded-full font-['Public_Sans'] text-[13px] font-medium">
                      {categoryLabel[notice.category] ?? notice.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-['Public_Sans'] text-[#64748b] text-[14px]">
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full font-['Public_Sans'] text-[13px] font-medium ${notice.isPinned ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {notice.isPinned ? "고정됨" : "게시중"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(notice)}
                        className="p-2 text-[#1e3b8a] hover:bg-[#1e3b8a]/10 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[24px]">
                {editingNotice ? "공지사항 수정" : "새 공지사항 작성"}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Notice["category"] })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  >
                    <option value="general">일반</option>
                    <option value="route">운행정보</option>
                    <option value="system">시스템</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">중요도</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Notice["priority"] })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20 resize-none"
                  placeholder="공지사항 내용을 입력하세요"
                />
              </div>

              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">이미지</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#cbd5e1] rounded-lg text-[#64748b] hover:border-[#1e3b8a] hover:text-[#1e3b8a] transition-colors font-['Public_Sans'] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImagePlus className="w-4 h-4" />
                  {isUploading ? "업로드 중..." : "이미지 추가"}
                </button>
                {formData.imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {formData.imageUrls.map((url, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`이미지 ${i + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-[#e2e8f0]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">이미지 아래 내용</label>
                <textarea
                  value={formData.contentBelow}
                  onChange={(e) => setFormData({ ...formData, contentBelow: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20 resize-none"
                  placeholder="이미지 아래에 표시될 내용을 입력하세요 (선택)"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-[#64748b] hover:bg-gray-100 rounded-lg font-['Public_Sans'] font-medium text-[15px] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-[#1e3b8a] text-white rounded-lg font-['Public_Sans'] font-semibold text-[15px] hover:bg-[#1e3b8a]/90 transition-colors"
              >
                {editingNotice ? "수정" : "작성"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
