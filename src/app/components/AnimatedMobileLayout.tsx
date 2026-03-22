import { useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// 라우트 그룹별 전환 방향 결정
const AUTH_ROUTES = ["/", "/onboarding", "/login", "/signup"];
const TAB_ROUTES = ["/home", "/campus-shuttle", "/commuter-bus", "/notice", "/settings"];

function getTransitionVariants(pathname: string) {
  if (TAB_ROUTES.includes(pathname)) {
    // 탭 전환: 부드러운 페이드 (방향 없음)
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  if (AUTH_ROUTES.includes(pathname)) {
    // 인증 화면: 오른쪽에서 슬라이드 인
    return {
      initial: { opacity: 0, x: 40 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -40 },
    };
  }
  // 기본: 위에서 페이드+슬라이드
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };
}

export function AnimatedMobileLayout() {
  const location = useLocation();
  const variants = getTransitionVariants(location.pathname);

  return (
    // 모바일: 흰 배경(상태표시줄 색 일치) / 데스크탑: 그라디언트 미리보기
    <div className="min-h-screen w-full bg-white md:bg-gradient-to-br md:from-blue-50 md:to-slate-100 flex items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-none md:max-w-[430px] md:h-[844px] bg-white md:shadow-2xl md:rounded-2xl overflow-hidden relative" style={{ height: '100dvh' }}>
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={location.pathname}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{
              duration: TAB_ROUTES.includes(location.pathname) ? 0.15 : 0.22,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute inset-0 size-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
