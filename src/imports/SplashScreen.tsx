import svgPaths from "./svg-8dqi9udht8";

export default function SplashScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center size-full relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #1e3a8a 0%, #1e40af 55%, #1d4ed8 100%)" }}
    >
      {/* 배경 글로우 효과 */}
      <div className="absolute top-[8%] right-[-8%] w-[240px] h-[240px] bg-white/5 rounded-full blur-[64px]" />
      <div className="absolute bottom-[15%] left-[-8%] w-[180px] h-[180px] bg-white/5 rounded-full blur-[48px]" />

      {/* 앱 아이콘 */}
      <div className="bg-white rounded-[24px] shadow-2xl mb-8 size-[120px] flex items-center justify-center">
        <div className="bg-[#1e3b8a] size-[88px] rounded-[16px] flex items-center justify-center">
          <div className="h-[40px] w-[50px] relative">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 55 45">
              <path d={svgPaths.p32d34d20} fill="white" />
            </svg>
          </div>
        </div>
      </div>

      {/* 앱 이름 */}
      <h1 className="text-white text-[28px] font-['Public_Sans'] font-bold tracking-[-0.5px] mb-[6px]">
        UNIBUS
      </h1>
      <p className="text-white/60 text-[12px] font-['Public_Sans'] tracking-[2.5px] uppercase">
        순천향대 통학버스
      </p>
    </div>
  );
}
