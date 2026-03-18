import { useState } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, MapPin, Clock, Search } from "lucide-react";
import AdminLayout from "./AdminLayout";

interface BusRoute {
  id: number;
  name: string;
  type: "campus" | "commuter";
  stops: string[];
  schedule: string[];
  isActive: boolean;
}

export default function RouteManagement() {
  const [routes, setRoutes] = useState<BusRoute[]>([
    {
      id: 1,
      name: "캠퍼스 순환 A",
      type: "campus",
      stops: ["본관", "도서관", "기숙사", "체육관"],
      schedule: ["08:00", "09:00", "10:00", "11:00"],
      isActive: true,
    },
    {
      id: 2,
      name: "천안역 직행",
      type: "commuter",
      stops: ["천안역", "본교"],
      schedule: ["07:30", "08:30", "17:30", "18:30"],
      isActive: true,
    },
    {
      id: 3,
      name: "캠퍼스 순환 B",
      type: "campus",
      stops: ["본관", "공학관", "학생회관", "기숙사"],
      schedule: ["08:30", "09:30", "10:30", "11:30"],
      isActive: true,
    },
    {
      id: 4,
      name: "병천 직행",
      type: "commuter",
      stops: ["병천터미널", "본교"],
      schedule: ["08:00", "09:00", "18:00", "19:00"],
      isActive: false,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "campus" as "campus" | "commuter",
    stops: "",
    schedule: "",
    isActive: true,
  });

  const handleCreate = () => {
    setEditingRoute(null);
    setFormData({
      name: "",
      type: "campus",
      stops: "",
      schedule: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (route: BusRoute) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      type: route.type,
      stops: route.stops.join(", "),
      schedule: route.schedule.join(", "),
      isActive: route.isActive,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const stops = formData.stops.split(",").map(s => s.trim()).filter(s => s);
    const schedule = formData.schedule.split(",").map(s => s.trim()).filter(s => s);

    if (editingRoute) {
      setRoutes(routes.map(r => 
        r.id === editingRoute.id 
          ? { ...r, ...formData, stops, schedule }
          : r
      ));
    } else {
      const newRoute: BusRoute = {
        id: Date.now(),
        name: formData.name,
        type: formData.type,
        stops,
        schedule,
        isActive: formData.isActive,
      };
      setRoutes([...routes, newRoute]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("이 노선을 삭제하시겠습니까?")) {
      setRoutes(routes.filter(r => r.id !== id));
    }
  };

  const toggleActive = (id: number) => {
    setRoutes(routes.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const campusRoutes = filteredRoutes.filter(r => r.type === "campus");
  const commuterRoutes = filteredRoutes.filter(r => r.type === "commuter");

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
              총 {routes.length}개의 노선 (운행중: {routes.filter(r => r.isActive).length}개)
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-[#1e3b8a] text-white font-['Public_Sans'] font-semibold text-[15px] rounded-lg hover:bg-[#1e3b8a]/90 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            새 노선 추가
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
              placeholder="노선 검색..."
              className="w-full h-[48px] pl-12 pr-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
            />
          </div>
        </div>

        {/* Campus Routes */}
        <div className="mb-8">
          <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">
            캠퍼스 셔틀 ({campusRoutes.length})
          </h2>
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
        </div>

        {/* Commuter Routes */}
        <div>
          <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">
            통근 버스 ({commuterRoutes.length})
          </h2>
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
        </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    노선명
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    placeholder="예: 캠퍼스 순환 A"
                  />
                </div>

                <div>
                  <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                    노선 유형
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "campus" | "commuter" })}
                    className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  >
                    <option value="campus">캠퍼스 셔틀</option>
                    <option value="commuter">통근 버스</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  정류장 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.stops}
                  onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  placeholder="예: 본관, 도서관, 기숙사, 체육관"
                />
              </div>

              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  운행 시간 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  placeholder="예: 08:00, 09:00, 10:00, 11:00"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-[#1e3b8a] border-gray-300 rounded focus:ring-[#1e3b8a]"
                />
                <label htmlFor="isActive" className="font-['Public_Sans'] text-[#0f172a] text-[14px] font-medium">
                  노선 활성화
                </label>
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
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
}

function RouteCard({ route, onEdit, onDelete, onToggleActive }: RouteCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px]">
              {route.name}
            </h3>
          </div>
          <button
            onClick={() => onToggleActive(route.id)}
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
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[#64748b]" />
            <h4 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">
              정류장
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {route.stops.map((stop, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-['Public_Sans'] text-[13px]">
                {stop}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#64748b]" />
            <h4 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">
              운행 시간
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {route.schedule.map((time, index) => (
              <span key={index} className="px-3 py-1 bg-[#1e3b8a]/10 text-[#1e3b8a] rounded-lg font-['Public_Sans'] text-[13px] font-medium">
                {time}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
