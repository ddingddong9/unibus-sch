import { Suspense, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { RouteLoadingSkeleton } from "./SkeletonLoaders";

const AUTH_ROUTE_INDEX: Record<string, number> = {
  "/": 0,
  "/onboarding": 1,
  "/login": 2,
  "/signup": 3,
};

const TAB_ROUTE_INDEX: Record<string, number> = {
  "/home": 0,
  "/campus-shuttle": 1,
  "/shuttle": 1,
  "/commuter-bus": 2,
  "/notice": 3,
  "/settings": 4,
};

const TAB_ROUTES = new Set(Object.keys(TAB_ROUTE_INDEX));
const AUTH_ROUTES = new Set(Object.keys(AUTH_ROUTE_INDEX));

type TransitionKind = "auth" | "tab" | "default";

type RouteTransition = {
  direction: number;
  kind: TransitionKind;
  reduced: boolean;
};

function getTransitionKind(pathname: string): TransitionKind {
  if (TAB_ROUTES.has(pathname)) return "tab";
  if (AUTH_ROUTES.has(pathname)) return "auth";
  return "default";
}

function getTransitionDirection(previousPathname: string, pathname: string) {
  const previousTabIndex = TAB_ROUTE_INDEX[previousPathname];
  const tabIndex = TAB_ROUTE_INDEX[pathname];

  if (previousTabIndex !== undefined && tabIndex !== undefined) {
    return Math.sign(tabIndex - previousTabIndex);
  }

  const previousAuthIndex = AUTH_ROUTE_INDEX[previousPathname];
  const authIndex = AUTH_ROUTE_INDEX[pathname];

  if (previousAuthIndex !== undefined && authIndex !== undefined) {
    return Math.sign(authIndex - previousAuthIndex);
  }

  if (previousPathname === "/qr-scanner") return -1;
  if (pathname === "/qr-scanner") return 1;
  return previousPathname === pathname ? 0 : 1;
}

const routeVariants = {
  initial: ({ direction, kind, reduced }: RouteTransition) => {
    if (reduced) return { opacity: 1, x: 0, y: 0, scale: 1 };
    if (kind === "tab") return { opacity: 0, x: direction * 8, y: 3, scale: 0.998 };
    if (kind === "auth") return { opacity: 0, x: direction * 14, y: 0, scale: 1 };
    return { opacity: 0, x: direction * 10, y: 4, scale: 0.998 };
  },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: ({ direction, kind, reduced }: RouteTransition) => {
    if (reduced) return { opacity: 1, x: 0, y: 0, scale: 1 };
    if (kind === "tab") return { opacity: 0, x: direction * -5, y: -2, scale: 0.998 };
    if (kind === "auth") return { opacity: 0, x: direction * -10, y: 0, scale: 1 };
    return { opacity: 0, x: direction * -7, y: -2, scale: 0.998 };
  },
};

export function AnimatedMobileLayout() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const previousPathnameRef = useRef(location.pathname);
  const showBottomNav = TAB_ROUTES.has(location.pathname);
  const isSplash = location.pathname === "/";
  const transition = useMemo<RouteTransition>(
    () => ({
      direction: getTransitionDirection(previousPathnameRef.current, location.pathname),
      kind: getTransitionKind(location.pathname),
      reduced: Boolean(reducedMotion),
    }),
    [location.pathname, reducedMotion],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("unibus-mobile-scroll-lock");
    root.classList.toggle("unibus-splash-active", isSplash);

    return () => {
      root.classList.remove("unibus-mobile-scroll-lock");
      root.classList.remove("unibus-splash-active");
    };
  }, [isSplash]);

  useEffect(() => {
    previousPathnameRef.current = location.pathname;
  }, [location.pathname]);

  return (
    <div
      className={`flex h-dvh w-full items-center justify-center overflow-hidden p-0 transition-colors duration-200 motion-reduce:transition-none md:h-screen md:bg-gradient-to-br md:from-blue-50 md:to-slate-100 md:p-4 md:dark:from-slate-950 md:dark:to-black ${
        isSplash ? "bg-[#1e3a8a]" : "bg-background"
      }`}
    >
      <div
        className={`relative h-full w-full max-w-none overflow-hidden transition-colors duration-200 motion-reduce:transition-none md:h-[844px] md:max-h-full md:max-w-[430px] md:rounded-2xl md:shadow-2xl ${
          isSplash ? "bg-[#1e3a8a]" : "bg-background"
        }`}
      >
        <AnimatePresence initial={false} mode="wait" custom={transition}>
          <motion.div
            key={location.pathname}
            animate="animate"
            className="absolute inset-0 size-full"
            custom={transition}
            exit="exit"
            initial="initial"
            transition={
              transition.reduced
                ? { duration: 0 }
                : transition.kind === "auth"
                  ? { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
            }
            variants={routeVariants}
          >
            <Suspense fallback={<RouteLoadingSkeleton pathname={location.pathname} />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
        {showBottomNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
