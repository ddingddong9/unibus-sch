import { BusFront, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

const routeItems = [
  { label: "후문", state: "출발" },
  { label: "도서관", state: "2분 후" },
  { label: "정문", state: "도착 예정" },
];

const noticeItems = [
  "학내순환 운행 변경 안내",
  "통학버스 노선 및 시간 안내",
  "정류장별 대기 정보 확인",
];

const liveStatusItems = [
  "학내순환 2호차 도서관 접근 중",
  "서울 등교 노선 07:30",
  "정문 정류장 도착 예정",
  "인천 하교 노선 18:10",
];

function BrandMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a8a] text-white">
      <BusFront className="h-5 w-5" />
    </div>
  );
}

function MovingRouteGraphic() {
  return (
    <div className="relative h-[318px] overflow-hidden rounded-lg border border-[#dbe4ef] bg-white shadow-sm">
      <div className="absolute inset-x-0 top-0 h-[88px] bg-[#eaf4ff]" />
      <div className="absolute left-5 top-5 rounded-full border border-[#dbeafe] bg-white px-3 py-1.5 font-['Public_Sans'] text-[12px] font-bold text-[#1e3a8a] shadow-sm">
        실시간 운행
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 318" fill="none" aria-hidden="true">
        <path
          d="M38 238 C82 186 118 170 152 126 C190 78 252 92 292 130 C330 166 318 214 286 238 C246 268 200 244 166 224 C124 199 82 204 38 238Z"
          stroke="#e2e8f0"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M38 238 C82 186 118 170 152 126 C190 78 252 92 292 130 C330 166 318 214 286 238 C246 268 200 244 166 224 C124 199 82 204 38 238Z"
          stroke="#1e3a8a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="12 13"
        />
        {[
          [38, 238, "후문"],
          [153, 126, "도서관"],
          [292, 130, "정문"],
        ].map(([cx, cy, label]) => (
          <g key={`${label}`}>
            <circle cx={cx} cy={cy} r="11" fill="white" stroke="#1e3a8a" strokeWidth="4" />
            <rect x={Number(cx) - 28} y={Number(cy) + 18} width="56" height="22" rx="11" fill="white" stroke="#dbe4ef" />
            <text x={cx} y={Number(cy) + 33} textAnchor="middle" fontSize="10" fontWeight="800" fill="#334155">
              {label}
            </text>
          </g>
        ))}
      </svg>

      <div className="onboarding-bus-marker absolute left-[22px] top-[222px]">
        <div className="relative flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#1e3a8a] text-white shadow-[0_14px_24px_rgba(30,58,138,0.24)] ring-4 ring-white">
          <BusFront className="h-5 w-5" />
          <span className="absolute -bottom-[5px] h-3 w-3 rotate-45 bg-[#1e3a8a]" />
        </div>
      </div>

      <div className="onboard-reveal absolute bottom-5 left-5 right-5 rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-[0_18px_28px_rgba(15,23,42,0.08)] [animation-delay:250ms]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">가장 가까운 버스</p>
            <p className="font-['Public_Sans'] text-[18px] font-extrabold text-[#0f172a]">학내순환 2호차</p>
          </div>
          <div className="rounded-lg bg-[#ecfdf5] px-3 py-2 text-right">
            <p className="font-['Public_Sans'] text-[11px] font-bold text-[#047857]">예상 도착</p>
            <p className="font-['Public_Sans'] text-[18px] font-extrabold text-[#047857]">3분</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveStatusRail() {
  const railItems = [...liveStatusItems, ...liveStatusItems];

  return (
    <div className="onboard-reveal mt-4 overflow-hidden rounded-lg border border-[#dbe4ef] bg-white py-3 shadow-sm">
      <div className="onboarding-status-rail flex w-max gap-2 px-3">
        {railItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex h-9 items-center gap-2 rounded-full bg-[#f8fafc] px-3 font-['Public_Sans'] text-[12px] font-bold text-[#334155]"
          >
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function StopPreview() {
  return (
    <div className="onboard-reveal rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">학내순환</p>
          <h3 className="font-['Public_Sans'] text-[20px] font-extrabold text-[#0f172a]">정류장별 도착 흐름</h3>
        </div>
        <span className="rounded-full bg-[#ecfdf5] px-3 py-1.5 font-['Public_Sans'] text-[12px] font-bold text-[#047857]">
          운행 중
        </span>
      </div>
      <div className="space-y-4">
        {routeItems.map((item, index) => (
          <div
            key={item.label}
            className="grid grid-cols-[28px_1fr_auto] items-center gap-3"
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3a8a] font-['Public_Sans'] text-[12px] font-extrabold text-white">
              {index + 1}
              {index < routeItems.length - 1 && <span className="absolute top-7 h-6 w-[2px] bg-[#dbe4ef]" />}
            </div>
            <p className="font-['Public_Sans'] text-[15px] font-bold text-[#0f172a]">{item.label}</p>
            <p className="rounded-full bg-[#f8fafc] px-3 py-1 font-['Public_Sans'] text-[12px] font-bold text-[#475569]">
              {item.state}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommuterPreview() {
  return (
    <div className="onboard-reveal rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">통학버스</p>
        <h3 className="font-['Public_Sans'] text-[20px] font-extrabold text-[#0f172a]">노선과 시간 확인</h3>
      </div>
      <div className="space-y-3">
        {[
          ["서울", "등교 노선", "07:30 출발"],
          ["인천", "하교 노선", "18:10 출발"],
        ].map(([region, direction, time]) => (
          <div
            key={region}
            className="flex items-center justify-between rounded-lg bg-[#f8fafc] px-4 py-3"
          >
            <div>
              <p className="font-['Public_Sans'] text-[15px] font-extrabold text-[#0f172a]">{region}</p>
              <p className="mt-0.5 font-['Public_Sans'] text-[12px] font-semibold text-[#64748b]">{direction}</p>
            </div>
            <p className="font-['Public_Sans'] text-[13px] font-bold text-[#1e3a8a]">{time}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-[#f8fafc] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">노선 미리보기</p>
          <p className="font-['Public_Sans'] text-[12px] font-bold text-[#1e3a8a]">상세 정보 확인</p>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-[#dbe4ef]">
          <div className="onboarding-progress absolute inset-y-0 left-0 rounded-full bg-[#1e3a8a]" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 font-['Public_Sans'] text-[11px] font-bold text-[#64748b]">
          <span>출발지</span>
          <span className="text-center">학교</span>
          <span className="text-right">도착지</span>
        </div>
      </div>
    </div>
  );
}

function NoticePreview() {
  return (
    <div className="onboard-reveal rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">공지사항</p>
          <h3 className="font-['Public_Sans'] text-[20px] font-extrabold text-[#0f172a]">변경 안내를 놓치지 않게</h3>
        </div>
        <span className="h-3 w-3 rounded-full bg-[#f97316]" />
      </div>
      <div className="space-y-2">
        {noticeItems.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-lg bg-[#f8fafc] px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-[#1e3a8a]" />
            <p className="font-['Public_Sans'] text-[13px] font-bold text-[#334155]">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingWrapper() {
  const navigate = useNavigate();

  return (
    <div className="size-full overflow-y-auto bg-[#f8fafc]">
      <div className="min-h-full bg-[#f8fafc] px-5 pb-8 pt-safe">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-['Public_Sans'] text-[18px] font-extrabold tracking-[0.8px] text-[#0f172a]">UNIBUS</span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="h-9 rounded-lg border border-[#dbe4ef] bg-white px-4 font-['Public_Sans'] text-[13px] font-bold text-[#1e3a8a] shadow-sm active:scale-[0.98]"
          >
            로그인
          </button>
        </header>

        <main>
          <section className="pt-4">
            <p className="onboard-reveal mb-3 inline-flex rounded-full bg-[#eaf4ff] px-3 py-1 font-['Public_Sans'] text-[12px] font-bold text-[#1e3a8a]">
              순천향대 버스 이용을 더 쉽게
            </p>
            <h1 className="onboard-reveal font-['Public_Sans'] text-[34px] font-extrabold leading-[42px] text-[#0f172a] [animation-delay:80ms]">
              버스가 어디쯤인지,
              <br />
              기다리기 전에 확인하세요
            </h1>
            <p className="onboard-reveal mt-4 font-['Public_Sans'] text-[15px] leading-[24px] text-[#475569] [animation-delay:160ms]">
              UNIBUS는 학내순환과 통학버스 정보를 한곳에 모아, 학생이 출발 전부터 탑승 전까지 필요한 내용을 빠르게 확인하도록 돕습니다.
            </p>
            <div className="onboard-reveal mt-6 [animation-delay:220ms]">
              <MovingRouteGraphic />
            </div>
            <LiveStatusRail />
          </section>

          <section className="content-visibility-auto py-8">
            <p className="onboard-reveal font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">
              앱에서 바로 확인하는 것들
            </p>
            <h2 className="onboard-reveal mt-1 font-['Public_Sans'] text-[24px] font-extrabold text-[#0f172a]">
              복잡한 정보는 정리하고,
              <br />
              필요한 순간에만 보여줍니다
            </h2>
            <div className="mt-5 space-y-4">
              <StopPreview />
              <CommuterPreview />
              <NoticePreview />
            </div>
          </section>

          <section className="content-visibility-auto rounded-lg border border-[#dbe4ef] bg-white p-5 shadow-sm">
            <p className="onboard-reveal font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">
              이용 흐름
            </p>
            <h2 className="onboard-reveal mt-1 font-['Public_Sans'] text-[22px] font-extrabold text-[#0f172a]">
              출발 전에 한 번만 확인하세요
            </h2>
            <div className="mt-5 space-y-4">
              {[
                ["1", "현재 운행 중인 버스 위치를 확인합니다."],
                ["2", "목적지에 맞는 통학버스 노선과 시간을 살펴봅니다."],
                ["3", "운행 변경이나 지연 공지가 있는지 확인합니다."],
              ].map(([step, text]) => (
                <div key={step} className="onboard-reveal flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] font-['Public_Sans'] text-[12px] font-extrabold text-white">
                    {step}
                  </span>
                  <p className="pt-[3px] font-['Public_Sans'] text-[14px] leading-[21px] text-[#334155]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="pb-7 pt-8">
            <button
              onClick={() => navigate("/signup")}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] font-['Public_Sans'] text-[16px] font-extrabold text-white shadow-[0_14px_26px_rgba(30,58,138,0.24)] active:scale-[0.98]"
            >
              시작하기
              <ChevronRight className="h-5 w-5" />
            </button>
            <p className="mt-4 text-center font-['Public_Sans'] text-[13px] text-[#64748b]">
              이미 계정이 있다면{" "}
              <button onClick={() => navigate("/login")} className="font-bold text-[#1e3a8a]">
                로그인
              </button>
              으로 바로 이동하세요.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
