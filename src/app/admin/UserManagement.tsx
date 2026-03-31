import { useState, useEffect } from "react";
import { Search, Users, ShieldCheck, Bus, User } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  role: 'user' | 'admin' | 'driver';
  provider: string;
  createdAt: string;
}

const ROLE_CONFIG = {
  user:   { label: "일반 사용자", color: "bg-gray-100 text-gray-600",   icon: User },
  driver: { label: "버스 기사",   color: "bg-blue-100 text-blue-700",   icon: Bus },
  admin:  { label: "관리자",      color: "bg-purple-100 text-purple-700", icon: ShieldCheck },
};

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | ManagedUser["role"]>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      showToast("사용자 목록을 불러올 수 없습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: ManagedUser["role"]) => {
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast("역할이 변경되었습니다", "success");
    } catch (err: any) {
      showToast(err.message || "역할 변경에 실패했습니다", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.studentId?.includes(searchQuery) ?? false);
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const counts = {
    all:    users.length,
    user:   users.filter(u => u.role === "user").length,
    driver: users.filter(u => u.role === "driver").length,
    admin:  users.filter(u => u.role === "admin").length,
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">
              사용자 관리
            </h1>
            <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
              총 {users.length}명의 가입자
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {([
            { key: "all",    label: "전체",       icon: Users,       color: "bg-slate-500" },
            { key: "user",   label: "일반 사용자", icon: User,        color: "bg-gray-500" },
            { key: "driver", label: "버스 기사",   icon: Bus,         color: "bg-blue-500" },
            { key: "admin",  label: "관리자",      icon: ShieldCheck, color: "bg-purple-500" },
          ] as const).map(stat => (
            <button
              key={stat.key}
              onClick={() => setFilterRole(stat.key)}
              className={`bg-white rounded-xl p-5 shadow-sm border transition-all text-left hover:shadow-md ${
                filterRole === stat.key ? "border-[#1e3b8a] ring-2 ring-[#1e3b8a]/20" : "border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-['Public_Sans'] text-[#64748b] text-[13px]">{stat.label}</span>
                <div className={`${stat.color} w-8 h-8 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-['Public_Sans'] font-bold text-[#0f172a] text-[28px]">
                {counts[stat.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 이메일, 학번으로 검색..."
              className="w-full h-[48px] pl-12 pr-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3b8a] mx-auto mb-3" />
                <p className="font-['Public_Sans'] text-[#64748b] text-[14px]">불러오는 중...</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">이름</th>
                  <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">이메일</th>
                  <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">학번</th>
                  <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">가입 방식</th>
                  <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px]">가입일</th>
                  <th className="px-6 py-4 text-left font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] w-[200px]">역할</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center font-['Public_Sans'] text-[#94a3b8] text-[15px]">
                      검색 결과가 없습니다
                    </td>
                  </tr>
                ) : filtered.map((user) => {
                  const roleInfo = ROLE_CONFIG[user.role];
                  const RoleIcon = roleInfo.icon;
                  const isUpdating = updatingId === user.id;

                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1e3b8a]/10 flex items-center justify-center shrink-0">
                            <span className="font-['Public_Sans'] font-bold text-[#1e3b8a] text-[14px]">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-['Public_Sans'] font-medium text-[#0f172a] text-[15px]">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-['Public_Sans'] text-[#64748b] text-[14px]">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 font-['Public_Sans'] text-[#64748b] text-[14px]">
                        {user.studentId || <span className="text-[#cbd5e1]">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full font-['Public_Sans'] text-[12px] font-medium ${
                          user.provider === 'kakao'
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {user.provider === 'kakao' ? '카카오' : '이메일'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-['Public_Sans'] text-[#64748b] text-[14px]">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* 현재 역할 뱃지 */}
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-['Public_Sans'] text-[12px] font-medium ${roleInfo.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleInfo.label}
                          </span>

                          {/* 역할 변경 드롭다운 */}
                          {isUpdating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1e3b8a]" />
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as ManagedUser["role"])}
                              className="h-[32px] px-2 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[13px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-1 focus:ring-[#1e3b8a]/20 cursor-pointer"
                            >
                              <option value="user">일반 사용자</option>
                              <option value="driver">버스 기사</option>
                              <option value="admin">관리자</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-xl shadow-lg font-['Public_Sans'] font-medium text-[14px] text-white z-50 transition-all ${
          toast.type === "success" ? "bg-green-600" : "bg-red-500"
        }`}>
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
}
