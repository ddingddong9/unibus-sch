import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, MapPin, Clock, Search, RefreshCw, Route as RouteIcon, Save, X, MousePointer2 } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";

interface BusRoute {
  id: string;
  name: string;
  type: "campus" | "commuter";
  shuttleVariant?: ShuttleVariant | null;
  description?: string | null;
  color?: string;
  region?: string;
  schedule?: string;
  scheduleBasis?: "bus_departure" | "train_departure" | "train_arrival" | null;
  intervalMinutes?: number | null;
  departureOffsetMinutes?: number | null;
  boardingWaitMinutes?: number | null;
  continuationRouteId?: string | null;
  duration?: string;
  fare?: string;
  stops: Array<{ id: string; name: string; order: number; lat?: number | null; lng?: number | null }>;
  shapePoints?: Array<{ id?: string; name?: string | null; afterStopOrder: number; order: number; lat: number; lng: number }>;
  isActive: boolean;
}

type ShuttleVariant = "campus_loop" | "campus_to_station" | "station_to_campus" | "station_to_campus_loop";

const DEFAULT_COLORS = [
  "#FFB3C6", "#FFC8A2", "#FDEEA3",
  "#B8F0B8", "#A8D8EA", "#C5A3D5", "#FFCCE7",
];

const SHUTTLE_VARIANT_OPTIONS: Array<{ value: ShuttleVariant; label: string; hint: string }> = [
  { value: "campus_loop", label: "학내순환", hint: "교내 정류장을 순환하는 셔틀" },
  { value: "campus_to_station", label: "후문 → 신창역", hint: "지하철 출발 전 후문에서 출발" },
  { value: "station_to_campus", label: "신창역 → 후문", hint: "후문 하차 후 운행 종료" },
  { value: "station_to_campus_loop", label: "신창역 → 후문 → 학내순환", hint: "후문 도착 뒤 학내순환 연결" },
];

const getShuttleVariantLabel = (variant?: ShuttleVariant | null) =>
  SHUTTLE_VARIANT_OPTIONS.find((option) => option.value === variant)?.label || "셔틀버스";

const parseStopNames = (value: string) =>
  value
    .split(",")
    .map((stop) => stop.trim())
    .filter(Boolean);

const hasStationStop = (names: string[]) => names.some((name) => /신창|순천향대역|순천향대학교역/.test(name));

const normalizeStopName = (name: string) => name.replace(/\s+/g, "").toLowerCase();

const findInvalidDuplicateStop = (names: string[], allowClosedLoop: boolean) => {
  const normalized = names.map(normalizeStopName);
  return names.find((_, index) => {
    const firstIndex = normalized.indexOf(normalized[index]);
    if (firstIndex === index) return false;
    return !(
      allowClosedLoop &&
      firstIndex === 0 &&
      index === normalized.length - 1
    );
  });
};

const validateRouteForm = (formData: {
  name: string;
  type: "campus" | "commuter";
  shuttleVariant: ShuttleVariant;
  schedule: string;
  stops: string;
  intervalMinutes: number;
  departureOffsetMinutes: number;
  boardingWaitMinutes: number;
}) => {
  const errors: string[] = [];
  const stopNames = parseStopNames(formData.stops);
  const allowClosedLoop = formData.type === "campus" && formData.shuttleVariant === "campus_loop";
  const duplicateStop = findInvalidDuplicateStop(stopNames, allowClosedLoop);
  const scheduleTokens = formData.schedule
    .split(/[,\n]/)
    .map((time) => time.trim())
    .filter(Boolean);
  const invalidSchedule = scheduleTokens.find((time) => !/^([01]?\d|2[0-3]):[0-5]\d$/.test(time));

  if (!formData.name.trim()) errors.push("노선명을 입력해 주세요.");
  if (stopNames.length < 2) errors.push("정류장은 최소 2개 이상 입력해 주세요.");
  if (duplicateStop) errors.push(`중복된 정류장이 있습니다: ${duplicateStop}`);
  if (invalidSchedule) errors.push(`시간 형식은 08:20처럼 입력해 주세요: ${invalidSchedule}`);
  if (formData.type === "campus" && formData.shuttleVariant !== "campus_loop" && !hasStationStop(stopNames)) {
    errors.push("신창역 셔틀 유형은 정류장에 신창역 또는 순천향대역이 포함되어야 합니다.");
  }
  if (formData.type === "campus" && formData.shuttleVariant !== "campus_loop" && scheduleTokens.length === 0) {
    errors.push("신창역 셔틀은 기준이 되는 지하철 도착 또는 출발 시각이 필요합니다.");
  }
  if (formData.type === "campus" && formData.shuttleVariant === "campus_loop" && hasStationStop(stopNames)) {
    errors.push("신창역 정류장이 포함된 셔틀은 학내순환이 아닌 신창역 셔틀 유형으로 선택해 주세요.");
  }
  if (formData.type === "campus" && formData.shuttleVariant === "campus_loop" && (formData.intervalMinutes < 1 || formData.intervalMinutes > 180)) {
    errors.push("학내순환 출발 간격은 1~180분으로 입력해 주세요.");
  }
  if (formData.type === "campus" && formData.shuttleVariant === "campus_to_station" && (formData.departureOffsetMinutes < 0 || formData.departureOffsetMinutes > 120)) {
    errors.push("지하철 출발 전 시간은 0~120분으로 입력해 주세요.");
  }
  if (formData.type === "campus" && ["station_to_campus", "station_to_campus_loop"].includes(formData.shuttleVariant) && (formData.boardingWaitMinutes < 0 || formData.boardingWaitMinutes > 120)) {
    errors.push("탑승 대기 시간은 0~120분으로 입력해 주세요.");
  }

  return { errors, stopNames };
};

export default function RouteManagement() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  const [mapEditingRoute, setMapEditingRoute] = useState<BusRoute | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "campus" as "campus" | "commuter",
    shuttleVariant: "campus_loop" as ShuttleVariant,
    description: "",
    color: "#1e3a8a",
    region: "",
    schedule: "",
    intervalMinutes: 10,
    departureOffsetMinutes: 10,
    boardingWaitMinutes: 5,
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
    setFormError(null);
    setFormData({
      name: "",
      type: "campus",
      shuttleVariant: "campus_loop",
      description: "",
      color: "#1e3a8a",
      region: "",
      schedule: "",
      intervalMinutes: 10,
      departureOffsetMinutes: 10,
      boardingWaitMinutes: 5,
      duration: "",
      fare: "",
      stops: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (route: BusRoute) => {
    setEditingRoute(route);
    setFormError(null);
    setFormData({
      name: route.name,
      type: route.type,
      shuttleVariant: route.shuttleVariant || "campus_loop",
      description: route.description || "",
      color: route.color || "#1e3a8a",
      region: route.region || "",
      schedule: route.schedule || "",
      intervalMinutes: route.intervalMinutes ?? 10,
      departureOffsetMinutes: route.departureOffsetMinutes ?? 10,
      boardingWaitMinutes: route.boardingWaitMinutes ?? 5,
      duration: route.duration || "",
      fare: route.fare || "",
      stops: route.stops?.map((s) => s.name).join(", ") || "",
      isActive: route.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const { errors, stopNames } = validateRouteForm(formData);
    if (errors.length > 0) {
      setFormError(errors.join("\n"));
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      const stopsList = stopNames.map((name, index) => {
        const normalizedName = name.replace(/\s+/g, "").toLowerCase();
        const existingStop = editingRoute?.stops.find((stop) =>
          stop.name.replace(/\s+/g, "").toLowerCase() === normalizedName,
        ) ?? editingRoute?.stops[index];

        return {
          id: existingStop?.id,
          name,
          order: index + 1,
          lat: existingStop?.lat ?? null,
          lng: existingStop?.lng ?? null,
        };
      });
      const scheduleBasis: BusRoute["scheduleBasis"] = formData.type === "campus"
        ? formData.shuttleVariant === "campus_to_station"
          ? "train_departure"
          : formData.shuttleVariant === "campus_loop" ? "bus_departure" : "train_arrival"
        : null;

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        shuttleVariant: formData.type === "campus" ? formData.shuttleVariant : null,
        description: formData.description || null,
        color: formData.color,
        region: formData.region || undefined,
        schedule: formData.schedule || undefined,
        scheduleBasis,
        intervalMinutes: formData.type === "campus" && formData.shuttleVariant === "campus_loop"
          ? Number(formData.intervalMinutes) : null,
        departureOffsetMinutes: formData.type === "campus" && formData.shuttleVariant === "campus_to_station"
          ? Number(formData.departureOffsetMinutes) : 0,
        boardingWaitMinutes: formData.type === "campus" && (
          formData.shuttleVariant === "station_to_campus" || formData.shuttleVariant === "station_to_campus_loop"
        ) ? Number(formData.boardingWaitMinutes) : 0,
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
      setFormError(`저장 실패: ${e.message}`);
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
  const campusLoopRoutes = campusRoutes.filter((route) => route.shuttleVariant === "campus_loop");
  const stationShuttleRoutes = campusRoutes.filter((route) => route.shuttleVariant !== "campus_loop");
  const commuterRoutes = filteredRoutes.filter((r) => r.type === "commuter");

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 font-['Public_Sans'] text-[26px] font-bold text-[#0f172a] sm:text-[32px]">
              버스 노선 관리
            </h1>
            <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
              총 {routes.length}개의 노선 (운행중: {routes.filter((r) => r.isActive).length}개)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <button
              onClick={fetchRoutes}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#cbd5e1] px-3 py-3 font-['Public_Sans'] text-[14px] font-semibold text-[#64748b] transition-colors hover:bg-gray-50 sm:px-4 sm:text-[15px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#1e3b8a] px-3 py-3 font-['Public_Sans'] text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1e3b8a]/90 sm:px-6 sm:text-[15px]"
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

        {/* Shuttle Routes */}
        {!loading && (
          <>
            <div className="mb-8">
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">
                셔틀버스 노선별 정류장 ({campusRoutes.length})
              </h2>
              <p className="mb-4 text-[13px] leading-5 text-[#64748b]">
                학내순환과 신창역 셔틀은 노선별로 정류장 위치가 따로 저장됩니다. 각 카드의 정류장·경로 편집을 눌러 수정하세요.
              </p>
              {campusRoutes.length === 0 ? (
                <p className="text-[#94a3b8] font-['Public_Sans'] text-[14px] py-4">
                  셔틀버스 노선이 없습니다.
                </p>
              ) : (
                <div className="space-y-7">
                  {[
                    { title: "학내순환", routes: campusLoopRoutes },
                    { title: "신창역 셔틀", routes: stationShuttleRoutes },
                  ].map((group) => group.routes.length > 0 && (
                    <section key={group.title}>
                      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-[#334155]">
                        <span className="h-2 w-2 rounded-full bg-[#1e3b8a]" />
                        {group.title} ({group.routes.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        {group.routes.map((route) => (
                          <RouteCard
                            key={route.id}
                            route={route}
                            onEdit={handleEdit}
                            onMapEdit={setMapEditingRoute}
                            onDelete={handleDelete}
                            onToggleActive={toggleActive}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">
                통학 버스 ({commuterRoutes.length})
              </h2>
              {commuterRoutes.length === 0 ? (
                <p className="text-[#94a3b8] font-['Public_Sans'] text-[14px] py-4">
                  통학버스 노선이 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {commuterRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      onEdit={handleEdit}
                      onMapEdit={setMapEditingRoute}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="h-dvh w-full max-w-3xl overflow-auto bg-white sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
            <div className="border-b border-gray-200 p-4 sm:p-6">
              <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[24px]">
                {editingRoute ? "노선 수정" : "새 노선 추가"}
              </h2>
            </div>
            <div className="space-y-5 p-4 sm:p-6">
              {/* 노선명 + 유형 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <option value="campus">셔틀버스 (학내순환/신창역)</option>
                    <option value="commuter">통학 버스</option>
                  </select>
                </div>
              </div>

              {formData.type === "campus" && (
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    셔틀 운행 방식
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SHUTTLE_VARIANT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, shuttleVariant: option.value })}
                        className={`text-left rounded-xl border px-4 py-3 transition-all ${
                          formData.shuttleVariant === option.value
                            ? "border-[#1e3b8a] bg-[#1e3b8a]/5"
                            : "border-[#e2e8f0] hover:border-[#94a3b8]"
                        }`}
                      >
                        <p className="font-['Public_Sans'] font-bold text-[#0f172a] text-[14px]">{option.label}</p>
                        <p className="mt-1 font-['Public_Sans'] text-[#64748b] text-[12px] leading-[17px]">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 지역 + 요금 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    지역/분류
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    placeholder="예: 신창역, 인천, 서울"
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    소요 시간 / 출발 기준
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    placeholder="예: 10분 전 출발, 50분"
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
                  placeholder="예: 후문, 신창역 또는 신창역, 후문, 향3, 향1"
                />
              </div>

              {formData.type === "campus" && formData.shuttleVariant === "campus_loop" && (
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    출발 간격 (분)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={formData.intervalMinutes}
                    onChange={(e) => setFormData({ ...formData, intervalMinutes: Number(e.target.value) })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  />
                  <p className="mt-1.5 text-[12px] text-[#64748b]">학내순환은 설정한 간격으로 반복 출발합니다.</p>
                </div>
              )}

              {formData.type === "campus" && formData.shuttleVariant === "campus_to_station" && (
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    지하철 출발 전 선출발 시간 (분)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={formData.departureOffsetMinutes}
                    onChange={(e) => setFormData({ ...formData, departureOffsetMinutes: Number(e.target.value) })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  />
                </div>
              )}

              {formData.type === "campus" && (formData.shuttleVariant === "station_to_campus" || formData.shuttleVariant === "station_to_campus_loop") && (
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    지하철 도착 후 탑승 대기 (분)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={formData.boardingWaitMinutes}
                    onChange={(e) => setFormData({ ...formData, boardingWaitMinutes: Number(e.target.value) })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  />
                  <p className="mt-1.5 text-[12px] text-[#64748b]">열차 도착 뒤 학생 탑승 시간을 확보한 후 후문으로 출발합니다.</p>
                </div>
              )}

              {/* 운행 시간 */}
              {(formData.type !== "campus" || formData.shuttleVariant !== "campus_loop") && <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  {formData.type === "campus" && formData.shuttleVariant === "campus_to_station"
                    ? "신창역 지하철 출발 시각"
                    : formData.type === "campus" ? "신창역 지하철 도착 시각" : "운행 시간"} (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  placeholder="예: 08:20, 09:20, 10:20"
                />
              </div>}

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
                  placeholder="예: 후문 종착, 학내순환 연결, 지하철 출발 10분 전 후문 출발"
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

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  {formError.split("\n").map((line) => (
                    <p key={line} className="font-['Public_Sans'] text-red-700 text-[13px] leading-6">
                      {line}
                    </p>
                  ))}
                </div>
              )}
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
      {mapEditingRoute && (
        <RouteMapEditor
          route={mapEditingRoute}
          onClose={() => setMapEditingRoute(null)}
          onSaved={async () => {
            setMapEditingRoute(null);
            await fetchRoutes();
          }}
        />
      )}
    </AdminLayout>
  );
}

interface RouteCardProps {
  route: BusRoute;
  onEdit: (route: BusRoute) => void;
  onMapEdit: (route: BusRoute) => void;
  onDelete: (id: string) => void;
  onToggleActive: (route: BusRoute) => void;
}

function RouteCard({ route, onEdit, onMapEdit, onDelete, onToggleActive }: RouteCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
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
          {route.type === "campus" && (
            <span className="ml-2 inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[12px] font-semibold mb-2">
              {getShuttleVariantLabel(route.shuttleVariant)}
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
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onEdit(route)}
            aria-label={`${route.name} 수정`}
            className="p-2 text-[#1e3b8a] hover:bg-[#1e3b8a]/10 rounded-lg transition-colors"
            title="수정"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(route.id)}
            aria-label={`${route.name} 삭제`}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onMapEdit(route)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#1e3b8a]/25 bg-[#1e3b8a]/5 px-3 py-2.5 text-[13px] font-bold text-[#1e3b8a] transition-colors hover:bg-[#1e3b8a]/10"
      >
        <RouteIcon className="h-4 w-4" />
        정류장·경로 편집
      </button>

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
                {route.scheduleBasis === "train_arrival" ? "지하철 도착 시각" : route.scheduleBasis === "train_departure" ? "지하철 출발 시각" : "운행 시간"}
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
        {route.type === "campus" && route.shuttleVariant === "campus_loop" && (
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1e3b8a]">
            <Clock className="h-4 w-4" />
            {route.intervalMinutes ?? 10}분 간격 출발
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

interface RouteMapEditorProps {
  route: BusRoute;
  onClose: () => void;
  onSaved: () => void;
}

declare global {
  interface Window { naver: any; }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char] || char);

const STOP_MARKER = (name: string, index: number) => `
  <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 7px rgba(15,23,42,0.25));cursor:grab;">
    <div style="background:white;color:#0f172a;border:1px solid rgba(15,23,42,0.12);padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap;margin-bottom:4px;font-family:sans-serif;">${escapeHtml(name)}</div>
    <div style="width:30px;height:30px;border-radius:999px;background:#1e3b8a;border:3px solid white;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;font-family:sans-serif;">${index}</div>
  </div>
`;

const SHAPE_MARKER = (index: number) => `
  <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 7px rgba(15,23,42,0.22));cursor:grab;">
    <div style="background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap;margin-bottom:5px;font-family:sans-serif;">보정점 ${index}</div>
    <div style="width:24px;height:24px;background:#f97316;border:3px solid white;transform:rotate(45deg);border-radius:5px;"></div>
  </div>
`;

const validateMapDetails = (
  stops: BusRoute["stops"],
  shapePoints: NonNullable<BusRoute["shapePoints"]>,
) => {
  const errors: string[] = [];
  const seenOrders = new Set<number>();
  const duplicateOrder = stops.find((stop) => {
    if (seenOrders.has(stop.order)) return true;
    seenOrders.add(stop.order);
    return false;
  });
  const missingStopCoord = stops.find((stop) => stop.lat == null || stop.lng == null);
  const invalidShapePoint = shapePoints.find((point) =>
    point.lat == null ||
    point.lng == null ||
    !Number.isFinite(Number(point.lat)) ||
    !Number.isFinite(Number(point.lng)) ||
    point.afterStopOrder < 1 ||
    point.order < 1
  );

  if (stops.length < 2) errors.push("정류장은 최소 2개 이상 필요합니다.");
  if (duplicateOrder) errors.push(`정류장 순서가 중복되었습니다: ${duplicateOrder.order}`);
  if (missingStopCoord) errors.push(`좌표가 없는 정류장이 있습니다: ${missingStopCoord.name}`);
  if (invalidShapePoint) errors.push("좌표 또는 순서가 잘못된 보정점이 있습니다.");

  return errors;
};

function RouteMapEditor({ route, onClose, onSaved }: RouteMapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const hasFitBoundsRef = useRef(false);
  const [stops, setStops] = useState<BusRoute["stops"]>(route.stops || []);
  const [shapePoints, setShapePoints] = useState<NonNullable<BusRoute["shapePoints"]>>(route.shapePoints || []);
  const [path, setPath] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("마커를 드래그하면 네이버 경로가 다시 계산됩니다.");
  const [newShapeAfterStopOrder, setNewShapeAfterStopOrder] = useState<number | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const clearMapObjects = () => {
    markerRefs.current.forEach(marker => { try { marker.setMap(null); } catch (_) {} });
    markerRefs.current = [];
    if (polylineRef.current) {
      try { polylineRef.current.setMap(null); } catch (_) {}
      polylineRef.current = null;
    }
  };

  const ensureMapScript = () => new Promise<void>((resolve, reject) => {
    if (window.naver?.maps) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-naver-admin-map="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("네이버 지도 스크립트를 불러오지 못했습니다.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.dataset.naverAdminMap = "true";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${import.meta.env.VITE_NAVER_CLIENT_ID}&submodules=geocoder`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("네이버 지도 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  const waitForMapContainer = () => new Promise<void>((resolve) => {
    const check = (attempt = 0) => {
      const rect = mapRef.current?.getBoundingClientRect();
      if ((rect?.width || 0) > 0 && (rect?.height || 0) > 0) {
        resolve();
        return;
      }
      if (attempt > 10) {
        resolve();
        return;
      }
      requestAnimationFrame(() => check(attempt + 1));
    };
    requestAnimationFrame(() => check());
  });

  const refreshPreview = useCallback(async (
    nextStops = stops,
    nextShapePoints = shapePoints,
  ) => {
    const drawableStops = nextStops.filter(stop => stop.lat != null && stop.lng != null);
    if (drawableStops.length < 2) return;
    setMessage("네이버 경로를 다시 계산하는 중입니다.");
    try {
      const { path: nextPath } = await api.previewRoutePath(route.id, {
        stops: nextStops.map(stop => ({
          id: stop.id,
          name: stop.name,
          order: stop.order,
          lat: stop.lat ?? null,
          lng: stop.lng ?? null,
        })),
        shapePoints: nextShapePoints,
      });
      setPath(nextPath);
      setMessage("경로 미리보기가 업데이트되었습니다.");
    } catch (error: any) {
      setMessage(error.message || "경로 미리보기를 다시 계산하지 못했습니다.");
    }
  }, [route.id, stops, shapePoints]);

  useEffect(() => {
    let disposed = false;
    const setup = async () => {
      setLoading(true);
      try {
        const [_, routePath] = await Promise.all([
          ensureMapScript(),
          api.getRoutePath(route.id),
        ]);
        if (disposed) return;

        setStops(routePath.stops.map(stop => ({
          id: stop.id,
          name: stop.name,
          order: stop.order,
          lat: stop.lat,
          lng: stop.lng,
        })));
        setSelectedStopId(routePath.stops[0]?.id ?? null);
        setShapePoints(routePath.shapePoints || []);
        setPath(routePath.path || []);
        const selectableStops = routePath.stops.filter(stop => stop.lat != null && stop.lng != null);
        setNewShapeAfterStopOrder(selectableStops[Math.max(0, selectableStops.length - 2)]?.order ?? 1);

        const first = routePath.stops.find(stop => stop.lat != null && stop.lng != null);
        await waitForMapContainer();
        if (disposed) return;

        if (mapRef.current && !mapInstance.current) {
          mapInstance.current = new window.naver.maps.Map(mapRef.current, {
            center: new window.naver.maps.LatLng(first?.lat ?? 36.7694, first?.lng ?? 126.9322),
            zoom: route.type === "campus" ? 16 : 12,
          });
          const rect = mapRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            mapInstance.current.setSize(new window.naver.maps.Size(rect.width, rect.height));
          }
        }
      } catch (error: any) {
        setMessage(error.message || "지도 편집기를 불러오지 못했습니다.");
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    setup();
    return () => {
      disposed = true;
      clearMapObjects();
      hasFitBoundsRef.current = false;
    };
  }, [route.id, route.type]);

  useEffect(() => {
    if (!mapInstance.current || !window.naver || loading) return;
    clearMapObjects();

    if (path.length > 1) {
      polylineRef.current = new window.naver.maps.Polyline({
        map: mapInstance.current,
        path: path.map(([lng, lat]) => new window.naver.maps.LatLng(lat, lng)),
        strokeColor: route.color || "#1e3b8a",
        strokeWeight: 5,
        strokeOpacity: 0.85,
      });
    }

    const bounds = new window.naver.maps.LatLngBounds();
    let boundsPointCount = 0;
    stops.forEach((stop, index) => {
      if (stop.lat == null || stop.lng == null) return;
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(stop.lat, stop.lng),
        map: mapInstance.current,
        draggable: true,
        icon: {
          content: STOP_MARKER(stop.name, index + 1),
          size: new window.naver.maps.Size(80, 58),
          anchor: new window.naver.maps.Point(40, 58),
        },
        zIndex: 30,
      });
      window.naver.maps.Event.addListener(marker, "dragend", () => {
        const pos = marker.getPosition();
        const nextStops = stops.map(item => item.id === stop.id ? { ...item, lat: pos.lat(), lng: pos.lng() } : item);
        setStops(nextStops);
        refreshPreview(nextStops, shapePoints);
      });
      window.naver.maps.Event.addListener(marker, "click", () => {
        setSelectedStopId(stop.id);
        setMessage(`${stop.name} 정류장을 선택했습니다. 마커를 끌거나 지도의 원하는 위치를 누르세요.`);
      });
      markerRefs.current.push(marker);
      bounds.extend(marker.getPosition());
      boundsPointCount += 1;
    });

    shapePoints.forEach((point, index) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(point.lat, point.lng),
        map: mapInstance.current,
        draggable: true,
        icon: {
          content: SHAPE_MARKER(index + 1),
          size: new window.naver.maps.Size(80, 58),
          anchor: new window.naver.maps.Point(40, 58),
        },
        zIndex: 25,
      });
      window.naver.maps.Event.addListener(marker, "dragend", () => {
        const pos = marker.getPosition();
        const nextPoints = shapePoints.map((item, pointIndex) => pointIndex === index ? { ...item, lat: pos.lat(), lng: pos.lng() } : item);
        setShapePoints(nextPoints);
        refreshPreview(stops, nextPoints);
      });
      markerRefs.current.push(marker);
      bounds.extend(marker.getPosition());
      boundsPointCount += 1;
    });

    if (boundsPointCount > 0 && !hasFitBoundsRef.current) {
      mapInstance.current.fitBounds(bounds);
      hasFitBoundsRef.current = true;
    }
  }, [loading, path, stops, shapePoints, refreshPreview, route.color]);

  useEffect(() => {
    if (!mapInstance.current || !window.naver || loading) return;

    const listener = window.naver.maps.Event.addListener(mapInstance.current, "click", (event: any) => {
      if (!selectedStopId) {
        setMessage("먼저 오른쪽 목록에서 옮길 정류장을 선택해 주세요.");
        return;
      }

      const latLng = event.coord;
      const selectedStop = stops.find((stop) => stop.id === selectedStopId);
      if (!selectedStop || !latLng) return;
      const nextStops = stops.map((stop) => stop.id === selectedStopId
        ? { ...stop, lat: latLng.lat(), lng: latLng.lng() }
        : stop);
      setStops(nextStops);
      setMessage(`${selectedStop.name} 정류장 위치를 변경했습니다. 저장 전 경로를 확인해 주세요.`);
      refreshPreview(nextStops, shapePoints);
    });

    return () => window.naver.maps.Event.removeListener(listener);
  }, [loading, refreshPreview, selectedStopId, shapePoints, stops]);

  const addShapePoint = () => {
    const drawableStops = stops.filter(stop => stop.lat != null && stop.lng != null);
    if (drawableStops.length < 2) {
      setMessage("좌표가 있는 정류장이 2개 이상 필요합니다.");
      return;
    }
    const selectedIndex = Math.max(0, drawableStops.findIndex(stop => stop.order === newShapeAfterStopOrder));
    const from = drawableStops[selectedIndex] || drawableStops[Math.max(0, drawableStops.length - 2)];
    const to = drawableStops[selectedIndex + 1] || drawableStops[drawableStops.length - 1];
    const afterStopOrder = from.order;
    const sameSegmentCount = shapePoints.filter(point => point.afterStopOrder === afterStopOrder).length;
    const nextPoints = [
      ...shapePoints,
      {
        name: "경로 보정점",
        afterStopOrder,
        order: sameSegmentCount + 1,
        lat: ((from.lat || 0) + (to.lat || 0)) / 2,
        lng: ((from.lng || 0) + (to.lng || 0)) / 2,
      },
    ];
    setShapePoints(nextPoints);
    refreshPreview(stops, nextPoints);
  };

  const removeLastShapePoint = () => {
    const nextPoints = shapePoints.slice(0, -1);
    setShapePoints(nextPoints);
    refreshPreview(stops, nextPoints);
  };

  const handleSave = async () => {
    const validationErrors = validateMapDetails(stops, shapePoints);
    if (validationErrors.length > 0) {
      setMessage(validationErrors.join(" "));
      return;
    }

    setSaving(true);
    try {
      await api.updateRoute(route.id, {
        stops: stops.map(stop => ({
          id: stop.id,
          name: stop.name,
          order: stop.order,
          lat: stop.lat ?? null,
          lng: stop.lng ?? null,
        })),
        shapePoints,
      } as any);
      await onSaved();
    } catch (error: any) {
      setMessage(error.message || "지도 경로 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="flex h-dvh w-full max-w-6xl flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 sm:items-center sm:p-5">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#1e3b8a]/10 px-2.5 py-1 text-[11px] font-bold text-[#1e3b8a]">
                {route.type === "campus" ? getShuttleVariantLabel(route.shuttleVariant) : "통학버스"}
              </span>
              <span className="text-[11px] font-medium text-[#64748b]">이 노선에만 적용</span>
            </div>
            <h2 className="font-['Public_Sans'] text-[18px] font-bold text-[#0f172a] sm:text-[22px]">{route.name} 정류장·경로 편집</h2>
            <p className="font-['Public_Sans'] text-[#64748b] text-[13px] mt-1">정류장을 선택한 뒤 지도를 누르거나 마커를 드래그해 위치를 바꿉니다.</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#64748b] hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_300px] lg:overflow-hidden">
          <div className="relative min-h-[48dvh] bg-[#e2e8f0] sm:min-h-[520px] lg:min-h-[620px]">
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#1e3b8a] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <aside className="border-t border-gray-200 p-4 lg:overflow-auto lg:border-l lg:border-t-0 lg:p-5">
            <div className="space-y-3 mb-5">
              <label className="block">
                <span className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[13px] mb-1.5">보정점 추가 구간</span>
                <select
                  value={newShapeAfterStopOrder ?? ""}
                  onChange={(event) => setNewShapeAfterStopOrder(Number(event.target.value))}
                  className="w-full h-[38px] px-3 rounded-lg border border-[#cbd5e1] bg-white font-['Public_Sans'] text-[13px] text-[#0f172a]"
                >
                  {stops.slice(0, -1).map((stop, index) => (
                    <option key={stop.id} value={stop.order}>
                      {stop.name} → {stops[index + 1]?.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={addShapePoint}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e3b8a] text-white font-['Public_Sans'] font-semibold text-[14px]"
              >
                <Plus className="w-4 h-4" />
                보정점 추가
              </button>
              <button
                onClick={removeLastShapePoint}
                disabled={shapePoints.length === 0}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-[#64748b] font-['Public_Sans'] font-semibold text-[14px] disabled:opacity-40"
              >
                마지막 보정점 삭제
              </button>
            </div>
            <div className="mb-5 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="font-['Public_Sans'] text-blue-900 text-[12px] leading-5">{message}</p>
            </div>
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">정류장 위치</h3>
                <span className="text-[11px] text-[#94a3b8]">선택 후 지도 클릭</span>
              </div>
              <div className="space-y-2">
                {stops.map((stop) => (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => {
                      setSelectedStopId(stop.id);
                      setMessage(`${stop.name} 정류장을 선택했습니다. 지도의 원하는 위치를 누르세요.`);
                      if (stop.lat != null && stop.lng != null) {
                        mapInstance.current?.panTo(new window.naver.maps.LatLng(stop.lat, stop.lng));
                      }
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left font-['Public_Sans'] text-[12px] transition-colors ${
                      selectedStopId === stop.id
                        ? "border-[#1e3b8a] bg-[#1e3b8a]/5 text-[#1e3b8a]"
                        : "border-transparent bg-gray-50 text-[#64748b] hover:border-[#cbd5e1]"
                    }`}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
                      selectedStopId === stop.id ? "bg-[#1e3b8a] text-white" : "bg-[#e2e8f0] text-[#64748b]"
                    }`}>{stop.order}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{stop.name}</span>
                    {stop.lat == null || stop.lng == null ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600">
                        <MousePointer2 className="h-3 w-3" /> 위치 지정
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-700">설정됨</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">숨은 보정점</h3>
              {shapePoints.length === 0 ? (
                <p className="font-['Public_Sans'] text-[#94a3b8] text-[12px]">보정점이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {shapePoints.map((point, index) => (
                    <div key={`${point.afterStopOrder}-${point.order}-${index}`} className="px-3 py-2 rounded-lg bg-orange-50 font-['Public_Sans'] text-[12px] text-orange-800">
                      {index + 1}. {point.name || "경로 보정점"} · {point.afterStopOrder}번 정류장 뒤
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white font-['Public_Sans'] font-semibold text-[14px] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "저장 중..." : "지도 경로 저장"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
