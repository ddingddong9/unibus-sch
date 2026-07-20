import type { ReactNode } from "react";

type SkeletonProps = {
  announce?: boolean;
};

type SkeletonRegionProps = SkeletonProps & {
  children: ReactNode;
  className?: string;
  label: string;
  visualClassName?: string;
};

const AUTH_ROUTES = new Set(["/", "/onboarding", "/login", "/signup"]);
const NOTICE_ROUTE = "/notice";
const SETTINGS_ROUTE = "/settings";
const HOME_ROUTE = "/home";

/** Accessible wrapper that keeps the visual placeholders out of the accessibility tree. */
function SkeletonRegion({
  announce = true,
  children,
  className = "",
  label,
  visualClassName = "w-full",
}: SkeletonRegionProps) {
  return (
    <div
      aria-busy="true"
      aria-hidden={announce ? undefined : true}
      aria-live={announce ? "polite" : undefined}
      className={className}
      role={announce ? "status" : undefined}
    >
      <div aria-hidden="true" className={visualClassName}>
        {children}
      </div>
      {announce ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

/** Pulse block shared by every loading layout. */
function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-[#e8edf5] motion-safe:animate-pulse motion-reduce:animate-none dark:bg-[#2c2c2e] ${className}`}
    />
  );
}

function SkeletonHeader() {
  return (
    <div className="flex h-[64px] items-center justify-between border-b border-unibus-divider bg-unibus-surface px-5">
      <Shimmer className="size-9 rounded-full" />
      <Shimmer className="h-5 w-24" />
      <Shimmer className="size-9 rounded-full" />
    </div>
  );
}

function TransitSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-2xl border border-unibus-divider bg-unibus-surface p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-2">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-7 w-40" />
          </div>
          <Shimmer className="size-11 rounded-full bg-[var(--unibus-brand-soft)] dark:bg-[var(--unibus-brand-soft)]" />
        </div>
        <Shimmer className="h-[210px] w-full rounded-xl bg-[#dfe8f7] dark:bg-[#172554]" />
      </div>

      <div className="rounded-2xl border border-unibus-divider bg-unibus-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <Shimmer className="h-5 w-28" />
          <Shimmer className="h-7 w-16 rounded-full" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <Shimmer className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-1/2" />
                <Shimmer className="h-3 w-3/4" />
              </div>
              <Shimmer className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthSkeleton() {
  return (
    <div className="flex h-full flex-col bg-unibus-surface px-6 pb-10 pt-[max(env(safe-area-inset-top),32px)]">
      <div className="mb-12 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-[var(--unibus-brand)] shadow-[0_10px_24px_rgba(30,58,138,0.2)]">
          <span className="text-sm font-black tracking-[-0.08em] text-[var(--unibus-brand-foreground)]">U</span>
        </div>
        <Shimmer className="h-5 w-24 bg-[var(--unibus-brand-soft)] dark:bg-[var(--unibus-brand-soft)]" />
      </div>

      <div className="space-y-3">
        <Shimmer className="h-8 w-3/4" />
        <Shimmer className="h-4 w-5/6" />
      </div>

      <div className="mt-10 space-y-4">
        <Shimmer className="h-14 w-full rounded-xl" />
        <Shimmer className="h-14 w-full rounded-xl" />
        <Shimmer className="h-14 w-full rounded-xl bg-[var(--unibus-brand-soft)] dark:bg-[var(--unibus-brand-soft)]" />
      </div>

      <div className="mt-auto flex justify-center gap-2">
        <Shimmer className="h-2 w-8 rounded-full bg-[var(--unibus-brand-soft)] dark:bg-[var(--unibus-brand-soft)]" />
        <Shimmer className="size-2 rounded-full" />
        <Shimmer className="size-2 rounded-full" />
      </div>
    </div>
  );
}

/** Full-app fallback used before a route layout has mounted. */
export function AppLoadingSkeleton() {
  return (
    <SkeletonRegion
      className="flex min-h-dvh w-full items-center justify-center bg-background px-6 text-foreground"
      label="유니버스 앱을 불러오는 중입니다."
    >
      <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[28px] border border-unibus-divider bg-unibus-surface shadow-[0_24px_70px_rgba(30,58,138,0.14)] md:min-h-[680px]">
        <div className="flex min-h-[520px] flex-col px-6 py-8 md:min-h-[680px]">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-[var(--unibus-brand)] shadow-[0_10px_26px_rgba(30,58,138,0.24)] motion-safe:animate-pulse motion-reduce:animate-none">
              <span className="text-base font-black tracking-[-0.08em] text-[var(--unibus-brand-foreground)]">U</span>
            </div>
            <div>
              <p className="text-base font-black tracking-[0.16em] text-unibus-text">UNIBUS</p>
              <p className="mt-0.5 text-xs font-medium text-unibus-muted">앱을 준비하고 있어요</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl bg-[var(--unibus-brand-soft)] p-5">
            <Shimmer className="h-4 w-24 bg-white/70 dark:bg-white/10" />
            <Shimmer className="mt-3 h-8 w-2/3 bg-white/85 dark:bg-white/15" />
            <Shimmer className="mt-8 h-32 w-full rounded-2xl bg-white/70 dark:bg-white/10" />
          </div>

          <div className="mt-6 space-y-3">
            <Shimmer className="h-16 w-full rounded-2xl" />
            <Shimmer className="h-16 w-full rounded-2xl" />
            <Shimmer className="h-16 w-full rounded-2xl" />
          </div>

          <div className="mt-auto flex items-center justify-center gap-2 pt-8">
            <span className="size-1.5 rounded-full bg-[var(--unibus-brand)] motion-safe:animate-pulse motion-reduce:animate-none" />
            <span className="text-xs font-semibold text-unibus-muted">Loading</span>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Route-level fallback. It deliberately excludes the persistent bottom navigation. */
export function RouteLoadingSkeleton({ pathname }: { pathname: string }) {
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  return (
    <SkeletonRegion
      className="h-full w-full overflow-hidden bg-background text-foreground"
      label="요청한 화면을 불러오는 중입니다."
      visualClassName="size-full"
    >
      {isAuthRoute ? (
        <AuthSkeleton />
      ) : (
        <div className="h-full overflow-hidden bg-unibus-surface pb-[76px]">
          <SkeletonHeader />
          <div className="h-[calc(100%_-_64px)] overflow-hidden bg-background">
            {pathname === HOME_ROUTE ? <HomeSkeleton announce={false} /> : null}
            {pathname === NOTICE_ROUTE ? (
              <div className="px-4 py-4">
                <NoticeSkeleton announce={false} />
              </div>
            ) : null}
            {pathname === SETTINGS_ROUTE ? <SettingsSkeleton announce={false} /> : null}
            {pathname !== HOME_ROUTE && pathname !== NOTICE_ROUTE && pathname !== SETTINGS_ROUTE ? (
              <TransitSkeleton />
            ) : null}
          </div>
        </div>
      )}
    </SkeletonRegion>
  );
}

/** Notice list skeleton. */
export function NoticeSkeleton({ announce = true }: SkeletonProps = {}) {
  const widthClasses = ["w-3/4", "w-[88%]", "w-[65%]", "w-4/5"];

  return (
    <SkeletonRegion className="w-full" announce={announce} label="공지 목록을 불러오는 중입니다.">
      <div className="w-full space-y-3">
        {widthClasses.map((widthClass) => (
          <div
            key={widthClass}
            className="w-full rounded-2xl border border-unibus-divider bg-unibus-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Shimmer className="mb-2 h-[22px] w-[52px] rounded-md bg-[var(--unibus-brand-soft)] dark:bg-[var(--unibus-brand-soft)]" />
                <Shimmer className={`mb-2 h-5 ${widthClass}`} />
                <Shimmer className="h-3.5 w-[72px]" />
              </div>
              <Shimmer className="mt-1 size-5 shrink-0 rounded" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Home screen skeleton. */
export function HomeSkeleton({ announce = true }: SkeletonProps = {}) {
  return (
    <SkeletonRegion className="w-full" announce={announce} label="홈 화면을 불러오는 중입니다.">
      <div className="w-full">
        <div className="px-6 py-4">
          <Shimmer className="h-[148px] w-full rounded-2xl bg-[#dfe8f7] dark:bg-[#172554]" />
        </div>

        <div className="space-y-3 px-6 py-4">
          {[0, 1, 2].map((item) => (
            <Shimmer key={item} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>

        <div className="px-6 py-4">
          <Shimmer className="mb-3 h-6 w-[120px]" />
          <Shimmer className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Settings screen skeleton. */
export function SettingsSkeleton({ announce = true }: SkeletonProps = {}) {
  return (
    <SkeletonRegion className="w-full" announce={announce} label="설정 화면을 불러오는 중입니다.">
      <div className="w-full">
        <div className="border-b border-unibus-divider px-6 py-6">
          <div className="flex items-center gap-4">
            <Shimmer className="size-[72px] shrink-0 rounded-full bg-[var(--unibus-brand-soft)] dark:bg-[var(--unibus-brand-soft)]" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-6 w-[140px]" />
              <Shimmer className="h-4 w-[100px]" />
              <Shimmer className="h-3.5 w-[160px]" />
            </div>
          </div>
          <Shimmer className="mt-4 h-11 w-full rounded-lg" />
        </div>

        <div className="px-6 py-4">
          <Shimmer className="mb-4 h-5 w-24" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <Shimmer key={item} className="h-[68px] w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="px-6 py-4">
          <Shimmer className="mb-4 h-5 w-[60px]" />
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <Shimmer key={item} className="h-[52px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Campus shuttle stop-list skeleton. */
export function StopListSkeleton({ announce = true }: SkeletonProps = {}) {
  return (
    <SkeletonRegion className="w-full" announce={announce} label="정류장 목록을 불러오는 중입니다.">
      <div className="w-full space-y-3 px-4 pt-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-xl border border-unibus-divider bg-unibus-surface p-4"
          >
            <div className="flex items-center gap-3">
              <Shimmer className="size-10 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Shimmer className="h-4 w-[100px]" />
                <Shimmer className="h-3 w-[140px]" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Shimmer className="h-6 w-10" />
              <Shimmer className="h-3 w-[50px]" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}
