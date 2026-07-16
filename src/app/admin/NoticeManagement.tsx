import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, Edit, ImagePlus, Pin, Plus, RefreshCw, Search, Send, Trash2, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";
import type { Notice, NotificationDelivery } from "../types";

const categoryLabel: Record<Notice["category"], string> = { general: "일반", route: "운행정보", system: "시스템", lost: "분실물" };
const targetLabel: Record<NotificationDelivery["target"], string> = { all: "전체", campus: "학내 셔틀", commuter: "통학 버스", system: "시스템 알림" };
const emptyForm = { title: "", content: "", category: "general" as Notice["category"], priority: "medium" as Notice["priority"], isPinned: false, imageUrls: [] as string[], contentBelow: "" };

export default function NoticeManagement() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [history, setHistory] = useState<NotificationDelivery[]>([]);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sendPush, setSendPush] = useState(false);
  const [target, setTarget] = useState<NotificationDelivery["target"]>("all");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [noticeResult, historyResult] = await Promise.allSettled([api.getNotices(), api.getNotificationHistory()]);
    if (noticeResult.status === "fulfilled") setNotices(noticeResult.value);
    else setMessage("공지 목록을 불러오지 못했습니다.");
    if (historyResult.status === "fulfilled") setHistory(historyResult.value);
    setLoading(false);
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setSendPush(false); setTarget("all"); setMessage(""); setModalOpen(true); };
  const openEdit = (notice: Notice) => { setEditing(notice); setForm({ title: notice.title, content: notice.content, category: notice.category, priority: notice.priority, isPinned: notice.isPinned, imageUrls: notice.imageUrls ?? [], contentBelow: notice.contentBelow ?? "" }); setSendPush(false); setTarget("all"); setMessage(""); setModalOpen(true); };

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((file) => api.uploadNoticeImage(file)));
      setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, ...urls] }));
    } catch { setMessage("이미지 업로드에 실패했습니다."); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { setMessage("제목과 내용을 입력해 주세요."); return; }
    setSaving(true); setMessage("");
    try {
      const saved = editing ? await api.updateNotice(editing.id, form) : await api.createNotice(form);
      let pushSummary = "";
      if (sendPush) {
        const result = await api.sendNoticePush(saved.id, target);
        pushSummary = ` · 푸시 ${result.sent}/${result.attempted}건 전송`;
      }
      setNotices((current) => editing ? current.map((notice) => notice.id === saved.id ? saved : notice) : [saved, ...current]);
      setMessage(`공지가 ${editing ? "수정" : "게시"}되었습니다${pushSummary}.`);
      setModalOpen(false);
      if (sendPush) setHistory(await api.getNotificationHistory());
    } catch (err) { setMessage(err instanceof Error ? err.message : "공지 저장에 실패했습니다."); }
    finally { setSaving(false); }
  };

  const remove = async (notice: Notice) => {
    if (!window.confirm(`'${notice.title}' 공지를 삭제할까요?`)) return;
    try { await api.deleteNotice(notice.id); setNotices((current) => current.filter((item) => item.id !== notice.id)); }
    catch (err) { setMessage(err instanceof Error ? err.message : "공지 삭제에 실패했습니다."); }
  };

  const filtered = notices.filter((notice) => `${notice.title} ${notice.content}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[26px] font-bold text-[#0f172a] sm:text-[32px]">공지·알림</h1><p className="mt-1 text-[15px] text-[#64748b]">공지 작성과 푸시 발송을 한 번에 처리하고 결과를 확인합니다.</p></div><div className="flex gap-2"><button type="button" onClick={() => void loadData()} disabled={loading} className="grid h-11 w-11 place-items-center rounded-lg border border-[#cbd5e1] bg-white" aria-label="공지 새로고침"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><button type="button" onClick={openCreate} className="flex h-11 items-center gap-2 rounded-lg bg-[#1e3b8a] px-5 text-sm font-bold text-white"><Plus className="h-4 w-4" />새 공지</button></div></div>
        {message ? <div role="status" className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-4"><label className="relative block max-w-md"><span className="sr-only">공지 검색</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목이나 내용 검색" className="h-11 w-full rounded-lg border border-[#cbd5e1] pl-10 pr-3 text-sm" /></label></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-50 text-left text-xs text-[#64748b]"><tr><th className="px-5 py-3">공지</th><th className="px-5 py-3">분류</th><th className="px-5 py-3">작성일</th><th className="px-5 py-3 text-right">작업</th></tr></thead><tbody>{filtered.map((notice) => <tr key={notice.id} className="border-t border-gray-100"><td className="px-5 py-4"><div className="flex items-center gap-2">{notice.isPinned ? <Pin className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> : null}<span className="font-bold text-[#0f172a]">{notice.title}</span></div><p className="mt-1 line-clamp-1 max-w-[520px] text-xs text-[#64748b]">{notice.content}</p></td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{categoryLabel[notice.category]}</span></td><td className="px-5 py-4 text-xs text-[#64748b]">{new Date(notice.createdAt).toLocaleDateString("ko-KR")}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => openEdit(notice)} aria-label={`${notice.title} 수정`} className="grid h-9 w-9 place-items-center rounded-lg text-[#1e3b8a] hover:bg-blue-50"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => void remove(notice)} aria-label={`${notice.title} 삭제`} className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{!loading && filtered.length === 0 ? <p className="py-12 text-center text-sm text-[#94a3b8]">표시할 공지가 없습니다.</p> : null}</div>
          </section>

          <aside className="rounded-xl border border-gray-100 bg-white shadow-sm"><div className="border-b border-gray-100 p-5"><h2 className="flex items-center gap-2 text-base font-bold text-[#0f172a]"><BellRing className="h-5 w-5 text-[#1e3b8a]" />최근 푸시 발송</h2><p className="mt-1 text-xs text-[#94a3b8]">실제 구독 기기 기준 결과</p></div><div className="max-h-[540px] overflow-auto p-3">{history.length === 0 ? <p className="p-8 text-center text-sm text-[#94a3b8]">발송 이력이 없습니다.</p> : history.map((item) => <div key={item.id} className="border-b border-gray-100 p-3 last:border-0"><p className="line-clamp-1 text-sm font-bold text-[#0f172a]">{item.noticeTitle}</p><div className="mt-2 flex items-center justify-between text-xs"><span className="text-[#64748b]">{targetLabel[item.target]} · {new Date(item.createdAt).toLocaleDateString("ko-KR")}</span><span className={item.failed ? "font-bold text-amber-700" : "font-bold text-green-700"}>{item.sent}/{item.attempted} 성공</span></div></div>)}</div></aside>
        </div>
      </div>

      {modalOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="notice-dialog-title"><div className="h-dvh w-full max-w-2xl overflow-auto bg-white sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4"><h2 id="notice-dialog-title" className="text-xl font-bold text-[#0f172a]">{editing ? "공지 수정" : "새 공지 작성"}</h2><button type="button" onClick={() => setModalOpen(false)} aria-label="공지 작성 창 닫기" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div className="space-y-5 p-5 sm:p-6">
        <label className="block text-sm font-bold text-[#0f172a]">제목<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] px-4 text-sm" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold text-[#0f172a]">카테고리<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as Notice["category"] }))} className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm"><option value="general">일반</option><option value="route">운행정보</option><option value="system">시스템</option><option value="lost">분실물</option></select></label><label className="text-sm font-bold text-[#0f172a]">중요도<select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Notice["priority"] }))} className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm"><option value="low">낮음</option><option value="medium">보통</option><option value="high">높음</option></select></label></div>
        <label className="block text-sm font-bold text-[#0f172a]">내용<textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={7} className="mt-2 w-full resize-none rounded-lg border border-[#cbd5e1] p-4 text-sm leading-6" /></label>
        <div><span className="mb-2 block text-sm font-bold text-[#0f172a]">이미지</span><input ref={fileInputRef} type="file" multiple accept="image/*" onChange={uploadImages} className="hidden" /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 rounded-lg border border-dashed border-[#cbd5e1] px-4 py-2.5 text-sm font-semibold text-[#64748b]"><ImagePlus className="h-4 w-4" />{uploading ? "업로드 중..." : "이미지 추가"}</button>{form.imageUrls.length ? <div className="mt-3 grid grid-cols-3 gap-3">{form.imageUrls.map((url, index) => <div key={url} className="relative aspect-square"><img src={url} alt={`공지 첨부 ${index + 1}`} className="h-full w-full rounded-lg object-cover" /><button type="button" onClick={() => setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`첨부 이미지 ${index + 1} 삭제`} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white"><X className="h-3.5 w-3.5" /></button></div>)}</div> : null}</div>
        <label className="block text-sm font-bold text-[#0f172a]">이미지 아래 내용 <span className="font-normal text-[#94a3b8]">(선택)</span><textarea value={form.contentBelow} onChange={(event) => setForm((current) => ({ ...current, contentBelow: event.target.value }))} rows={3} className="mt-2 w-full resize-none rounded-lg border border-[#cbd5e1] p-4 text-sm" /></label>
        <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4"><input type="checkbox" checked={form.isPinned} onChange={(event) => setForm((current) => ({ ...current, isPinned: event.target.checked }))} className="h-4 w-4" /><span><span className="block text-sm font-bold text-[#0f172a]">상단 고정</span><span className="text-xs text-[#64748b]">사용자 공지 목록 맨 위에 표시</span></span></label>
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><label className="flex items-center gap-3"><input type="checkbox" checked={sendPush} onChange={(event) => setSendPush(event.target.checked)} className="h-4 w-4" /><span><span className="block text-sm font-bold text-[#0f172a]">저장 후 푸시 알림 발송</span><span className="text-xs text-[#64748b]">공지와 알림 내용이 항상 같게 유지됩니다.</span></span></label>{sendPush ? <label className="mt-3 block text-xs font-bold text-[#475569]">발송 대상<select value={target} onChange={(event) => setTarget(event.target.value as NotificationDelivery["target"])} className="mt-1.5 h-10 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm"><option value="all">전체 사용자</option><option value="campus">학내 셔틀 이용자</option><option value="commuter">통학 버스 이용자</option><option value="system">시스템 알림</option></select></label> : null}</div>
      </div><div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white p-4"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#64748b]">취소</button><button type="button" onClick={() => void save()} disabled={saving || uploading} className="flex items-center gap-2 rounded-lg bg-[#1e3b8a] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{sendPush ? <Send className="h-4 w-4" /> : null}{saving ? "처리 중..." : sendPush ? "저장하고 발송" : "저장"}</button></div></div></div> : null}
    </AdminLayout>
  );
}
