import { useEffect, useLayoutEffect, useRef } from "react";
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
  const mobileCanvasRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    const updateMobileCanvas = () => {
      const canvas = mobileCanvasRef.current;
      if (!canvas) return;

      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const scale = Math.min(1, viewportWidth / 430);

      canvas.style.setProperty("--unibus-mobile-scale", String(scale));
      canvas.style.setProperty("--unibus-mobile-canvas-height", `${viewportHeight / scale}px`);
    };

    updateMobileCanvas();
    window.addEventListener("resize", updateMobileCanvas);
    window.visualViewport?.addEventListener("resize", updateMobileCanvas);

    return () => {
      window.removeEventListener("resize", updateMobileCanvas);
      window.visualViewport?.removeEventListener("resize", updateMobileCanvas);
    };
  }, []);

  return (
    <div
      className={`flex h-dvh w-full items-start justify-start overflow-hidden p-0 md:h-screen md:items-center md:justify-center md:bg-gradient-to-br md:from-blue-50 md:to-slate-100 md:p-4 ${
        isSplash ? "bg-[#1e3a8a]" : "bg-white"
      }`}
    >
      <div
        ref={mobileCanvasRef}
        className={`unibus-mobile-canvas relative h-full w-full max-w-none overflow-hidden md:h-[844px] md:max-h-full md:max-w-[430px] md:rounded-2xl md:shadow-2xl ${
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
