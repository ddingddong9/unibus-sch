import clsx from "clsx";
import svgPaths from "./svg-442o27yf4b";
type InputBackgroundImageProps = {
  text: string;
  additionalClassNames?: string;
};

function InputBackgroundImage({ children, text, additionalClassNames = "" }: React.PropsWithChildren<InputBackgroundImageProps>) {
  return (
    <div className="h-[56px] relative rounded-[8px] shrink-0 w-full">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start px-[17px] py-[18.5px] relative size-full">
          <div className={clsx("relative", additionalClassNames)}>
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
              <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[16px] w-full">
                <p className="leading-[normal]">{text}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#cbd5e1] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}
type ContainerBackgroundImageAndTextProps = {
  text: string;
};

function ContainerBackgroundImageAndText({ text }: ContainerBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Public_Sans:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0f172a] text-[14px] w-full">
        <p className="leading-[20px]">{text}</p>
      </div>
    </div>
  );
}

export default function SignUpScreen() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Sign Up Screen" style={{ backgroundImage: "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(246, 246, 248) 0%, rgb(246, 246, 248) 100%)" }}>
      <div className="relative shrink-0 w-full" data-name="Top Navigation">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex items-center justify-between pb-[8px] pt-[16px] px-[16px] relative w-full">
            <div className="content-stretch flex items-center relative shrink-0 size-[48px]" data-name="Container">
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
                <div className="content-stretch flex flex-col items-center pr-[48px] relative w-full">
                  <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[23px] justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[18px] text-center tracking-[-0.45px] w-[64.06px]">
                    <p className="leading-[22.5px]">Sign Up</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative shrink-0 w-full" data-name="Header Section">
        <div className="content-stretch flex flex-col gap-[8px] items-start pb-[16px] pt-[31px] px-[24px] relative w-full">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
            <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0f172a] text-[30px] tracking-[-0.75px] w-full">
              <p className="leading-[37.5px]">Create Account</p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
            <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal justify-center leading-[24px] relative shrink-0 text-[#475569] text-[16px] w-full">
              <p className="mb-0">Enter your details to register for the SCH</p>
              <p>Shuttle service.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Form Section:margin">
        <div className="flex flex-col justify-center size-full">
          <div className="content-stretch flex flex-col items-start justify-center pt-[16px] relative size-full">
            <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Form Section">
              <div className="overflow-clip rounded-[inherit] size-full">
                <div className="content-stretch flex flex-col gap-[16px] items-start px-[24px] relative size-full">
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Label - Name Input">
                    <ContainerBackgroundImageAndText text="Name" />
                    <InputBackgroundImage text="Enter your full name" additionalClassNames="shrink-0 w-full" />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Label - Student ID Input">
                    <ContainerBackgroundImageAndText text="Student ID" />
                    <InputBackgroundImage text="e.g. 20231234" additionalClassNames="shrink-0 w-full" />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Label - Department Input">
                    <ContainerBackgroundImageAndText text="Department" />
                    <InputBackgroundImage text="e.g. Computer Science" additionalClassNames="shrink-0 w-full" />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Label - Password Input">
                    <ContainerBackgroundImageAndText text="Password" />
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                      <div className="h-[56px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
                        <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
                          <div className="content-stretch flex items-start justify-center px-[17px] py-[18.5px] relative size-full">
                            <div className="relative flex-[1_0_0] min-h-px min-w-px">
                              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
                                <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[16px] w-full">
                                  <p className="leading-[normal]">{"Create a password"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div aria-hidden="true" className="absolute border border-[#cbd5e1] border-solid inset-0 pointer-events-none rounded-[8px]" />
                      </div>
                      <div className="absolute h-[15px] right-[16px] top-[16px] w-[22px]" data-name="Container">
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
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full" data-name="Footer Actions:margin">
        <div className="relative shrink-0 w-full" data-name="Footer Actions">
          <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative w-full">
            <div className="bg-[#1e1e8a] content-stretch flex flex-col h-[56px] items-center justify-center pb-[14.5px] pt-[13.5px] relative rounded-[12px] shrink-0 w-full" data-name="Button">
              <div className="flex flex-col font-['Public_Sans:Bold',sans-serif] font-bold h-[28px] justify-center leading-[0] relative shrink-0 text-[18px] text-center text-white w-[62.61px]">
                <p className="leading-[28px]">Submit</p>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-center py-[8px] relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
                <div className="flex flex-col font-['Public_Sans:Regular',sans-serif] font-normal h-[24px] justify-center leading-[0] relative shrink-0 text-[#475569] text-[16px] w-[236.5px]">
                  <p>
                    <span className="leading-[24px]">{`Already have an account? `}</span>
                    <span className="font-['Public_Sans:Bold',sans-serif] font-bold leading-[24px] text-[#0f172a]">Login</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[32px] shrink-0 w-full" data-name="Safe Area Spacer for iOS" />
    </div>
  );
}