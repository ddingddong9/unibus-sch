import { useLocation, Outlet } from "react-router-dom";

// 라우트 그룹별 전환 방향 결정
const AUTH_ROUTES = ["/", "/onboarding", "/login", "/signup"];
const TAB_ROUTES = ["/home", "/campus-shuttle", "/commuter-bus", "/notice", "/settings"];

function getTransitionClass(pathname: string) {
  if (TAB_ROUTES.includes(pathname)) {
    return "route-transition route-transition-tab";
  }
  if (AUTH_ROUTES.includes(pathname)) {
    return "route-transition route-transition-auth";
  }
  return "route-transition route-transition-default";
}

export function AnimatedMobileLayout() {
  const location = useLocation();
  const transitionClass = getTransitionClass(location.pathname);

  return (
    // 모바일: 흰 배경(상태표시줄 색 일치) / 데스크탑: 그라디언트 미리보기
    <div className="min-h-screen w-full bg-white md:bg-gradient-to-br md:from-blue-50 md:to-slate-100 flex items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-none md:max-w-[430px] md:h-[844px] bg-white md:shadow-2xl md:rounded-2xl overflow-hidden relative" style={{ height: '100dvh' }}>
        <div key={location.pathname} className={`absolute inset-0 size-full ${transitionClass}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
