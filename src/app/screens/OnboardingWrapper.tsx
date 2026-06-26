import { motion } from "framer-motion";
import {
  Bell,
  BusFront,
  ChevronRight,
  Clock3,
  LogIn,
  MapPinned,
  QrCode,
  Route,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useNavigate } from "react-router";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: MapPinned,
    title: "실시간 위치 확인",
    description: "학내순환과 통학버스의 현재 위치를 지도에서 바로 확인합니다.",
    accent: "bg-[#eef6ff] text-[#1e3a8a]",
  },
  {
    icon: Clock3,
    title: "정류장 도착 정보",
    description: "가까운 정류장 기준으로 버스 도착 흐름을 빠르게 파악합니다.",
    accent: "bg-[#ecfdf5] text-[#047857]",
  },
  {
    icon: Bell,
    title: "운행 공지 안내",
    description: "지연, 변경, 점검 같은 중요한 안내를 한 곳에서 확인합니다.",
    accent: "bg-[#fff7ed] text-[#c2410c]",
  },
];

const useCases = [
  "학내순환 버스 위치를 보고 정류장으로 이동",
  "서울, 인천 등 통학버스 노선과 예약 흐름 확인",
  "QR 탑승과 공지 확인까지 앱 안에서 처리",
];

function MovingBusScene() {
  return (
    <div className="relative h-[320px] overflow-hidden rounded-lg border border-[#dbe4ef] bg-[#f8fafc]">
      <div className="absolute inset-x-0 top-0 h-[74px] bg-[#eaf4ff]" />
      <div className="absolute left-0 right-0 top-[72px] h-[1px] bg-[#d8e7f6]" />
      <div className="absolute left-[28px] top-[28px] flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
        <span className="font-['Public_Sans'] text-[12px] font-bold text-[#0f172a]">운행 중</span>
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 320" fill="none" aria-hidden="true">
        <path
          d="M34 245 C92 188 108 118 174 128 C240 138 230 214 304 176 C336 160 342 121 326 86"
          stroke="#cbd5e1"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M34 245 C92 188 108 118 174 128 C240 138 230 214 304 176 C336 160 342 121 326 86"
          stroke="#1e3a8a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="10 12"
        />
        {[
          [34, 245],
          [174, 128],
          [304, 176],
          [326, 86],
        ].map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="12" fill="white" stroke="#1e3a8a" strokeWidth="4" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#1e3a8a">
              {index + 1}
            </text>
          </g>
        ))}
      </svg>

      <motion.div
        className="absolute left-[22px] top-[230px]"
        animate={{
          x: [0, 72, 146, 222, 294],
          y: [0, -62, -112, -68, -168],
          rotate: [-18, -34, 12, -28, -8],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#1e3a8a] text-white shadow-[0_12px_26px_rgba(30,58,138,0.28)] ring-4 ring-white">
          <BusFront className="h-5 w-5" />
          <span className="absolute -bottom-[5px] h-3 w-3 rotate-45 bg-[#1e3a8a]" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-[22px] left-[20px] right-[20px] rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">가장 가까운 버스</p>
            <p className="font-['Public_Sans'] text-[18px] font-extrabold text-[#0f172a]">학내순환 2호차</p>
          </div>
          <div className="rounded-lg bg-[#ecfdf5] px-3 py-2 text-right">
            <p className="font-['Public_Sans'] text-[11px] font-bold text-[#047857]">예상 도착</p>
            <p className="font-['Public_Sans'] text-[18px] font-extrabold text-[#047857]">3분</p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
          <motion.div
            className="h-full rounded-full bg-[#1e3a8a]"
            animate={{ width: ["18%", "72%", "18%"] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a8a] text-white">
              <BusFront className="h-5 w-5" />
            </div>
            <span className="font-['Public_Sans'] text-[18px] font-extrabold text-[#0f172a]">UniBus</span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="flex h-9 items-center gap-1 rounded-lg border border-[#dbe4ef] bg-white px-3 font-['Public_Sans'] text-[13px] font-bold text-[#1e3a8a] shadow-sm active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" />
            로그인
          </button>
        </header>

        <main>
          <motion.section
            className="pt-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.p
              variants={fadeUp}
              className="mb-3 inline-flex rounded-full bg-[#eaf4ff] px-3 py-1 font-['Public_Sans'] text-[12px] font-bold text-[#1e3a8a]"
            >
              순천향대 버스 이용을 더 쉽게
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="font-['Public_Sans'] text-[34px] font-extrabold leading-[42px] text-[#0f172a]"
            >
              버스가 어디쯤인지,
              <br />
              기다리기 전에 확인하세요
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-4 font-['Public_Sans'] text-[15px] leading-[24px] text-[#475569]"
            >
              UniBus는 학내순환, 통학버스, 공지, 탑승 흐름을 하나로 모아 학생이 버스를 더 편하게 이용하도록 돕는 서비스입니다.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-6">
              <MovingBusScene />
            </motion.div>
          </motion.section>

          <motion.section
            className="py-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.h2 variants={fadeUp} className="font-['Public_Sans'] text-[22px] font-extrabold text-[#0f172a]">
              필요한 정보만 빠르게
            </motion.h2>
            <div className="mt-4 space-y-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    variants={fadeUp}
                    className="flex gap-4 rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm"
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${feature.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-['Public_Sans'] text-[15px] font-extrabold text-[#0f172a]">{feature.title}</h3>
                      <p className="mt-1 font-['Public_Sans'] text-[13px] leading-[20px] text-[#64748b]">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            className="rounded-lg border border-[#dbe4ef] bg-white p-5 shadow-sm"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff7ed] text-[#c2410c]">
                <Route className="h-5 w-5" />
              </div>
              <div>
                <p className="font-['Public_Sans'] text-[12px] font-bold text-[#64748b]">서비스 흐름</p>
                <h2 className="font-['Public_Sans'] text-[20px] font-extrabold text-[#0f172a]">출발 전부터 탑승까지</h2>
              </div>
            </motion.div>
            <div className="space-y-3">
              {useCases.map((text, index) => (
                <motion.div key={text} variants={fadeUp} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] font-['Public_Sans'] text-[12px] font-extrabold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-[3px] font-['Public_Sans'] text-[14px] leading-[21px] text-[#334155]">{text}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="py-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
                <QrCode className="mb-4 h-6 w-6 text-[#1e3a8a]" />
                <p className="font-['Public_Sans'] text-[14px] font-extrabold text-[#0f172a]">QR 탑승</p>
                <p className="mt-1 font-['Public_Sans'] text-[12px] leading-[18px] text-[#64748b]">간편한 확인과 탑승 흐름을 준비합니다.</p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
                <Smartphone className="mb-4 h-6 w-6 text-[#047857]" />
                <p className="font-['Public_Sans'] text-[14px] font-extrabold text-[#0f172a]">모바일 중심</p>
                <p className="mt-1 font-['Public_Sans'] text-[12px] leading-[18px] text-[#64748b]">이동 중에도 필요한 정보를 빠르게 봅니다.</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-3 rounded-lg border border-[#e2e8f0] bg-[#0f172a] p-5 text-white">
              <ShieldCheck className="mb-4 h-6 w-6 text-[#86efac]" />
              <p className="font-['Public_Sans'] text-[17px] font-extrabold">운영자와 기사도 함께 쓰는 구조</p>
              <p className="mt-2 font-['Public_Sans'] text-[13px] leading-[21px] text-[#cbd5e1]">
                관리자는 노선과 버스를 관리하고, 기사는 배정된 버스 운행 상태를 확인할 수 있도록 설계했습니다.
              </p>
            </motion.div>
          </motion.section>

          <section className="pb-7">
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
