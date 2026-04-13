import { useLocation, useNavigate } from "react-router";
import svgPaths from "../../imports/svg-l5s7zp6z8c";
import { useLanguage } from "../contexts/LanguageContext";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed backdrop-blur-[12px] bg-[rgba(255,255,255,0.95)] bottom-0 content-stretch flex items-center justify-center left-1/2 -translate-x-1/2 pt-[13px] px-[24px] w-full max-w-[430px] border-t border-[#e2e8f0] z-50 pb-safe-nav">
      <div className="flex items-center justify-between w-full">
        {/* Home */}
        <button
          onClick={() => navigate("/home")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="h-[19.5px] relative shrink-0 w-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 19.5">
              <path d={svgPaths.p39defd40} fill={isActive("/home") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/home") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className="leading-[16.5px]" style={{ color: isActive("/home") ? "#1E3A8A" : "#94A3B8" }}>
              {t("홈", "Home")}
            </p>
          </div>
        </button>

        {/* Bus */}
        <button
          onClick={() => navigate("/campus-shuttle")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="h-[20.583px] relative shrink-0 w-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 20.5833">
              <path d={svgPaths.p5662500} fill={isActive("/campus-shuttle") || isActive("/commuter-bus") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/campus-shuttle") || isActive("/commuter-bus") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className="leading-[16.5px]" style={{ color: isActive("/campus-shuttle") || isActive("/commuter-bus") ? "#1E3A8A" : "#94A3B8" }}>
              {t("버스", "Bus")}
            </p>
          </div>
        </button>

        {/* QR Scanner */}
        <button
          onClick={() => navigate("/qr-scanner")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="h-[18px] relative shrink-0 w-[48px]">
            <div className={`absolute content-stretch flex items-center justify-center left-0 rounded-[9999px] size-[48px] top-[-32px] transition-all ${
              isActive("/qr-scanner") ? "bg-[#1e3a8a]" : "bg-[#e2e8f0]"
            }`}>
              {isActive("/qr-scanner") && (
                <div className="-translate-x-1/2 absolute bg-[rgba(255,255,255,0)] left-1/2 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.3),0px_4px_6px_-4px_rgba(30,58,138,0.3)] size-[48px] top-0" />
              )}
              <div className="relative shrink-0 size-[23.333px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.3333 23.3333">
                  <path d={svgPaths.p27226100} fill={isActive("/qr-scanner") ? "white" : "#94A3B8"} />
                </svg>
              </div>
            </div>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/qr-scanner") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className="leading-[16.5px]" style={{ color: isActive("/qr-scanner") ? "#1E3A8A" : "#94A3B8" }}>
              QR
            </p>
          </div>
        </button>

        {/* Notice */}
        <button
          onClick={() => navigate("/notice")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="h-[21.667px] relative shrink-0 w-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 21.6667">
              <path d={svgPaths.p3827a538} fill={isActive("/notice") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/notice") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className="leading-[16.5px]" style={{ color: isActive("/notice") ? "#1E3A8A" : "#94A3B8" }}>
              {t("공지", "Notice")}
            </p>
          </div>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate("/settings")}
          className="flex flex-col gap-[4px] items-center relative"
        >
          <div className="relative shrink-0 size-[17.333px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 17.3333">
              <path d={svgPaths.p1c6e17c0} fill={isActive("/settings") ? "#1E3A8A" : "#94A3B8"} />
            </svg>
          </div>
          <div className={`flex flex-col font-['Public_Sans'] ${isActive("/settings") ? "font-bold" : "font-medium"} justify-center leading-[0] text-[11px]`}>
            <p className="leading-[16.5px]" style={{ color: isActive("/settings") ? "#1E3A8A" : "#94A3B8" }}>
              {t("프로필", "Profile")}
            </p>
          </div>
        </button>
      </div>

      {/* Bottom Indicator */}
      <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2">
        <div className="bg-[#e2e8f0] h-[6px] rounded-[9999px] w-[128px]" />
      </div>
    </div>
  );
}