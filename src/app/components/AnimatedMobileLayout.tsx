import { useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

// 라우트 그룹별 전환 방향 결정
const AUTH_ROUTES = ["/", "/onboarding", "/login", "/signup"];
const TAB_ROUTES = ["/home", "/campus-shuttle", "/shuttle", "/commuter-bus", "/notice", "/settings"];

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
  const showBottomNav = TAB_ROUTES.includes(location.pathname);
  const isSplash = location.pathname === "/";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("unibus-mobile-scroll-lock");
    root.classList.toggle("unibus-splash-active", isSplash);

    return () => {
      root.classList.remove("unibus-mobile-scroll-lock");
      root.classList.remove("unibus-splash-active");
    };
  }, [isSplash]);

  return (
    <div
      className={`flex h-dvh w-full items-center justify-center overflow-hidden p-0 md:h-screen md:bg-gradient-to-br md:from-blue-50 md:to-slate-100 md:p-4 ${
        isSplash ? "bg-[#1e3a8a]" : "bg-white"
      }`}
    >
      <div
        className={`relative h-full w-full max-w-none overflow-hidden md:h-[844px] md:max-h-full md:max-w-[430px] md:rounded-2xl md:shadow-2xl ${
          isSplash ? "bg-[#1e3a8a]" : "bg-white"
        }`}
      >
        <div key={location.pathname} className={`absolute inset-0 size-full ${transitionClass}`}>
          <Outlet />
        </div>
        {showBottomNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
