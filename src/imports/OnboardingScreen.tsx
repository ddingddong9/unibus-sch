import imgImageOverlayBorderShadow from "figma:asset/aed670d1c9a3a5d65e0b62eeadb97ad7be78aecf.png";

export default function OnboardingScreen() {
  return (
    <div className="content-stretch flex flex-col items-start relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] size-full" data-name="Onboarding Screen" style={{ backgroundImage: "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(246, 246, 248) 0%, rgb(246, 246, 248) 100%)" }}>
      <div className="relative shrink-0 w-full" data-name="Header">
        <div className="flex flex-row items-center justify-end size-full">
          <div className="content-stretch flex items-center justify-end pb-[16px] pl-[322.66px] pr-[32px] pt-[24px] relative w-full">
            <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Button">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] text-center tracking-[0.24px] w-[35.34px]">
                <p className="leading-[24px]">Skip</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative shrink-0 w-full" data-name="Hero Section">
        <div className="content-stretch flex flex-col items-start px-[16px] py-[24px] relative w-full">
          <div className="h-[380px] min-h-[380px] pointer-events-none relative rounded-[12px] shrink-0 w-full" data-name="Image+Overlay+Border+Shadow">
            <div aria-hidden="true" className="absolute inset-0 rounded-[12px]">
              <div className="absolute bg-[rgba(30,59,138,0.05)] inset-0 rounded-[12px]" />
              <div className="absolute inset-0 overflow-hidden rounded-[12px]">
                <img alt="" className="absolute h-[99.47%] left-[-2.79%] max-w-none top-[0.26%] w-[105.59%]" src={imgImageOverlayBorderShadow} />
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-[rgba(30,59,138,0.1)] border-solid inset-0 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
          </div>
        </div>
      </div>
      <div className="relative shrink-0 w-full" data-name="Content Section">
        <div className="flex flex-col items-center size-full">
          <div className="content-stretch flex flex-col items-center pb-[16px] pt-[32px] px-[32px] relative w-full">
            <div className="content-stretch flex flex-col items-center pb-[16px] relative shrink-0" data-name="Heading 1">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[40px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[32px] text-center tracking-[-0.8px] w-[146.97px]">
                <p className="leading-[40px]">Track Live</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-center pl-[3.09px] pr-[3.11px] relative shrink-0" data-name="Container">
              <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[88px] justify-center leading-[29.25px] relative shrink-0 text-[#475569] text-[18px] text-center w-[319.8px]">
                <p className="mb-0">{`Monitor your shuttle's exact location in`}</p>
                <p className="mb-0">real-time and never miss a ride around</p>
                <p>SCH campus.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[12px] items-center justify-center py-[32px] relative shrink-0 w-full" data-name="Pagination Indicators">
        <div className="bg-[rgba(30,59,138,0.2)] rounded-[9999px] shrink-0 size-[8px]" data-name="Overlay" />
        <div className="bg-[rgba(30,59,138,0.2)] rounded-[9999px] shrink-0 size-[8px]" data-name="Overlay" />
        <div className="bg-[#1e3b8a] h-[8px] rounded-[9999px] shrink-0 w-[32px]" data-name="Background" />
        <div className="bg-[rgba(30,59,138,0.2)] rounded-[9999px] shrink-0 size-[8px]" data-name="Overlay" />
      </div>
      <div className="relative shrink-0 w-full" data-name="Action Button">
        <div className="content-stretch flex flex-col items-start pb-[48px] pt-[16px] px-[24px] relative w-full">
          <div className="bg-[#1e3b8a] content-stretch flex items-center justify-center py-[16px] relative rounded-[12px] shrink-0 w-full" data-name="Button">
            <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(30,59,138,0.2),0px_4px_6px_-4px_rgba(30,59,138,0.2)]" data-name="Button:shadow" />
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[28px] justify-center leading-[0] relative shrink-0 text-[18px] text-center text-white w-[101.03px]">
              <p className="leading-[28px]">Get Started</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[16px] shrink-0 w-full" data-name="iOS Home Indicator Spacing" />
    </div>
  );
}