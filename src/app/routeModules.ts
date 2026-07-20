export const loadOnboardingWrapper = () => import("./screens/OnboardingWrapper");
export const loadLoginWrapper = () => import("./screens/LoginWrapper");
export const loadSignUpWrapper = () => import("./screens/SignUpWrapper");
export const loadHomeWrapper = () => import("./screens/HomeWrapper");
export const loadCampusShuttleWrapper = () => import("./screens/CampusShuttleWrapper");
export const loadCommuterBusWrapper = () => import("./screens/CommuterBusWrapper");
export const loadQrScannerWrapper = () => import("./screens/QrScannerWrapper");
export const loadNoticeWrapper = () => import("./screens/NoticeWrapper");
export const loadSettingsWrapper = () => import("./screens/SettingsWrapper");

const ROUTE_MODULE_LOADERS: Record<string, () => Promise<unknown>> = {
  "/onboarding": loadOnboardingWrapper,
  "/login": loadLoginWrapper,
  "/signup": loadSignUpWrapper,
  "/home": loadHomeWrapper,
  "/campus-shuttle": loadCampusShuttleWrapper,
  "/shuttle": loadCampusShuttleWrapper,
  "/commuter-bus": loadCommuterBusWrapper,
  "/qr-scanner": loadQrScannerWrapper,
  "/notice": loadNoticeWrapper,
  "/settings": loadSettingsWrapper,
};

const preloadRequests = new Map<string, Promise<unknown>>();

export function preloadRouteModule(pathname: string) {
  const loader = ROUTE_MODULE_LOADERS[pathname];
  if (!loader || preloadRequests.has(pathname)) return;

  const request = loader();
  preloadRequests.set(pathname, request);
  void request.catch(() => preloadRequests.delete(pathname));
}
