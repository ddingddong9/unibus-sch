import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, MessageSquareText, RefreshCw, Save } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";
import type { ReportStatus, UserReport } from "../types";

const categoryLabel = {
  location: "위치 표시",
  schedule: "노선·시간표",
  notification: "알림",
  login: "로그인",
  lost: "분실물",
  other: "기타",
};

const statusLabel: Record<ReportStatus, string> = {
  open: "접수",
  in_progress: "처리 중",
  resolved: "해결",
};

export default function SupportManagement() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getReports();
      setReports(data);
      setSelectedId((current) => current && data.some((report) => report.id === current) ? current : data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "문의 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const selected = reports.find((report) => report.id === selectedId) ?? null;
  useEffect(() => { setAdminNote(selected?.adminNote ?? ""); }, [selected?.id, selected?.adminNote]);

  const counts = useMemo(() => ({
    open: reports.filter((report) => report.status === "open").length,
    in_progress: reports.filter((report) => report.status === "in_progress").length,
    resolved: reports.filter((report) => report.status === "resolved").length,
  }), [reports]);
  const visibleReports = filter === "all" ? reports : reports.filter((report) => report.status === filter);

  const updateSelected = async (status: ReportStatus) => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateReport(selected.id, { status, adminNote });
      setReports((current) => current.map((report) => report.id === updated.id ? { ...report, ...updated, userName: report.userName, userEmail: report.userEmail } : report));
    } catch (err) {
      setError(err instanceof Error ? err.message : "문의 상태를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-[#0f172a] sm:text-[32px]">문의·장애 대응</h1>
            <p className="mt-1 text-[15px] text-[#64748b]">사용자 문제를 접수하고 처리 상태와 답변 메모를 남깁니다.</p>
          </div>
          <button type="button" onClick={() => void loadReports()} disabled={loading} className="flex items-center justify-center gap-2 rounded-lg border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 새로고침
          </button>
        </div>

        {error ? <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mb-6 grid grid-cols-3 gap-3">
          {([
            ["open", "새 문의", counts.open, AlertCircle, "text-red-600"],
            ["in_progress", "처리 중", counts.in_progress, Clock3, "text-amber-600"],
            ["resolved", "해결", counts.resolved, CheckCircle2, "text-green-600"],
          ] as const).map(([value, label, count, Icon, color]) => (
            <button key={value} type="button" onClick={() => setFilter(filter === value ? "all" : value)} aria-pressed={filter === value} className={`rounded-xl border bg-white p-4 text-left shadow-sm ${filter === value ? "border-[#1e3b8a] ring-2 ring-[#1e3b8a]/10" : "border-gray-100"}`}>
              <Icon className={`mb-3 h-5 w-5 ${color}`} />
              <p className="text-xs text-[#64748b]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[#0f172a]">{count}</p>
            </button>
          ))}
        </div>

        <div className="grid min-h-[560px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[390px_1fr]">
          <div className="border-b border-gray-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-[#475569]">{filter === "all" ? "전체 문의" : statusLabel[filter]} · {visibleReports.length}건</div>
            <div className="max-h-[640px] overflow-auto">
              {loading && reports.length === 0 ? <p className="p-8 text-center text-sm text-[#94a3b8]">문의 목록 확인 중...</p> : visibleReports.length === 0 ? <p className="p-8 text-center text-sm text-[#94a3b8]">해당 상태의 문의가 없습니다.</p> : visibleReports.map((report) => (
                <button key={report.id} type="button" onClick={() => setSelectedId(report.id)} className={`w-full border-b border-gray-100 p-4 text-left transition-colors ${selectedId === report.id ? "bg-[#1e3b8a]/5" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-[#475569]">{categoryLabel[report.category]}</span>
                    <span className="text-[11px] text-[#94a3b8]">{new Date(report.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-bold text-[#0f172a]">{report.title}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{report.userName} · {statusLabel[report.status]}</p>
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <section className="p-5 sm:p-7" aria-label="선택한 문의 상세">
              <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-[#1e3b8a]" /><span className="text-xs font-semibold text-[#1e3b8a]">{categoryLabel[selected.category]}</span></div>
                  <h2 className="text-xl font-bold text-[#0f172a]">{selected.title}</h2>
                  <p className="mt-2 text-xs text-[#64748b]">{selected.userName} · {selected.userEmail}</p>
                </div>
                <select aria-label="문의 처리 상태" value={selected.status} onChange={(event) => void updateSelected(event.target.value as ReportStatus)} disabled={saving} className="h-10 rounded-lg border border-[#cbd5e1] px-3 text-sm font-semibold text-[#0f172a]">
                  <option value="open">접수</option><option value="in_progress">처리 중</option><option value="resolved">해결</option>
                </select>
              </div>
              <div className="py-6">
                <h3 className="mb-2 text-sm font-bold text-[#0f172a]">사용자 설명</h3>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-[#334155]">{selected.details}</p>
              </div>
              <div>
                <label htmlFor="admin-note" className="mb-2 block text-sm font-bold text-[#0f172a]">관리자 대응 메모</label>
                <textarea id="admin-note" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} rows={6} placeholder="확인 내용, 사용자에게 안내한 내용, 후속 조치를 기록하세요." className="w-full resize-none rounded-xl border border-[#cbd5e1] p-4 text-sm leading-6 focus:border-[#1e3b8a] focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/10" />
                <button type="button" onClick={() => void updateSelected(selected.status)} disabled={saving} className="mt-3 flex items-center gap-2 rounded-lg bg-[#1e3b8a] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "저장 중..." : "메모 저장"}</button>
              </div>
            </section>
          ) : <div className="grid place-items-center p-10 text-sm text-[#94a3b8]">확인할 문의를 선택하세요.</div>}
        </div>
      </div>
    </AdminLayout>
  );
}
