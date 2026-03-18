import clsx from "clsx";
import svgPaths from "./svg-uc2lwsv97s";
type ContainerBackgroundImage1Props = {
  additionalClassNames?: string;
};

function ContainerBackgroundImage1({ children, additionalClassNames = "" }: React.PropsWithChildren<ContainerBackgroundImage1Props>) {
  return (
    <div className={clsx("flex-[1_0_0] min-h-px min-w-px relative", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-center relative w-full">{children}</div>
    </div>
  );
}

function BackgroundImage4({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-col items-center justify-center size-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col h-full items-center justify-center pb-[15px] pt-[16px] relative">{children}</div>
    </div>
  );
}

function ContainerBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">{children}</div>
    </div>
  );
}

function BackgroundImage3({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative">{children}</div>
    </div>
  );
}
type BackgroundImage2Props = {
  additionalClassNames?: string;
};

function BackgroundImage2({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage2Props>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">{children}</div>
    </div>
  );
}

function BackgroundImage1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center size-full">
      <div className="content-stretch flex gap-[16px] items-center p-[17px] relative w-full">{children}</div>
    </div>
  );
}

function OverlayBorderBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[rgba(248,250,252,0.5)] relative rounded-[12px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[rgba(241,245,249,0.5)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <BackgroundImage1>{children}</BackgroundImage1>
    </div>
  );
}

function BackgroundBorderShadowBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#f1f5f9] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <BackgroundImage1>{children}</BackgroundImage1>
    </div>
  );
}

function BackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[19px] relative shrink-0 w-[20px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 19">
        <g id="Container">{children}</g>
      </svg>
    </div>
  );
}
type BackgroundBackgroundImageAndTextProps = {
  text: string;
};

function BackgroundBackgroundImageAndText({ text }: BackgroundBackgroundImageAndTextProps) {
  return (
    <div className="bg-[#e2e8f0] content-stretch flex flex-col items-start px-[6px] py-[2px] relative rounded-[4px] shrink-0">
      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[10px] uppercase w-[47.27px]">
        <p className="leading-[15px]">{text}</p>
      </div>
    </div>
  );
}

function BackgroundBackgroundImage() {
  return (
    <BackgroundImage2 additionalClassNames="bg-[#e2e8f0] rounded-[8px] size-[48px]">
      <div className="relative shrink-0 size-[20px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
          <g id="Container">
            <path d={svgPaths.p284e33c0} fill="var(--fill-0, #94A3B8)" id="Icon" />
          </g>
        </svg>
      </div>
    </BackgroundImage2>
  );
}

function ButtonBackgroundImage1() {
  return (
    <BackgroundImage3>
      <BackgroundImage>
        <path d={svgPaths.p3e30af00} fill="var(--fill-0, #CBD5E1)" id="Icon" />
      </BackgroundImage>
    </BackgroundImage3>
  );
}

function ButtonBackgroundImage() {
  return (
    <BackgroundImage3>
      <BackgroundImage>
        <path d={svgPaths.p1f93f980} fill="var(--fill-0, #FBBF24)" id="Icon" />
      </BackgroundImage>
    </BackgroundImage3>
  );
}
type ContainerBackgroundImageAndText1Props = {
  text: string;
};

function ContainerBackgroundImageAndText1({ text }: ContainerBackgroundImageAndText1Props) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[11px] w-full">
        <p className="leading-[16.5px]">{text}</p>
      </div>
    </div>
  );
}
type ContainerBackgroundImageAndTextProps = {
  text: string;
};

function ContainerBackgroundImageAndText({ text }: ContainerBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#64748b] text-[12px] w-full">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}
type OverlayBackgroundImageAndTextProps = {
  text: string;
};

function OverlayBackgroundImageAndText({ text }: OverlayBackgroundImageAndTextProps) {
  return (
    <div className="bg-[rgba(30,58,138,0.1)] content-stretch flex flex-col items-start px-[6px] py-[2px] relative rounded-[4px] shrink-0">
      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] w-[36.61px]">
        <p className="leading-[15px]">{text}</p>
      </div>
    </div>
  );
}

function OverlayBackgroundImage() {
  return (
    <BackgroundImage2 additionalClassNames="bg-[rgba(30,58,138,0.1)] rounded-[8px] size-[48px]">
      <div className="h-[19px] relative shrink-0 w-[16px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 19">
          <g id="Container">
            <path d={svgPaths.p25582b00} fill="var(--fill-0, #1E3A8A)" id="Icon" />
          </g>
        </svg>
      </div>
    </BackgroundImage2>
  );
}

export default function CommuterBusList() {
  return (
    <div className="relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] size-full" data-name="Commuter Bus List" style={{ backgroundImage: "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(246, 246, 248) 0%, rgb(246, 246, 248) 100%)" }}>
      <div className="absolute bg-white content-stretch flex flex-col items-start left-0 pt-[8px] right-0 top-[65px]" data-name="Background">
        <div className="h-[53px] relative shrink-0 w-full" data-name="HorizontalBorder">
          <div aria-hidden="true" className="absolute border-[#f1f5f9] border-b border-solid inset-0 pointer-events-none" />
          <div className="content-stretch flex gap-[32px] items-start pb-px px-[16px] relative size-full">
            <div className="relative self-stretch shrink-0" data-name="Link">
              <div aria-hidden="true" className="absolute border-[#1e3a8a] border-b-3 border-solid inset-0 pointer-events-none" />
              <BackgroundImage4>
                <ContainerBackgroundImage>
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[21px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[14px] tracking-[0.35px] w-[96.59px]">
                    <p className="leading-[21px]">Commuter</p>
                  </div>
                </ContainerBackgroundImage>
              </BackgroundImage4>
            </div>
            <div className="relative self-stretch shrink-0" data-name="Link">
              <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-b-3 border-solid inset-0 pointer-events-none" />
              <BackgroundImage4>
                <ContainerBackgroundImage>
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[21px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[14px] tracking-[0.35px] w-[72.69px]">
                    <p className="leading-[21px]">Campus</p>
                  </div>
                </ContainerBackgroundImage>
              </BackgroundImage4>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col items-start left-0 p-[16px] right-0 top-[126px]" data-name="Container">
        <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Container">
          <div className="bg-[#f1f5f9] flex-[1_0_0] min-h-px min-w-px relative rounded-[12px]" data-name="Input">
            <div className="overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex flex-col items-start pl-[40px] pr-[16px] py-[14px] relative w-full">
                <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6b7280] text-[14px] w-full">
                    <p className="leading-[normal]">Search for a city or stop...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-[15px] size-[18px] top-[13px]" data-name="Icon">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
              <path d={svgPaths.p8a35e00} fill="var(--fill-0, #94A3B8)" id="Icon" />
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[12px] items-start left-0 overflow-clip pb-[143.5px] px-[16px] right-0 top-[202px]" data-name="Container">
        <div className="relative shrink-0 w-full" data-name="Heading 2">
          <div className="content-stretch flex flex-col items-start px-[4px] relative w-full">
            <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[12px] tracking-[1.2px] uppercase w-full">
              <p className="leading-[16px]">Regional Routes</p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
          <BackgroundBorderShadowBackgroundImage>
            <OverlayBackgroundImage />
            <ContainerBackgroundImage1>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[119.38px]">
                    <p className="leading-[20px]">Incheon - Line A</p>
                  </div>
                </div>
                <OverlayBackgroundImageAndText text="ACTIVE" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText text="Bupyeong - Songdo - SCH Campus" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[2px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText1 text="07:00 - 18:30 (Every 40m)" />
              </div>
            </ContainerBackgroundImage1>
            <ButtonBackgroundImage />
          </BackgroundBorderShadowBackgroundImage>
          <BackgroundBorderShadowBackgroundImage>
            <OverlayBackgroundImage />
            <ContainerBackgroundImage1>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[129.19px]">
                    <p className="leading-[20px]">Seoul - Gangnam</p>
                  </div>
                </div>
                <OverlayBackgroundImageAndText text="ACTIVE" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText text="Express Terminal - Yangjae - SCH" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[2px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText1 text="07:20 - 19:00 (Every 30m)" />
              </div>
            </ContainerBackgroundImage1>
            <ButtonBackgroundImage1 />
          </BackgroundBorderShadowBackgroundImage>
          <BackgroundBorderShadowBackgroundImage>
            <OverlayBackgroundImage />
            <ContainerBackgroundImage1>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[109.86px]">
                    <p className="leading-[20px]">Suwon - Line B</p>
                  </div>
                </div>
                <OverlayBackgroundImageAndText text="ACTIVE" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText text="Suwon Station - Yeongtong - SCH" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[2px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText1 text="07:45 - 18:00 (Every 60m)" />
              </div>
            </ContainerBackgroundImage1>
            <ButtonBackgroundImage />
          </BackgroundBorderShadowBackgroundImage>
          <OverlayBorderBackgroundImage>
            <BackgroundBackgroundImage />
            <ContainerBackgroundImage1 additionalClassNames="opacity-60">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[#475569] text-[16px] w-[135.53px]">
                    <p className="leading-[20px]">Daejeon - Express</p>
                  </div>
                </div>
                <BackgroundBackgroundImageAndText text="Stopped" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText text="No service currently scheduled" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[2px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText1 text="Resume date: Mar 15" />
              </div>
            </ContainerBackgroundImage1>
            <ButtonBackgroundImage1 />
          </OverlayBorderBackgroundImage>
          <OverlayBorderBackgroundImage>
            <BackgroundBackgroundImage />
            <ContainerBackgroundImage1 additionalClassNames="opacity-60">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[#475569] text-[16px] w-[92.67px]">
                    <p className="leading-[20px]">Seoul - Ilsan</p>
                  </div>
                </div>
                <BackgroundBackgroundImageAndText text="Stopped" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText text="Limited availability" />
              </div>
              <div className="content-stretch flex flex-col items-start pt-[2px] relative shrink-0 w-full" data-name="Margin">
                <ContainerBackgroundImageAndText1 text="Check notice board for updates" />
              </div>
            </ContainerBackgroundImage1>
            <ButtonBackgroundImage1 />
          </OverlayBorderBackgroundImage>
        </div>
      </div>
      <div className="absolute backdrop-blur-[8px] bg-[rgba(255,255,255,0.95)] bottom-0 content-stretch flex flex-col items-start left-0 max-w-[430px] pb-[32px] pt-[13px] px-[24px] right-0" data-name="Background+HorizontalBorder+OverlayBlur">
        <div aria-hidden="true" className="absolute border-[#f1f5f9] border-solid border-t inset-0 pointer-events-none" />
        <div className="relative shrink-0 w-full" data-name="Container">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative w-full">
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
              <div className="h-[19.5px] relative shrink-0 w-[17.333px]" data-name="Container">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 19.5">
                  <g id="Container">
                    <path d={svgPaths.p39defd40} fill="var(--fill-0, #94A3B8)" id="Icon" />
                  </g>
                </svg>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] w-[27.7px]">
                  <p className="leading-[15px]">Home</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
              <div className="h-[20.583px] relative shrink-0 w-[17.333px]" data-name="Container">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 20.5833">
                  <g id="Container">
                    <path d={svgPaths.p295bac00} fill="var(--fill-0, #1E3A8A)" id="Icon" />
                  </g>
                </svg>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[10px] w-[18.08px]">
                  <p className="leading-[15px]">Bus</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
              <div className="h-[16px] relative shrink-0 w-[48px]" data-name="Margin">
                <div className="absolute bg-[#f1f5f9] content-stretch flex items-center justify-center left-0 rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[48px] top-[-32px]" data-name="Background+Shadow">
                  <div className="relative shrink-0 size-[23.333px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.3333 23.3333">
                      <g id="Container">
                        <path d={svgPaths.p27226100} fill="var(--fill-0, #94A3B8)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] w-[14.38px]">
                  <p className="leading-[15px]">QR</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
              <div className="h-[21.667px] relative shrink-0 w-[17.333px]" data-name="Container">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 21.6667">
                  <g id="Container">
                    <path d={svgPaths.p3827a538} fill="var(--fill-0, #94A3B8)" id="Icon" />
                  </g>
                </svg>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] w-[30.61px]">
                  <p className="leading-[15px]">Notice</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0" data-name="Link">
              <div className="relative shrink-0 size-[17.333px]" data-name="Container">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 17.3333">
                  <g id="Container">
                    <path d={svgPaths.p1c6e17c0} fill="var(--fill-0, #94A3B8)" id="Icon" />
                  </g>
                </svg>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[15px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[10px] w-[30.86px]">
                  <p className="leading-[15px]">Profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute backdrop-blur-[6px] bg-[rgba(255,255,255,0.8)] content-stretch flex items-center justify-between left-0 pb-[9px] pt-[16px] px-[16px] right-0 top-0" data-name="Overlay+HorizontalBorder+OverlayBlur">
        <div aria-hidden="true" className="absolute border-[#f1f5f9] border-b border-solid inset-0 pointer-events-none" />
        <BackgroundImage2 additionalClassNames="rounded-[9999px] size-[40px]">
          <div className="h-[20px] relative shrink-0 w-[11.775px]" data-name="Container">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.775 20">
              <g id="Container">
                <path d={svgPaths.p225a8cc0} fill="var(--fill-0, #0F172A)" id="Icon" />
              </g>
            </svg>
          </div>
        </BackgroundImage2>
        <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Heading 1">
          <div className="flex flex-col items-center size-full">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center pr-[40px] relative w-full">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[23px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[18px] text-center tracking-[-0.45px] w-[156.25px]">
                <p className="leading-[22.5px]">Commuter Bus List</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}