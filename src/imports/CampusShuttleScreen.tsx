import clsx from "clsx";
import svgPaths from "./svg-usddjxhhke";
import imgBackgroundShadow from "figma:asset/28043f1a50c7ae9116c073f6c0fa7561621aed90.png";

function Link({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-[72px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-center relative w-full">{children}</div>
    </div>
  );
}

function Container2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-end relative">{children}</div>
    </div>
  );
}

function Container1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative w-full">{children}</div>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={clsx("relative rounded-[12px] shrink-0 size-[48px]", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">{children}</div>
    </div>
  );
}

function Container({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Container">{children}</g>
      </svg>
    </div>
  );
}
type OverlayBorderProps = {
  additionalClassNames?: string;
};

function OverlayBorder({ children, additionalClassNames = "" }: React.PropsWithChildren<OverlayBorderProps>) {
  return (
    <div className={clsx("bg-[rgba(248,250,252,0.5)] relative rounded-[16px] shrink-0 w-full", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border border-[#f1f5f9] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[16px] items-center p-[17px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
        <g id="Container">{children}</g>
      </svg>
    </div>
  );
}

function Background1() {
  return (
    <Wrapper1 additionalClassNames="bg-[#e2e8f0]">
      <Wrapper>
        <path d={svgPaths.p1869180} fill="var(--fill-0, #64748B)" id="Icon" />
      </Wrapper>
    </Wrapper1>
  );
}
type ContainerTextProps = {
  text: string;
};

function ContainerText({ text }: ContainerTextProps) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#64748b] text-[11px] w-full">
        <p className="leading-[16.5px]">{text}</p>
      </div>
    </div>
  );
}
type HeadingTextProps = {
  text: string;
};

function HeadingText({ text }: HeadingTextProps) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-full">
        <p className="leading-[24px]">{text}</p>
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]">
      <div className="-translate-x-1/2 absolute bg-[rgba(255,255,255,0)] left-1/2 rounded-[9999px] shadow-[0px_0px_0px_4px_white,0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[40px] top-0" data-name="Overlay+Shadow" />
      <div className="h-[15.833px] relative shrink-0 w-[13.333px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 15.8333">
          <g id="Container">
            <path d={svgPaths.pce8c080} fill="var(--fill-0, white)" id="Icon" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function CampusShuttleScreen() {
  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-center pb-[40px] relative size-full" data-name="Campus Shuttle Screen">
      <div className="bg-[#f6f6f8] h-[844px] overflow-clip relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-[390px]" data-name="Background+Shadow">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute bg-[#e2e8f0] inset-0" />
          <div className="absolute inset-0 overflow-hidden">
            <img alt="" className="absolute h-full left-[-58.21%] max-w-none top-0 w-[216.41%]" src={imgBackgroundShadow} />
          </div>
        </div>
        <div className="absolute content-stretch flex flex-col items-center left-[140px] top-[280px]" data-name="Container">
          <Background />
          <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0" data-name="Margin">
            <div className="bg-white content-stretch flex flex-col items-start px-[9px] py-[3px] relative rounded-[4px] shrink-0" data-name="Background+Border+Shadow">
              <div aria-hidden="true" className="absolute border border-[rgba(30,58,138,0.1)] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              <div className="flex flex-col font-['Public_Sans:Black',sans-serif] font-black h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] w-[37.61px]">
                <p className="leading-[15px]">SCH-01</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute content-stretch flex flex-col items-center left-[240px] top-[450px]" data-name="Container">
          <Background />
          <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0" data-name="Margin">
            <div className="bg-white content-stretch flex flex-col items-start px-[9px] py-[3px] relative rounded-[4px] shrink-0" data-name="Background+Border+Shadow">
              <div aria-hidden="true" className="absolute border border-[rgba(30,58,138,0.1)] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              <div className="flex flex-col font-['Public_Sans:Black',sans-serif] font-black h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] w-[40.09px]">
                <p className="leading-[15px]">SCH-03</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute content-stretch flex flex-col gap-[8px] items-start right-[16px] top-[128px]" data-name="Container">
          <div className="bg-white content-stretch flex items-center justify-center p-px relative rounded-[12px] shrink-0 size-[40px]" data-name="Button">
            <div aria-hidden="true" className="absolute border border-[#f1f5f9] border-solid inset-0 pointer-events-none rounded-[12px]" />
            <div className="absolute bg-[rgba(255,255,255,0)] left-0 rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[40px] top-0" data-name="Button:shadow" />
            <div className="relative shrink-0 size-[14px]" data-name="Container">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <g id="Container">
                  <path d={svgPaths.p2bb32400} fill="var(--fill-0, #334155)" id="Icon" />
                </g>
              </svg>
            </div>
          </div>
          <div className="bg-white content-stretch flex items-center justify-center p-px relative rounded-[12px] shrink-0 size-[40px]" data-name="Button">
            <div aria-hidden="true" className="absolute border border-[#f1f5f9] border-solid inset-0 pointer-events-none rounded-[12px]" />
            <div className="absolute bg-[rgba(255,255,255,0)] left-0 rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[40px] top-0" data-name="Button:shadow" />
            <div className="h-[2px] relative shrink-0 w-[14px]" data-name="Container">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 2">
                <g id="Container">
                  <path d="M0 2V0H14V2H0V2" fill="var(--fill-0, #334155)" id="Icon" />
                </g>
              </svg>
            </div>
          </div>
          <div className="content-stretch flex flex-col h-[48px] items-start pt-[8px] relative shrink-0 w-[40px]" data-name="Button:margin">
            <div className="bg-white content-stretch flex items-center justify-center p-px relative rounded-[12px] shrink-0 size-[40px]" data-name="Button">
              <div aria-hidden="true" className="absolute border border-[rgba(30,58,138,0.05)] border-solid inset-0 pointer-events-none rounded-[12px]" />
              <div className="absolute bg-[rgba(255,255,255,0)] left-0 rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[40px] top-0" data-name="Button:shadow" />
              <div className="relative shrink-0 size-[21.9px]" data-name="Container">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.9 21.9">
                  <g id="Container">
                    <path d={svgPaths.p1bd0e880} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bg-white bottom-[88px] content-stretch flex flex-col items-start left-0 right-0 rounded-tl-[40px] rounded-tr-[40px] shadow-[0px_-12px_40px_0px_rgba(0,0,0,0.12)]" data-name="Background+Shadow">
          <div className="content-stretch flex h-[40px] items-center justify-center py-[20px] relative shrink-0 w-full" data-name="Container">
            <div className="bg-[#e2e8f0] h-[6px] rounded-[9999px] shrink-0 w-[48px]" data-name="Background" />
          </div>
          <div className="relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex flex-col gap-[16px] items-start pb-[16px] px-[24px] relative w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 2">
                  <div className="flex flex-col font-['Public_Sans:Extra_Bold',sans-serif] h-[28px] justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[20px] tracking-[-0.5px] w-[125.25px]">
                    <p className="leading-[28px]">Nearby Stops</p>
                  </div>
                </div>
                <div className="bg-[rgba(30,58,138,0.05)] content-stretch flex flex-col items-center justify-center px-[12px] py-[6px] relative rounded-[9999px] shrink-0" data-name="Button">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[16px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[12px] text-center w-[46.92px]">
                    <p className="leading-[16px]">View All</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[12px] items-start max-h-[280px] overflow-clip pb-[10px] relative shrink-0 w-full" data-name="Container">
                <OverlayBorder>
                  <Wrapper1 additionalClassNames="bg-[#1e3a8a]">
                    <div className="-translate-y-1/2 absolute bg-[rgba(255,255,255,0)] left-0 rounded-[12px] shadow-[0px_4px_6px_-1px_rgba(30,58,138,0.2),0px_2px_4px_-2px_rgba(30,58,138,0.2)] size-[48px] top-1/2" data-name="Overlay+Shadow" />
                    <Wrapper>
                      <path d={svgPaths.p303da380} fill="var(--fill-0, white)" id="Icon" />
                    </Wrapper>
                  </Wrapper1>
                  <Container1>
                    <HeadingText text="Main Gate" />
                    <ContainerText text="Route A • 150m away" />
                  </Container1>
                  <Container2>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#059669] text-[10px] tracking-[0.25px] uppercase w-[65.69px]">
                        <p className="leading-[15px]">Arriving in</p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Black',sans-serif] font-black h-[28px] justify-center leading-[0] relative shrink-0 text-[#059669] text-[20px] w-[54.45px]">
                        <p className="leading-[28px]">3 min</p>
                      </div>
                    </div>
                  </Container2>
                </OverlayBorder>
                <OverlayBorder>
                  <Background1 />
                  <Container1>
                    <HeadingText text="Engineering Hall" />
                    <ContainerText text="Route A, B • 400m away" />
                  </Container1>
                  <Container2>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] tracking-[0.25px] uppercase w-[65.69px]">
                        <p className="leading-[15px]">Arriving in</p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Black',sans-serif] font-black h-[28px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[20px] w-[54.38px]">
                        <p className="leading-[28px]">8 min</p>
                      </div>
                    </div>
                  </Container2>
                </OverlayBorder>
                <OverlayBorder additionalClassNames="opacity-75">
                  <Background1 />
                  <Container1>
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[14px] w-full">
                        <p className="leading-[20px]">Central Library</p>
                      </div>
                    </div>
                    <ContainerText text="Route B • 650m away" />
                  </Container1>
                  <Container2>
                    <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] text-right tracking-[0.25px] uppercase w-[53.03px]">
                      <p className="leading-[15px]">Next Bus</p>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                      <div className="flex flex-col font-['Public_Sans:Black',sans-serif] font-black h-[28px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[20px] w-[63.11px]">
                        <p className="leading-[28px]">14 min</p>
                      </div>
                    </div>
                  </Container2>
                </OverlayBorder>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute backdrop-blur-[6px] bg-[rgba(255,255,255,0.9)] content-stretch flex items-center justify-between left-0 pb-[12px] pt-[48px] px-[16px] right-0 top-0" data-name="Overlay+OverlayBlur">
          <div className="content-stretch flex items-center relative shrink-0 size-[40px]" data-name="Container">
            <div className="h-[20px] relative shrink-0 w-[11.775px]" data-name="Container">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.775 20">
                <g id="Container">
                  <path d={svgPaths.p225a8cc0} fill="var(--fill-0, #0F172A)" id="Icon" />
                </g>
              </svg>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 1">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[23px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[18px] w-[137.97px]">
                <p className="leading-[22.5px]">Campus Shuttle</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] tracking-[1px] uppercase w-[183.66px]">
                <p className="leading-[15px]">Soonchunhyang University</p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-end relative shrink-0 size-[40px]" data-name="Container">
            <Container>
              <path d={svgPaths.p6c8ea80} fill="var(--fill-0, #0F172A)" id="Icon" />
            </Container>
          </div>
        </div>
        <div className="absolute backdrop-blur-[12px] bg-[rgba(255,255,255,0.95)] bottom-0 content-stretch flex gap-[2.8px] items-center left-0 pb-[32px] pl-[9.39px] pr-[9.42px] pt-[13px] right-0" data-name="Background+HorizontalBorder+OverlayBlur">
          <div aria-hidden="true" className="absolute border-[#f1f5f9] border-solid border-t inset-0 pointer-events-none" />
          <Link>
            <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Container">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
                <g id="Container">
                  <path d={svgPaths.p12a32500} fill="var(--fill-0, #94A3B8)" id="Icon" />
                </g>
              </svg>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
              <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[10px] w-[27.83px]">
                <p className="leading-[15px]">Home</p>
              </div>
            </div>
          </Link>
          <Link>
            <div className="h-[19px] relative shrink-0 w-[16px]" data-name="Container">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 19">
                <g id="Container">
                  <path d={svgPaths.p25582b00} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                </g>
              </svg>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] w-[18.08px]">
                <p className="leading-[15px]">Bus</p>
              </div>
            </div>
          </Link>
          <Link>
            <div className="h-[40px] relative shrink-0 w-[36.02px]" data-name="Margin">
              <div className="absolute bg-[#f1f5f9] content-stretch flex items-center justify-center left-0 p-[6px] rounded-[9999px] top-[-4px]" data-name="Background">
                <Container>
                  <path d={svgPaths.p8f89580} fill="var(--fill-0, #94A3B8)" id="Icon" />
                </Container>
              </div>
            </div>
            <div className="h-[13px] relative shrink-0 w-[14.5px]" data-name="Margin">
              <div className="-translate-y-1/2 absolute flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] h-[15px] justify-center leading-[0] left-0 not-italic text-[#94a3b8] text-[10px] top-[5.5px] w-[14.5px]">
                <p className="leading-[15px]">QR</p>
              </div>
            </div>
          </Link>
          <Link>
            <Wrapper>
              <path d={svgPaths.p164b49c0} fill="var(--fill-0, #94A3B8)" id="Icon" />
            </Wrapper>
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
              <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[10px] w-[30.89px]">
                <p className="leading-[15px]">Notice</p>
              </div>
            </div>
          </Link>
          <Link>
            <Container>
              <path d={svgPaths.p3de21300} fill="var(--fill-0, #94A3B8)" id="Icon" />
            </Container>
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
              <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[10px] w-[31.16px]">
                <p className="leading-[15px]">Profile</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="-translate-x-1/2 absolute bg-[#e2e8f0] bottom-[6px] h-[4px] left-1/2 rounded-[9999px] w-[128px]" data-name="Background" />
      </div>
    </div>
  );
}