import svgPaths from "./svg-r2m9fbirfq";
import imgStudentProfile from "figma:asset/9ecac9aff124d03ee418c41f0e6e63ea9811a42b.png";

function Container1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative">{children}</div>
    </div>
  );
}

function Overlay({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[36px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="Overlay">{children}</g>
      </svg>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[16px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#f1f5f9] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pb-[17px] pt-[16px] px-[16px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[12px] relative shrink-0 w-[7.4px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.4 12">
        <g id="Container">
          <path d={svgPaths.p28c84800} fill="var(--fill-0, #64748B)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

export default function SettingsScreen() {
  return (
    <div className="bg-[#f6f6f8] relative size-full" data-name="Settings Screen">
      <div className="absolute content-stretch flex flex-col gap-[24px] items-start left-0 overflow-clip pb-[38px] right-0 top-[61px]" data-name="Main">
        <div className="bg-white h-[209px] relative shrink-0 w-full" data-name="Background+HorizontalBorder">
          <div aria-hidden="true" className="absolute border-[#e2e8f0] border-b border-solid inset-0 pointer-events-none" />
          <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-start left-[calc(50%-0.01px)] top-[136px]" data-name="Heading 2">
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[28px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[20px] w-[235.02px]">
              <p className="leading-[28px]">Soonchunhyang Student</p>
            </div>
          </div>
          <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-start left-1/2 top-[164px]" data-name="Container">
            <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] w-[217.11px]">
              <p className="leading-[20px]">ID: 20231234 • Computer Science</p>
            </div>
          </div>
          <div className="absolute content-stretch flex flex-col items-start left-[147px] pb-[16px] top-[24px]" data-name="Margin">
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
              <div className="bg-[#e2e8f0] relative rounded-[9999px] shrink-0 size-[96px]" data-name="Background+Border">
                <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
                  <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Student profile">
                    <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
                      <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgStudentProfile} />
                    </div>
                  </div>
                </div>
                <div aria-hidden="true" className="absolute border-2 border-[rgba(30,58,138,0.2)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
              </div>
              <div className="absolute bottom-0 right-0 size-[26.5px]" data-name="Background+Border">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26.5 26.5">
                  <g id="Background+Border">
                    <rect fill="var(--fill-0, #1E3A8A)" height="24.5" rx="12.25" width="24.5" x="1" y="1" />
                    <rect height="24.5" rx="12.25" stroke="var(--stroke-0, white)" strokeWidth="2" width="24.5" x="1" y="1" />
                    <path d={svgPaths.p1a64bde0} fill="var(--fill-0, white)" id="Icon" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Container">
          <div className="content-stretch flex flex-col gap-[24px] items-start px-[16px] relative w-full">
            <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-full" data-name="Section">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-[350px]" data-name="Heading 3">
                <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[12px] tracking-[0.6px] uppercase w-[100.8px]">
                  <p className="leading-[16px]">Notifications</p>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Background+Shadow">
                <Wrapper>
                  <Container1>
                    <div className="h-[36px] relative shrink-0 w-[32px]" data-name="Overlay">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 36">
                        <g id="Overlay">
                          <rect fill="var(--fill-0, #1E3A8A)" fillOpacity="0.1" height="36" rx="8" width="32" />
                          <path d={svgPaths.p121cc980} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                        </g>
                      </svg>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[136.5px]">
                        <p className="leading-[24px]">Push Notifications</p>
                      </div>
                    </div>
                  </Container1>
                  <div className="bg-[#1e3a8a] h-[31px] relative rounded-[9999px] shrink-0 w-[51px]" data-name="Label">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-end p-[2px] relative size-full">
                      <div className="bg-white h-full relative rounded-[9999px] shrink-0 w-[27px]" data-name="Background">
                        <div className="absolute bg-[rgba(255,255,255,0)] bottom-0 right-0 rounded-[9999px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] top-0 w-[27px]" data-name="Overlay+Shadow" />
                      </div>
                    </div>
                  </div>
                </Wrapper>
                <Wrapper1>
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Container">
                    <div className="h-[35px] relative shrink-0 w-[32px]" data-name="Overlay">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 35">
                        <g id="Overlay">
                          <rect fill="var(--fill-0, #1E3A8A)" fillOpacity="0.1" height="35" rx="8" width="32" />
                          <path d={svgPaths.p1c40be00} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                        </g>
                      </svg>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[131.55px]">
                        <p className="leading-[24px]">Bus Arrival Alerts</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#e2e8f0] content-stretch flex h-[31px] items-center p-[2px] relative rounded-[9999px] shrink-0 w-[51px]" data-name="Label">
                    <div className="bg-white h-full relative rounded-[9999px] shrink-0 w-[27px]" data-name="Background">
                      <div className="absolute bg-[rgba(255,255,255,0)] bottom-0 left-0 rounded-[9999px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] top-0 w-[27px]" data-name="Overlay+Shadow" />
                    </div>
                  </div>
                </Wrapper1>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-full" data-name="Section">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-[350px]" data-name="Heading 3">
                <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[12px] tracking-[0.6px] uppercase w-[94.89px]">
                  <p className="leading-[16px]">App Settings</p>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Background+Shadow">
                <Wrapper>
                  <Container1>
                    <Overlay>
                      <rect fill="var(--fill-0, #1E3A8A)" fillOpacity="0.1" height="36" rx="8" width="36" />
                      <path d={svgPaths.p27737e00} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                    </Overlay>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[74.09px]">
                        <p className="leading-[24px]">Language</p>
                      </div>
                    </div>
                  </Container1>
                  <div className="relative shrink-0" data-name="Container">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative">
                      <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                        <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] w-[48.09px]">
                          <p className="leading-[20px]">English</p>
                        </div>
                      </div>
                      <Container />
                    </div>
                  </div>
                </Wrapper>
                <Wrapper>
                  <Container1>
                    <div className="relative shrink-0 size-[34px]" data-name="Overlay">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 34">
                        <g id="Overlay">
                          <rect fill="var(--fill-0, #1E3A8A)" fillOpacity="0.1" height="34" rx="8" width="34" />
                          <path d={svgPaths.p51a7700} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                        </g>
                      </svg>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[90.59px]">
                        <p className="leading-[24px]">Appearance</p>
                      </div>
                    </div>
                  </Container1>
                  <div className="relative shrink-0" data-name="Container">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[3.99px] items-center relative">
                      <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                        <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] w-[49.05px]">
                          <p className="leading-[20px]">System</p>
                        </div>
                      </div>
                      <Container />
                    </div>
                  </div>
                </Wrapper>
                <Wrapper1>
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Container">
                    <Overlay>
                      <rect fill="var(--fill-0, #1E3A8A)" fillOpacity="0.1" height="36" rx="8" width="36" />
                      <path d={svgPaths.p1988dd00} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                    </Overlay>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[115.89px]">
                        <p className="leading-[24px]">{`Help & Support`}</p>
                      </div>
                    </div>
                  </div>
                  <Container />
                </Wrapper1>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[24px] items-start pb-[48px] pt-[16px] relative shrink-0 w-full" data-name="Container">
              <div className="bg-[#1e3a8a] content-stretch flex gap-[7.99px] items-center justify-center py-[16px] relative rounded-[12px] shrink-0 w-full" data-name="Button">
                <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.2),0px_4px_6px_-4px_rgba(30,58,138,0.2)]" data-name="Button:shadow" />
                <div className="relative shrink-0 size-[18px]" data-name="Container">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                    <g id="Container">
                      <path d={svgPaths.p3e9df400} fill="var(--fill-0, white)" id="Icon" />
                    </g>
                  </svg>
                </div>
                <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[24px] justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white w-[53.38px]">
                  <p className="leading-[24px]">Logout</p>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[12px] text-center w-[98.95px]">
                  <p className="leading-[16px]">Version 1.0 (2026)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-white content-stretch flex flex-col items-start left-0 pb-[20px] pt-px right-0 top-[951px]" data-name="Nav">
        <div aria-hidden="true" className="absolute border-[#e2e8f0] border-solid border-t inset-0 pointer-events-none" />
        <div className="h-[64px] relative shrink-0 w-full" data-name="Container">
          <div className="flex flex-row items-center size-full">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[24px] relative size-full">
              <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Container">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
                    <g id="Container">
                      <path d={svgPaths.p12a32500} fill="var(--fill-0, #94A3B8)" id="Icon" />
                    </g>
                  </svg>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[10px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] w-[27.7px]">
                    <p className="leading-[10px]">Home</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                <div className="h-[19px] relative shrink-0 w-[16px]" data-name="Container">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 19">
                    <g id="Container">
                      <path d={svgPaths.pdce8f20} fill="var(--fill-0, #94A3B8)" id="Icon" />
                    </g>
                  </svg>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[10px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] w-[17.7px]">
                    <p className="leading-[10px]">Bus</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                <div className="h-[26px] relative shrink-0 w-[42.02px]" data-name="Margin">
                  <div className="absolute left-0 size-[38px] top-[-16px]" data-name="Background+Border+Shadow">
                    <div className="absolute inset-[-2.63%_-5.26%_-7.89%_-5.26%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 42 42">
                        <g filter="url(#filter0_d_1_2600)" id="Background+Border+Shadow">
                          <rect fill="var(--fill-0, #F1F5F9)" height="38" rx="8" shapeRendering="crispEdges" width="38" x="2" y="1" />
                          <rect height="37" rx="7.5" shapeRendering="crispEdges" stroke="var(--stroke-0, #E2E8F0)" width="37" x="2.5" y="1.5" />
                          <path d={svgPaths.p34ac1380} fill="var(--fill-0, #94A3B8)" id="Icon" />
                        </g>
                        <defs>
                          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="42" id="filter0_d_1_2600" width="42" x="0" y="0">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="1" />
                            <feGaussianBlur stdDeviation="1" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_2600" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_2600" mode="normal" result="shape" />
                          </filter>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[10px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] w-[14.38px]">
                    <p className="leading-[10px]">QR</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                    <g id="Container">
                      <path d={svgPaths.p164b49c0} fill="var(--fill-0, #94A3B8)" id="Icon" />
                    </g>
                  </svg>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[10px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] w-[30.61px]">
                    <p className="leading-[10px]">Notice</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                <div className="relative shrink-0 size-[16px]" data-name="Container">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                    <g id="Container">
                      <path d={svgPaths.p301d5280} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                    </g>
                  </svg>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[10px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] w-[31.66px]">
                    <p className="leading-[10px]">Profile</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-white content-stretch flex items-center left-0 pb-[17px] pt-[16px] px-[16px] right-0 top-0" data-name="Header">
        <div aria-hidden="true" className="absolute border-[#e2e8f0] border-b border-solid inset-0 pointer-events-none" />
        <div className="relative shrink-0" data-name="Button">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative">
            <div className="h-[20px] relative shrink-0 w-[11.775px]" data-name="Container">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.775 20">
                <g id="Container">
                  <path d={svgPaths.p225a8cc0} fill="var(--fill-0, #0F172A)" id="Icon" />
                </g>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Heading 1">
          <div className="flex flex-col items-center size-full">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center pr-[32px] relative w-full">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[28px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[18px] text-center tracking-[-0.45px] w-[69.36px]">
                <p className="leading-[28px]">Settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[1.047px] items-center justify-center left-[374px] top-[529.98px] w-[138px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "18" } as React.CSSProperties}>
        <div className="flex-none rotate-[-0.43deg]">
          <div className="h-0 relative w-[138.004px]">
            <div className="absolute inset-[-7.36px_-0.72%_-7.36px_-3.86%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 144.337 14.7279">
                <path d={svgPaths.p33932a00} fill="var(--stroke-0, black)" id="Arrow 26" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}