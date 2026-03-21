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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-[430px] h-screen md:h-[844px] bg-white md:shadow-2xl md:rounded-2xl overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{
              duration: 0.22,
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
