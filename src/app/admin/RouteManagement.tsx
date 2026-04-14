import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, MapPin, Clock, Search, RefreshCw } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";

interface BusRoute {
  id: string;
  name: string;
  type: "campus" | "commuter";
  description?: string;
  color?: string;
  region?: string;
  schedule?: string;
  duration?: string;
  fare?: string;
  stops: Array<{ id: string; name: string; order: number }>;
  isActive: boolean;
}

const DEFAULT_COLORS = [
  "#1e3a8a", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#ef4444", "#0ea5e9",
];

export default function RouteManagement() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "campus" as "campus" | "commuter",
    description: "",
    color: "#1e3a8a",
    region: "",
    schedule: "",
    duration: "",
    fare: "",
    stops: "",
    isActive: true,
  });

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes();
      setRoutes(data as BusRoute[]);
    } catch (e: any) {
      setError(e.message || "노선 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleCreate = () => {
    setEditingRoute(null);
    setFormData({
      name: "",
      type: "campus",
      description: "",
      color: "#1e3a8a",
      region: "",
      schedule: "",
      duration: "",
      fare: "",
      stops: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (route: BusRoute) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      type: route.type,
      description: route.description || "",
      color: route.color || "#1e3a8a",
      region: route.region || "",
      schedule: route.schedule || "",
      duration: route.duration || "",
      fare: route.fare || "",
      stops: route.stops?.map((s) => s.name).join(", ") || "",
      isActive: route.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const stopsList = formData.stops
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name, index) => ({ name, order: index + 1 }));

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description || undefined,
        color: formData.color,
        region: formData.region || undefined,
        schedule: formData.schedule || undefined,
        duration: formData.duration || undefined,
        fare: formData.fare || undefined,
        isActive: formData.isActive,
        stops: stopsList,
      };

      if (editingRoute) {
        await api.updateRoute(editingRoute.id, payload);
      } else {
        await api.createRoute(payload);
      }

      setShowModal(false);
      await fetchRoutes();
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 노선을 삭제하시겠습니까?")) return;
    try {
      await api.deleteRoute(id);
      await fetchRoutes();
    } catch (e: any) {
      alert(`삭제 실패: ${e.message}`);
    }
  };

  const toggleActive = async (route: BusRoute) => {
    try {
      await api.updateRoute(route.id, { isActive: !route.isActive } as any);
      setRoutes((prev) =>
        prev.map((r) => (r.id === route.id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch (e: any) {
      alert(`상태 변경 실패: ${e.message}`);
    }
  };

  const filteredRoutes = routes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const campusRoutes = filteredRoutes.filter((r) => r.type === "campus");
  const commuterRoutes = filteredRoutes.filter((r) => r.type === "commuter");

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">
              버스 노선 관리
            </h1>
            <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
              총 {routes.length}개의 노선 (운행중: {routes.filter((r) => r.isActive).length}개)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchRoutes}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 border border-[#cbd5e1] text-[#64748b] font-['Public_Sans'] font-semibold text-[15px] rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 bg-[#1e3b8a] text-white font-['Public_Sans'] font-semibold text-[15px] rounded-lg hover:bg-[#1e3b8a]/90 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              새 노선 추가
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <p className="font-['Public_Sans'] text-red-700 text-[14px]">{error}</p>
            <button
              onClick={fetchRoutes}
              className="ml-auto px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[13px] font-semibold hover:bg-red-200"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="노선 검색..."
              className="w-full h-[48px] pl-12 pr-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-[#1e3b8a] border-t-transparent rounded-full animate-spin" />
              <p className="font-['Public_Sans'] text-[#64748b]">노선 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* Campus Routes */}
        {!loading && (
          <>
            <div className="mb-8">
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">
                캠퍼스 셔틀 ({campusRoutes.length})
              </h2>
              {campusRoutes.length === 0 ? (
                <p className="text-[#94a3b8] font-['Public_Sans'] text-[14px] py-4">
                  캠퍼스 셔틀 노선이 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {campusRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={toggleActive}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">
                통근 버스 ({commuterRoutes.length})
              </h2>
              {commuterRoutes.length === 0 ? (
                <p className="text-[#94a3b8] font-['Public_Sans'] text-[14px] py-4">
                  통근버스 노선이 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {commuterRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={toggleActive}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[24px]">
                {editingRoute ? "노선 수정" : "새 노선 추가"}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* 노선명 + 유형 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    노선명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    placeholder="예: 천안역 직행"
                  />
                </div>
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    노선 유형
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as "campus" | "commuter" })
                    }
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  >
                    <option value="campus">캠퍼스 셔틀</option>
                    <option value="commuter">통근 버스</option>
                  </select>
                </div>
              </div>

              {/* 지역 + 요금 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    지역 (통근버스용)
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    placeholder="예: 인천, 서울, 경기"
                  />
                </div>
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    요금
                  </label>
                  <input
                    type="text"
                    value={formData.fare}
                    onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    placeholder="예: ₩3,500"
                  />
                </div>
              </div>

              {/* 소요시간 + 색상 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    소요 시간
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    placeholder="예: 50분"
                  />
                </div>
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    노선 색상
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-[48px] h-[48px] rounded-lg border border-[#cbd5e1] cursor-pointer p-1"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {DEFAULT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setFormData({ ...formData, color: c })}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            formData.color === c ? "border-[#0f172a] scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 정류장 */}
              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  정류장 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.stops}
                  onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  placeholder="예: 천안역, 쌍용동, 순천향대 정문"
                />
              </div>

              {/* 운행 시간 */}
              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  운행 시간 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  placeholder="예: 07:00, 08:00, 09:00"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  설명 (선택)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  placeholder="노선에 대한 추가 설명"
                />
              </div>

              {/* 활성화 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-[#1e3b8a] border-gray-300 rounded focus:ring-[#1e3b8a]"
                />
                <label
                  htmlFor="isActive"
                  className="font-['Public_Sans'] text-[#0f172a] text-[14px] font-medium"
                >
                  노선 활성화
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-5 py-2.5 text-[#64748b] hover:bg-gray-100 rounded-lg font-['Public_Sans'] font-medium text-[15px] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3b8a] text-white rounded-lg font-['Public_Sans'] font-semibold text-[15px] hover:bg-[#1e3b8a]/90 transition-colors disabled:opacity-50"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {editingRoute ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

interface RouteCardProps {
  route: BusRoute;
  onEdit: (route: BusRoute) => void;
  onDelete: (id: string) => void;
  onToggleActive: (route: BusRoute) => void;
}

function RouteCard({ route, onEdit, onDelete, onToggleActive }: RouteCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {route.color && (
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: route.color }}
              />
            )}
            <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px]">
              {route.name}
            </h3>
          </div>
          {route.region && (
            <span className="inline-block bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded text-[12px] font-medium mb-2">
              {route.region}
            </span>
          )}
          <button
            onClick={() => onToggleActive(route)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              route.isActive
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {route.isActive ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            {route.isActive ? "운행중" : "중지"}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(route)}
            className="p-2 text-[#1e3b8a] hover:bg-[#1e3b8a]/10 rounded-lg transition-colors"
            title="수정"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(route.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {route.stops && route.stops.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#64748b]" />
              <h4 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">
                정류장
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {route.stops.map((stop, index) => (
                <span
                  key={stop.id || index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-['Public_Sans'] text-[13px]"
                >
                  {stop.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {route.schedule && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#64748b]" />
              <h4 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">
                운행 시간
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {route.schedule.split(",").map((time, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-[#1e3b8a]/10 text-[#1e3b8a] rounded-lg font-['Public_Sans'] text-[13px] font-medium"
                >
                  {time.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {(route.duration || route.fare) && (
          <div className="flex gap-4 text-[13px] font-['Public_Sans'] text-[#64748b]">
            {route.duration && <span>{route.duration}</span>}
            {route.fare && <span>{route.fare}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
