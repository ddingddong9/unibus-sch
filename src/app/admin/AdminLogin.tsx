import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    
    if (!email.trim()) {
      setError("이메일을 입력해주세요");
      return;
    }
    
    if (!password.trim()) {
      setError("비밀번호를 입력해주세요");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      
      // 관리자 권한 확인
      if (response.user.role !== 'admin') {
        setError("관리자 권한이 없습니다.");
        return;
      }
      
      // AuthContext 상태 업데이트
      login(response.token, response.user);
      
      // 대시보드로 이동
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3b8a] to-[#3b82f6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3b8a] rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[28px] mb-2">관리자 로그인</h1>
          <p className="font-['Public_Sans'] text-[#64748b] text-[14px]">UNIBUS SCH Admin Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="admin@sch.ac.kr"
              className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
            />
          </div>

          <div>
            <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="••••••••"
              className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full h-[48px] bg-[#1e3b8a] text-white font-['Public_Sans'] font-bold text-[16px] rounded-lg shadow-lg hover:bg-[#1e3b8a]/90 active:scale-[0.98] transition-all"
          >
            로그인
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/home")}
            className="font-['Public_Sans'] text-[#64748b] text-[14px] hover:text-[#1e3b8a] transition-colors"
          >
            ← 일반 사용자 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}