import { useState } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../imports/svg-9blebrmjt8";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";

export default function SignUpWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("이름을 입력해주세요", "Name is required");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("이메일을 입력해주세요", "Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("올바른 이메일 형식이 아닙니다", "Invalid email format");
    }

    if (!formData.password) {
      newErrors.password = t("비밀번호를 입력해주세요", "Password is required");
    } else if (formData.password.length < 6) {
      newErrors.password = t("비밀번호는 최소 6자 이상이어야 합니다", "Password must be at least 6 characters");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("비밀번호가 일치하지 않습니다", "Passwords do not match");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Fixed: Pass object instead of individual parameters
      const result = await api.signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        studentId: formData.studentId || undefined
      });
      console.log("Signup successful:", result);
      
      // Auto login after signup
      const loginResult = await api.login(formData.email, formData.password);
      localStorage.setItem("user", JSON.stringify(loginResult.user));
      navigate("/home");
    } catch (err: any) {
      console.error("Signup error:", err);
      setErrors({ 
        email: t("회원가입에 실패했습니다. 이미 존재하는 이메일일 수 있습니다.", "Signup failed. Email may already exist.")
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-[#f6f6f8] content-stretch flex flex-col items-start relative size-full overflow-auto">
      {/* Header */}
      <div className="bg-white relative shrink-0 w-full sticky top-0 z-10 border-b border-[#f1f5f9]">
        <div className="flex items-center justify-between pb-[8px] pt-[48px] px-[16px]">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center justify-center size-[40px] hover:bg-gray-100 rounded-full active:scale-95 transition-all"
          >
            <svg className="w-3 h-5" fill="none" viewBox="0 0 12 20" stroke="#0F172A" strokeWidth="2">
              <path d="M11 1L1 10L11 19" />
            </svg>
          </button>

          <div className="flex flex-col font-['Public_Sans'] font-bold h-[23px] justify-center leading-[0] text-[#0f172a] text-[18px] text-center tracking-[-0.27px]">
            <p className="leading-[22.5px]">Sign Up</p>
          </div>

          <div className="w-[40px]" />
        </div>
      </div>

      <div className="flex-1 w-full px-[24px] py-[32px]">
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="flex gap-[8px] items-center mb-4">
            <div className="bg-[#1e3b8a] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]">
              <div className="h-[19px] relative shrink-0 w-[16px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 19">
                  <path d={svgPaths.pdce8f20} fill="white" />
                </svg>
              </div>
            </div>
            <div className="font-['Public_Sans'] font-bold text-[#1e3b8a] text-[20px] tracking-[-0.5px] leading-[28px]">UNIBUS SCH</div>
          </div>

          <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[28px] tracking-[-0.7px] leading-[35px] mb-2">
            Create Account
          </h1>
          <p className="font-['Public_Sans'] font-normal text-[#64748b] text-[16px] leading-[24px]">
            Join SCH University shuttle service
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[21px] block mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter your full name"
              className={`w-full h-[56px] px-4 bg-white border rounded-[8px] font-['Public_Sans'] text-[16px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-[#cbd5e1] focus:border-[#1e3b8a] focus:ring-[#1e3b8a]/20"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-red-500 text-sm font-['Public_Sans']">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[21px] block mb-2">
              Student ID
            </label>
            <input
              type="text"
              value={formData.studentId}
              onChange={(e) => handleChange("studentId", e.target.value)}
              placeholder="Enter your student ID"
              className={`w-full h-[56px] px-4 bg-white border rounded-[8px] font-['Public_Sans'] text-[16px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 transition-all ${
                errors.studentId
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-[#cbd5e1] focus:border-[#1e3b8a] focus:ring-[#1e3b8a]/20"
              }`}
            />
            {errors.studentId && (
              <p className="mt-1 text-red-500 text-sm font-['Public_Sans']">{errors.studentId}</p>
            )}
          </div>

          <div>
            <label className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[21px] block mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="student@sch.ac.kr"
              className={`w-full h-[56px] px-4 bg-white border rounded-[8px] font-['Public_Sans'] text-[16px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-[#cbd5e1] focus:border-[#1e3b8a] focus:ring-[#1e3b8a]/20"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-red-500 text-sm font-['Public_Sans']">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[21px] block mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Create a password"
              className={`w-full h-[56px] px-4 bg-white border rounded-[8px] font-['Public_Sans'] text-[16px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-[#cbd5e1] focus:border-[#1e3b8a] focus:ring-[#1e3b8a]/20"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-red-500 text-sm font-['Public_Sans']">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] leading-[21px] block mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              className={`w-full h-[56px] px-4 bg-white border rounded-[8px] font-['Public_Sans'] text-[16px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-[#cbd5e1] focus:border-[#1e3b8a] focus:ring-[#1e3b8a]/20"
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-red-500 text-sm font-['Public_Sans']">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-[#1e3a8a] h-[56px] rounded-[12px] font-['Public_Sans'] font-bold text-white text-[16px] shadow-[0px_10px_15px_-3px_rgba(30,59,138,0.2),0px_4px_6px_-4px_rgba(30,59,138,0.2)] hover:bg-[#1e3a8a]/90 active:scale-[0.98] transition-all mb-4"
        >
          {loading ? "Loading..." : "Submit"}
        </button>

        {/* Login Link */}
        <div className="flex gap-1 items-center justify-center">
          <p className="font-['Public_Sans'] font-normal text-[#475569] text-[14px] leading-[20px]">
            Already have an account?
          </p>
          <button
            onClick={() => navigate("/login")}
            className="font-['Public_Sans'] font-bold text-[#0f172a] text-[14px] leading-[20px] hover:text-[#1e3b8a] transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}