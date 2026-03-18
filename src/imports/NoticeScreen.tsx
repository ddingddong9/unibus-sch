import clsx from "clsx";
import svgPaths from "./svg-rp6wd0jwxd";
import imgImage from "figma:asset/ce89d34dc1bf50439de286a67829cf404578f5ec.png";

function Container2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-center relative w-full">{children}</div>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={clsx("relative rounded-[8px] shrink-0 size-[48px]", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">{children}</div>
    </div>
  );
}

function Container1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">{children}</div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-col items-center justify-center size-full">
      <div className="content-stretch flex flex-col h-full items-center justify-center pb-[15px] pt-[8px] relative">{children}</div>
    </div>
  );
}

function BackgroundBorderShadow({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#f1f5f9] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[16px] items-center p-[17px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function Link({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative self-stretch shrink-0">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-b-3 border-solid inset-0 pointer-events-none" />
      <Wrapper>{children}</Wrapper>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[12px] relative shrink-0 w-[7.4px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.4 12">
        <g id="Container">
          <path d={svgPaths.p28c84800} fill="var(--fill-0, #94A3B8)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}
type ContainerText1Props = {
  text: string;
};

function ContainerText1({ text }: ContainerText1Props) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] w-full">
        <p className="leading-[20px]">{text}</p>
      </div>
    </div>
  );
}
type ContainerTextProps = {
  text: string;
};

function ContainerText({ text }: ContainerTextProps) {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full">
      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-full">
        <p className="leading-[22px]">{text}</p>
      </div>
    </div>
  );
}

export default function NoticeScreen() {
  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col gap-[0.5px] items-start relative size-full" data-name="Notice Screen">
      <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[44.28px]">
        <p className="leading-[24px]">```html</p>
      </div>
      <div className="bg-[#f6f6f8] content-stretch flex flex-col isolate items-start max-w-[430px] min-h-[1007px] overflow-clip relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full" data-name="Background+Shadow">
        <div className="backdrop-blur-[6px] bg-[rgba(246,246,248,0.8)] content-stretch flex flex-col items-start relative shrink-0 w-full z-[3]" data-name="Overlay+OverlayBlur">
          <div className="relative shrink-0 w-full" data-name="Container">
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex items-center justify-between p-[16px] relative w-full">
                <div className="content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Container">
                  <div className="h-[20px] relative shrink-0 w-[11.775px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.775 20">
                      <g id="Container">
                        <path d={svgPaths.p225a8cc0} fill="var(--fill-0, #0F172A)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Heading 2">
                  <div className="flex flex-col items-center size-full">
                    <div className="content-stretch flex flex-col items-center pr-[40px] relative w-full">
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[23px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[18px] text-center tracking-[-0.27px] w-[136.63px]">
                        <p className="leading-[22.5px]">Announcements</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
            <div aria-hidden="true" className="absolute border-[#e2e8f0] border-b border-solid inset-0 pointer-events-none" />
            <div className="content-stretch flex flex-col items-start pb-px px-[16px] relative w-full">
              <div className="h-[44px] relative shrink-0 w-full" data-name="Container">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[32px] items-start relative size-full">
                  <div className="relative self-stretch shrink-0" data-name="Link">
                    <div aria-hidden="true" className="absolute border-[#1e3a8a] border-b-3 border-solid inset-0 pointer-events-none" />
                    <Wrapper>
                      <Container1>
                        <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[21px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[14px] tracking-[0.21px] w-[19.81px]">
                          <p className="leading-[21px]">All</p>
                        </div>
                      </Container1>
                    </Wrapper>
                  </div>
                  <Link>
                    <Container1>
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[21px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] tracking-[0.21px] w-[80.47px]">
                        <p className="leading-[21px]">Shuttle Bus</p>
                      </div>
                    </Container1>
                  </Link>
                  <Link>
                    <Container1>
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[21px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] tracking-[0.21px] w-[67.69px]">
                        <p className="leading-[21px]">Academic</p>
                      </div>
                    </Container1>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute backdrop-blur-[8px] bg-[rgba(255,255,255,0.95)] bottom-[24px] content-stretch flex flex-col items-start left-0 max-w-[430px] pb-[32px] pt-[13px] px-[16px] right-0 z-[2]" data-name="Background+HorizontalBorder+OverlayBlur">
          <div aria-hidden="true" className="absolute border-[#e2e8f0] border-solid border-t inset-0 pointer-events-none" />
          <div className="relative shrink-0 w-full" data-name="Container">
            <div className="flex flex-row items-center size-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between pl-[8px] pr-[8.01px] relative w-full">
                <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                  <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
                      <g id="Container">
                        <path d={svgPaths.p12a32500} fill="var(--fill-0, #94A3B8)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] tracking-[0.15px] w-[28.3px]">
                      <p className="leading-[15px]">Home</p>
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
                    <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] tracking-[0.15px] w-[18.16px]">
                      <p className="leading-[15px]">Bus</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                  <div className="h-[30px] relative shrink-0 w-[48px]" data-name="Margin">
                    <div className="absolute left-0 size-[43px] top-[-24px]" data-name="Background+Border+Shadow">
                      <div className="absolute inset-[-2.33%_-4.65%_-6.98%_-4.65%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47 47">
                          <g filter="url(#filter0_d_1_2540)" id="Background+Border+Shadow">
                            <rect fill="var(--fill-0, #F1F5F9)" height="43" rx="21.5" shapeRendering="crispEdges" width="43" x="2" y="1" />
                            <rect height="42" rx="21" shapeRendering="crispEdges" stroke="var(--stroke-0, #E2E8F0)" width="42" x="2.5" y="1.5" />
                            <path d={svgPaths.pf708a00} fill="var(--fill-0, #475569)" id="Icon" />
                          </g>
                          <defs>
                            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="47" id="filter0_d_1_2540" width="47" x="0" y="0">
                              <feFlood floodOpacity="0" result="BackgroundImageFix" />
                              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                              <feOffset dy="1" />
                              <feGaussianBlur stdDeviation="1" />
                              <feComposite in2="hardAlpha" operator="out" />
                              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
                              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_2540" />
                              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_2540" mode="normal" result="shape" />
                            </filter>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] tracking-[0.15px] w-[14.67px]">
                      <p className="leading-[15px]">QR</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                  <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                      <g id="Container">
                        <path d={svgPaths.p210fe134} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] tracking-[0.15px] w-[32.23px]">
                      <p className="leading-[15px]">Notice</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
                  <div className="relative shrink-0 size-[16px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <g id="Container">
                        <path d={svgPaths.p85bff00} fill="var(--fill-0, #94A3B8)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] tracking-[0.15px] w-[31.94px]">
                      <p className="leading-[15px]">Profile</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-center overflow-clip pb-[151.75px] pt-[16px] relative shrink-0 w-full z-[1]" data-name="Container">
          <div className="bg-white relative rounded-[12px] shrink-0 w-[358px]" data-name="Background+Border+Shadow">
            <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] w-full">
              <div className="aspect-video relative shrink-0 w-full" data-name="Image">
                <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
                  <img alt="" className="absolute h-[177.78%] left-0 max-w-none top-[-38.89%] w-full" src={imgImage} />
                </div>
              </div>
              <div className="h-[140px] relative shrink-0 w-full" data-name="Container">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                  <div className="absolute content-stretch flex items-center left-[16px] right-[16px] top-[16px]" data-name="Container">
                    <div className="bg-[rgba(30,58,138,0.1)] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Overlay">
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] tracking-[0.5px] uppercase w-[83.02px]">
                        <p className="leading-[15px]">Major Update</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute content-stretch flex flex-col items-start left-[16px] pb-[0.75px] right-[16px] top-[42.25px]" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[45px] justify-center leading-[22.5px] relative shrink-0 text-[#0f172a] text-[18px] tracking-[-0.45px] w-[261.58px]">
                      <p className="mb-0">2024 Fall Semester Shuttle Bus</p>
                      <p>Schedule Update</p>
                    </div>
                  </div>
                  <div className="absolute content-stretch flex flex-col items-start left-[16px] pt-[4px] right-[16px] top-[96px]" data-name="Margin">
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
                      <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                        <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[12px] w-[92.91px]">
                          <p className="leading-[16px]">August 25, 2024</p>
                        </div>
                      </div>
                      <div className="h-[15px] relative shrink-0 w-[22px]" data-name="Container">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 15">
                          <g id="Container">
                            <path d={svgPaths.p3e801e80} fill="var(--fill-0, #94A3B8)" id="Icon" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-[#f1f5f9] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
          </div>
          <div className="relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex flex-col gap-[12px] items-start px-[16px] relative w-full">
              <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border+Shadow">
                <div aria-hidden="true" className="absolute border-[#f1f5f9] border-b border-l-4 border-r border-solid border-t inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex gap-[16px] items-center pl-[20px] pr-[17px] py-[17px] relative w-full">
                    <Wrapper1 additionalClassNames="bg-[#fef2f2]">
                      <div className="h-[19px] relative shrink-0 w-[22px]" data-name="Container">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 19">
                          <g id="Container">
                            <path d={svgPaths.p7555480} fill="var(--fill-0, #DC2626)" id="Icon" />
                          </g>
                        </svg>
                      </div>
                    </Wrapper1>
                    <Container2>
                      <ContainerText text="Emergency Maintenance:…" />
                      <ContainerText1 text="Today, 09:15 AM" />
                    </Container2>
                    <Container />
                  </div>
                </div>
              </div>
              <BackgroundBorderShadow>
                <Wrapper1 additionalClassNames="bg-[rgba(30,58,138,0.1)]">
                  <div className="h-[16px] relative shrink-0 w-[20px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 16">
                      <g id="Container">
                        <path d={svgPaths.p12092b00} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                </Wrapper1>
                <Container2>
                  <ContainerText text="New Sinchang Station Rou…" />
                  <ContainerText1 text="September 01, 2024" />
                </Container2>
                <Container />
              </BackgroundBorderShadow>
              <BackgroundBorderShadow>
                <Wrapper1 additionalClassNames="bg-[#f1f5f9]">
                  <div className="relative shrink-0 size-[20px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Container">
                        <path d={svgPaths.p6c8ea80} fill="var(--fill-0, #475569)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                </Wrapper1>
                <Container2>
                  <ContainerText text="Lost and Found: Blue…" />
                  <ContainerText1 text="August 28, 2024" />
                </Container2>
                <Container />
              </BackgroundBorderShadow>
              <BackgroundBorderShadow>
                <Wrapper1 additionalClassNames="bg-[#f1f5f9]">
                  <div className="h-[20px] relative shrink-0 w-[18px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
                      <g id="Container">
                        <path d={svgPaths.p3c95900} fill="var(--fill-0, #475569)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                </Wrapper1>
                <Container2>
                  <ContainerText text="Chuseok Holiday Operatio…" />
                  <ContainerText1 text="August 27, 2024" />
                </Container2>
                <Container />
              </BackgroundBorderShadow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}