import clsx from "clsx";
import svgPaths from "./svg-odbnwpa57u";
import imgStylizedMapShowingCampusRoads from "figma:asset/70af9cad232a51cb3669c712a48138adf798354b.png";
type LinkProps = {
  additionalClassNames?: string;
};

function Link({ children, additionalClassNames = "" }: React.PropsWithChildren<LinkProps>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative w-full">{children}</div>
    </div>
  );
}

function Container3({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative">{children}</div>
    </div>
  );
}

function Section({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[12px] items-start px-[24px] py-[16px] relative w-full">{children}</div>
    </div>
  );
}
function Container1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[18.667px] relative shrink-0 w-[23.333px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.3333 18.6667">
        <g id="Container">{children}</g>
      </svg>
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

export default function HomeScreen() {
  return (
    <div className="bg-[#f6f6f8] content-stretch flex flex-col items-start relative size-full" data-name="Home Screen">
      <div className="bg-white content-stretch flex flex-col items-start max-w-[430px] min-h-[1067px] overflow-clip pb-[94px] relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full" data-name="Background+Shadow">
        <div className="relative shrink-0 w-full" data-name="Header">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between pb-[8px] pt-[24px] px-[24px] relative w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-[142.88px]" data-name="Container">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[12px] tracking-[0.6px] uppercase w-[104.09px]">
                    <p className="leading-[16px]">Welcome back</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[32px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[24px] w-[142.88px]">
                    <p className="leading-[32px]">SCH Shuttle</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#f1f5f9] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Button">
                <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                    <g id="Container">
                      <path d={svgPaths.p164b49c0} fill="var(--fill-0, #0F172A)" id="Icon" />
                    </g>
                  </svg>
                </div>
                <div className="absolute bg-[#ef4444] right-[10px] rounded-[9999px] size-[8px] top-[10px]" data-name="Background+Border">
                  <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Section">
          <div className="content-stretch flex flex-col items-start px-[24px] py-[16px] relative w-full">
            <div className="bg-[#1e3a8a] relative rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Background+Shadow">
              <div className="overflow-clip rounded-[inherit] size-full">
                <div className="content-stretch flex flex-col items-start p-[24px] relative w-full">
                  <div className="absolute bg-[rgba(255,255,255,0.1)] right-[-16px] rounded-[9999px] size-[128px] top-[-16px]" data-name="Overlay" />
                  <div className="absolute bg-[rgba(255,255,255,0.05)] bottom-[-32px] left-[-32px] rounded-[9999px] size-[128px]" data-name="Overlay" />
                  <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
                    <div className="content-stretch flex gap-[8px] items-center opacity-90 relative shrink-0 w-full" data-name="Container">
                      <div className="h-[11.667px] relative shrink-0 w-[9.333px]" data-name="Container">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 11.6667">
                          <g id="Container">
                            <path d={svgPaths.p3d8f00c0} fill="var(--fill-0, white)" id="Icon" />
                          </g>
                        </svg>
                      </div>
                      <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                        <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] relative shrink-0 text-[12px] text-white tracking-[1.2px] uppercase w-[104.97px]">
                          <p className="leading-[16px]">Nearest Stop</p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[20px] text-white w-full">
                        <p className="leading-[28px]">Engineering Bldg. 1</p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-end justify-between pt-[12px] relative shrink-0 w-full" data-name="Container">
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[77.56px]" data-name="Container">
                        <div className="content-stretch flex flex-col items-start opacity-80 relative shrink-0 w-full" data-name="Container">
                          <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] relative shrink-0 text-[14px] text-white w-[77.56px]">
                            <p className="leading-[20px]">Next Arrival</p>
                          </div>
                        </div>
                        <div className="h-[37px] leading-[0] relative shrink-0 text-white w-full" data-name="Paragraph">
                          <div className="-translate-y-1/2 absolute flex flex-col font-['Public_Sans:Black',sans-serif] font-black h-[36px] justify-center left-0 text-[30px] top-[18px] w-[19.69px]">
                            <p className="leading-[36px]">4</p>
                          </div>
                          <div className="-translate-y-1/2 absolute flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[28px] justify-center left-[23.69px] text-[18px] top-[23px] w-[41.06px]">
                            <p className="leading-[28px]">mins</p>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[9999px] shrink-0 size-[48px]" data-name="Border">
                        <div aria-hidden="true" className="absolute border-4 border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
                        <div className="h-[22.167px] relative shrink-0 w-[18.667px]" data-name="Container">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 22.1667">
                            <g id="Container">
                              <path d={svgPaths.p5416200} fill="var(--fill-0, white)" id="Icon" />
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Section">
          <div className="content-stretch flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full">
            <div className="bg-white content-stretch flex items-center justify-between p-[21px] relative rounded-[16px] shrink-0" data-name="Button">
              <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              <Container3>
                <div className="bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]" data-name="Background">
                  <div className="h-[21px] relative shrink-0 w-[25.667px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.6667 21">
                      <g id="Container">
                        <path d={svgPaths.p2d903e00} fill="var(--fill-0, white)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start pb-px relative shrink-0 w-[158.36px]" data-name="Container">
                  <div className="content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[122.63px]">
                      <p className="leading-[24px]">Campus Shuttle</p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[18px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] w-[158.36px]">
                      <p className="leading-[17.5px]">Intra-campus circulation</p>
                    </div>
                  </div>
                </div>
              </Container3>
              <Container />
            </div>
            <div className="bg-white content-stretch flex items-center justify-between p-[21px] relative rounded-[16px] shrink-0" data-name="Button">
              <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              <Container3>
                <div className="bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]" data-name="Background">
                  <Container1>
                    <path d={svgPaths.p285d3c40} fill="var(--fill-0, white)" id="Icon" />
                  </Container1>
                </div>
                <div className="content-stretch flex flex-col items-start pb-px relative shrink-0 w-[164.92px]" data-name="Container">
                  <div className="content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[113.63px]">
                      <p className="leading-[24px]">Commuter Bus</p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[18px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] w-[164.92px]">
                      <p className="leading-[17.5px]">Incheon, Seoul, Gyeonggi</p>
                    </div>
                  </div>
                </div>
              </Container3>
              <Container />
            </div>
            <div className="bg-white content-stretch flex items-center justify-between p-[21px] relative rounded-[16px] shrink-0" data-name="Button">
              <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              <Container3>
                <div className="bg-[#1e3a8a] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]" data-name="Background">
                  <Container1>
                    <path d={svgPaths.p3106d480} fill="var(--fill-0, white)" id="Icon" />
                  </Container1>
                </div>
                <div className="content-stretch flex flex-col items-start pb-px relative shrink-0 w-[188.5px]" data-name="Container">
                  <div className="content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[24px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[16px] w-[50.14px]">
                      <p className="leading-[24px]">Notice</p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start mb-[-1px] relative shrink-0 w-full" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[18px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] w-[188.5px]">
                      <p className="leading-[17.5px]">{`Schedule changes & updates`}</p>
                    </div>
                  </div>
                </div>
              </Container3>
              <Container />
            </div>
          </div>
        </div>
        <Section>
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[18px] w-full">
              <p className="leading-[28px]">Live Tracking</p>
            </div>
          </div>
          <div className="bg-[#f1f5f9] content-stretch flex flex-col h-[128px] items-start justify-center overflow-clip relative rounded-[16px] shrink-0 w-full" data-name="Background+Shadow">
            <div className="flex-[1_0_0] min-h-px min-w-px opacity-60 relative w-full" data-name="Stylized map showing campus roads">
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 overflow-hidden">
                  <img alt="" className="absolute h-[267.19%] left-0 max-w-none top-[-83.59%] w-full" src={imgStylizedMapShowingCampusRoads} />
                </div>
                <div className="absolute bg-[rgba(255,255,255,0.4)] inset-0 mix-blend-saturation" />
              </div>
            </div>
            <div className="absolute content-stretch flex inset-0 items-center justify-center" data-name="Container">
              <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Container">
                <div className="absolute bg-[rgba(30,58,138,0.2)] left-[-6px] rounded-[9999px] size-[32px] top-[-6px]" data-name="Overlay" />
                <div className="bg-[#1e3a8a] relative rounded-[9999px] shrink-0 size-[20px]" data-name="Background+Border">
                  <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[rgba(255,255,255,0)] left-1/2 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[20px] top-1/2" data-name="Overlay+Shadow" />
                </div>
              </div>
            </div>
            <div className="absolute backdrop-blur-[2px] bg-[rgba(255,255,255,0.9)] bottom-[8px] content-stretch flex flex-col items-start px-[8px] py-[4px] right-[8px] rounded-[8px]" data-name="Overlay+OverlayBlur">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[15px] justify-center leading-[0] relative shrink-0 text-[#1e293b] text-[10px] w-[93.8px]">
                <p className="leading-[15px]">LIVE CAMPUS MAP</p>
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
          </div>
        </Section>
      </div>
      <div className="absolute bg-white bottom-0 content-stretch flex h-[84px] items-center justify-center left-0 max-w-[430px] pb-[24px] pt-px px-[8px] w-[390px]" data-name="Nav">
        <div aria-hidden="true" className="absolute border-[#f1f5f9] border-solid border-t inset-0 pointer-events-none" />
        <Link additionalClassNames="w-[74.8px]">
          <div className="h-[19.5px] relative shrink-0 w-[17.333px]" data-name="Container">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 19.5">
              <g id="Container">
                <path d={svgPaths.p3321eb00} fill="var(--fill-0, #1E3A8A)" id="Icon" />
              </g>
            </svg>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[17px] justify-center leading-[0] relative shrink-0 text-[#1e3a8a] text-[11px] w-[30.84px]">
              <p className="leading-[16.5px]">Home</p>
            </div>
          </div>
        </Link>
        <Link additionalClassNames="w-[74.79px]">
          <div className="h-[20.583px] relative shrink-0 w-[17.333px]" data-name="Container">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 20.5833">
              <g id="Container">
                <path d={svgPaths.p5662500} fill="var(--fill-0, black)" id="Icon" />
              </g>
            </svg>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[17px] justify-center leading-[0] relative shrink-0 text-[11px] text-black w-[19.88px]">
              <p className="leading-[16.5px]">Bus</p>
            </div>
          </div>
        </Link>
        <Link additionalClassNames="w-[74.8px]">
          <div className="relative shrink-0 size-[21.667px]" data-name="Container">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6667 21.6667">
              <g id="Container">
                <path d={svgPaths.p26072e00} fill="var(--fill-0, black)" id="Icon" />
              </g>
            </svg>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[17px] justify-center leading-[0] relative shrink-0 text-[11px] text-black w-[16.17px]">
              <p className="leading-[16.5px]">QR</p>
            </div>
          </div>
        </Link>
        <Link additionalClassNames="w-[74.8px]">
          <div className="h-[17.333px] relative shrink-0 w-[21.667px]" data-name="Container">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6667 17.3333">
              <g id="Container">
                <path d={svgPaths.p2fbf2c80} fill="var(--fill-0, black)" id="Icon" />
              </g>
            </svg>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[17px] justify-center leading-[0] relative shrink-0 text-[11px] text-black w-[34.47px]">
              <p className="leading-[16.5px]">Notice</p>
            </div>
          </div>
        </Link>
        <Link additionalClassNames="w-[74.79px]">
          <div className="relative shrink-0 size-[17.333px]" data-name="Container">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.3333 17.3333">
              <g id="Container">
                <path d={svgPaths.p1c6e17c0} fill="var(--fill-0, black)" id="Icon" />
              </g>
            </svg>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[17px] justify-center leading-[0] relative shrink-0 text-[11px] text-black w-[34.81px]">
              <p className="leading-[16.5px]">Profile</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
