import svgPaths from "./svg-9blebrmjt8";
import imgGoogle from "figma:asset/c27e79a6f1f35befb6887de79921e91658cc1739.png";

function InputBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white h-[56px] relative rounded-[8px] shrink-0 w-full">
      <div className="overflow-clip relative rounded-[inherit] size-full">{children}</div>
      <div aria-hidden="true" className="absolute border border-[#cbd5e1] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container21HorizontalDividerBackgroundImage() {
  return (
    <div className="flex-[1_0_0] h-px min-h-px min-w-px relative">
      <div aria-hidden="true" className="absolute border-[#e2e8f0] border-solid border-t inset-0 pointer-events-none" />
    </div>
  );
}

export default function LoginScreen() {
  return (
    <div className="content-stretch flex flex-col items-start relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] size-full" data-name="Login Screen" style={{ backgroundImage: "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(246, 246, 248) 0%, rgb(246, 246, 248) 100%)" }}>
      <div className="bg-white relative shrink-0 w-full" data-name="Background">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex items-center justify-center pb-[8px] pt-[15px] px-[16px] relative w-full">
            <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px relative" data-name="Heading 2">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[23px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[18px] text-center tracking-[-0.27px] w-[45.97px]">
                <p className="leading-[22.5px]">Login</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative shrink-0 w-full" data-name="Container">
        <div className="content-stretch flex flex-col items-start justify-between pb-[32px] pt-[40px] px-[24px] relative w-full">
          <div className="content-stretch flex flex-col items-start pb-[40px] relative shrink-0 w-full" data-name="Margin">
            <div className="h-[131px] relative shrink-0 w-full" data-name="Container">
              <div className="absolute content-stretch flex gap-[8px] items-center left-0 right-0 top-0" data-name="Container">
                <div className="bg-[#1e3b8a] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]" data-name="Background">
                  <div className="h-[19px] relative shrink-0 w-[16px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 19">
                      <g id="Container">
                        <path d={svgPaths.pdce8f20} fill="var(--fill-0, white)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[28px] justify-center leading-[0] relative shrink-0 text-[#1e3b8a] text-[20px] tracking-[-0.5px] w-[113.56px]">
                    <p className="leading-[28px]">SCH Shuttle</p>
                  </div>
                </div>
              </div>
              <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[64px]" data-name="Heading 2">
                <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[35px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[28px] tracking-[-0.7px] w-[184.77px]">
                  <p className="leading-[35px]">Welcome back</p>
                </div>
              </div>
              <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[107px]" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[24px] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[16px] w-[335.78px]">
                  <p className="leading-[24px]">Log in to your SCH University shuttle account</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Container">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Label">
                <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[14px] w-full">
                  <p className="leading-[21px]">Student ID</p>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                <InputBackgroundImage>
                  <div className="absolute bottom-[18.5px] content-stretch flex flex-col items-start left-[16px] overflow-clip pr-[152.75px] top-[18.5px]" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[19px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[16px] w-[157.25px]">
                      <p className="leading-[normal]">Enter your student ID</p>
                    </div>
                  </div>
                  <div className="absolute bottom-[18.5px] left-[16px] top-[18.5px] w-[310px]" data-name="Container" />
                </InputBackgroundImage>
                <div className="absolute bottom-[28.57%] content-stretch flex flex-col items-start right-[16px] top-[28.57%]" data-name="Container">
                  <div className="relative shrink-0 size-[20px]" data-name="Icon">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <path d={svgPaths.p207ea900} fill="var(--fill-0, #94A3B8)" id="Icon" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex items-center justify-between pb-[8px] relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Label">
                  <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] h-[21px] justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[14px] w-[63.88px]">
                    <p className="leading-[21px]">Password</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Link">
                  <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#1e3b8a] text-[12px] w-[43.8px]">
                    <p className="leading-[16px]">Forgot?</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                <InputBackgroundImage>
                  <div className="absolute bottom-[18.5px] content-stretch flex flex-col items-start left-[16px] overflow-clip pr-[157.95px] top-[18.5px]" data-name="Container">
                    <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[19px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[16px] w-[152.05px]">
                      <p className="leading-[normal]">Enter your password</p>
                    </div>
                  </div>
                  <div className="absolute bottom-[18.5px] left-[16px] top-[18.5px] w-[310px]" data-name="Container" />
                </InputBackgroundImage>
                <div className="absolute bottom-[28.57%] content-stretch flex flex-col items-start right-[16px] top-[28.57%]" data-name="Container">
                  <div className="h-[21px] relative shrink-0 w-[16px]" data-name="Icon">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 21">
                      <path d={svgPaths.p12930f00} fill="var(--fill-0, #94A3B8)" id="Icon" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start pt-[40px] relative shrink-0 w-full" data-name="Margin">
            <div className="bg-[#1e3b8a] content-stretch flex gap-[8px] h-[56px] items-center justify-center relative rounded-[12px] shrink-0 w-full" data-name="Button">
              <div className="absolute bg-[rgba(255,255,255,0)] h-[56px] left-0 right-0 rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(30,59,138,0.2),0px_4px_6px_-4px_rgba(30,59,138,0.2)] top-0" data-name="Button:shadow" />
              <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[24px] justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white w-[42.06px]">
                  <p className="leading-[24px]">Login</p>
                </div>
              </div>
              <div className="relative shrink-0 size-[15px]" data-name="Container">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                  <g id="Container">
                    <path d={svgPaths.p2da1f880} fill="var(--fill-0, white)" id="Icon" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start pt-[32px] relative shrink-0 w-full" data-name="Margin">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex items-center py-[16px] relative shrink-0 w-full" data-name="Container">
                <Container21HorizontalDividerBackgroundImage />
                <div className="content-stretch flex flex-col items-start px-[16px] relative shrink-0" data-name="Margin">
                  <div className="flex flex-col font-['Public_Sans:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[12px] tracking-[1.2px] uppercase w-[135.2px]">
                    <p className="leading-[16px]">Or continue with</p>
                  </div>
                </div>
                <Container21HorizontalDividerBackgroundImage />
              </div>
              <div className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex flex-[1_0_0] h-[48px] items-center justify-center min-h-px min-w-px p-px relative rounded-[8px]" data-name="Button">
                  <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="max-w-[163px] relative shrink-0 size-[20px]" data-name="Google">
                    <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
                      <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgGoogle} />
                    </div>
                  </div>
                </div>
                <div className="bg-white content-stretch flex flex-[1_0_0] gap-[8px] h-[48px] items-center justify-center min-h-px min-w-px p-px relative rounded-[8px]" data-name="Button">
                  <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="relative shrink-0 size-[16.667px]" data-name="Container">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6667 16.6667">
                      <g id="Container">
                        <path d={svgPaths.p5305900} fill="var(--fill-0, black)" id="Icon" />
                      </g>
                    </svg>
                  </div>
                  <div className="relative shrink-0" data-name="Container">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative">
                      <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[14px] text-black text-center w-[41.67px]">
                        <p className="leading-[20px]">Kakao</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col h-[160.5px] items-start justify-end min-h-[92px] pt-[68.5px] relative shrink-0 w-full" data-name="Margin">
            <div className="content-stretch flex flex-col items-start pb-[32px] pt-[40px] relative shrink-0 w-full" data-name="Container">
              <div className="relative shrink-0 w-full" data-name="Container">
                <div className="content-stretch flex gap-[3.99px] items-start px-[66.38px] relative w-full">
                  <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] relative shrink-0 text-[#475569] text-[14px] text-center w-[152.97px]">
                    <p className="leading-[20px]">{`Don't have an account? `}</p>
                  </div>
                  <div className="content-stretch flex items-start justify-center relative shrink-0" data-name="Link">
                    <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[14px] text-center w-[52.28px]">
                      <p className="leading-[20px]">Sign Up</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}