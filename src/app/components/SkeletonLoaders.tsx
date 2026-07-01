/**
 * Screen-specific skeleton loader components.
 * Each skeleton mirrors the exact layout of its target screen
 * so the transition from skeleton → real content feels seamless.
 */

/** Pulse shimmer block – base building block */
function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`bg-[#f1f5f9] animate-pulse rounded-[6px] ${className ?? ""}`} />
  );
}

/* ─────────────────────────────────────────────
   Notice screen skeleton
   ───────────────────────────────────────────── */
export function NoticeSkeleton() {
  // Width variants so rows don't all look identical
  const widths = ["75%", "88%", "65%", "80%"];

  return (
    <div className="space-y-3 w-full">
      {widths.map((w, i) => (
        <div
          key={i}
          className="w-full bg-white border border-[#e2e8f0] rounded-[16px] p-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-[8px]">
                <Shimmer className="h-[22px] w-[52px]" />
              </div>
              {/* Title */}
              <div className="h-[20px] bg-[#f1f5f9] animate-pulse rounded-[6px] mb-[8px]" style={{ width: w }} />
              {/* Date */}
              <Shimmer className="h-[14px] w-[72px]" />
            </div>
            {/* Chevron */}
            <Shimmer className="size-[20px] rounded-[4px] shrink-0 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Home screen skeleton
   ───────────────────────────────────────────── */
export function HomeSkeleton() {
  return (
    <div className="w-full">
      {/* Nearest Stop Card */}
      <div className="px-[24px] py-[16px]">
        <div className="h-[148px] w-full bg-[#dbeafe] animate-pulse rounded-[16px]" />
      </div>

      {/* Quick Actions */}
      <div className="px-[24px] py-[16px] space-y-3">
        {[0, 1, 2].map((i) => (
          <Shimmer key={i} className="h-[76px] w-full rounded-[16px]" />
        ))}
      </div>

      {/* Live Tracking */}
      <div className="px-[24px] py-[16px]">
        <Shimmer className="h-[24px] w-[120px] mb-3" />
        <Shimmer className="h-[128px] w-full rounded-[16px]" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Settings screen skeleton
   ───────────────────────────────────────────── */
export function SettingsSkeleton() {
  return (
    <div className="w-full">
      {/* Profile */}
      <div className="px-[24px] py-[24px] border-b border-[#f1f5f9]">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="size-[72px] bg-[#f1f5f9] animate-pulse rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-[24px] w-[140px]" />
            <Shimmer className="h-[16px] w-[100px]" />
            <Shimmer className="h-[14px] w-[160px]" />
          </div>
        </div>
        <Shimmer className="h-[44px] w-full rounded-[8px] mt-4" />
      </div>

      {/* Preferences section */}
      <div className="px-[24px] py-[16px]">
        <Shimmer className="h-[20px] w-[96px] mb-4" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-[68px] w-full rounded-[12px]" />
          ))}
        </div>
      </div>

      {/* Other section */}
      <div className="px-[24px] py-[16px]">
        <Shimmer className="h-[20px] w-[60px] mb-4" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Shimmer key={i} className="h-[52px] w-full rounded-[12px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Campus Shuttle bottom-sheet stops skeleton
   ───────────────────────────────────────────── */
export function StopListSkeleton() {
  return (
    <div className="space-y-3 px-[16px] pt-[8px] w-full">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-[12px] p-4 border border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shimmer className="size-[40px] rounded-full shrink-0" />
            <div className="space-y-2">
              <Shimmer className="h-[16px] w-[100px]" />
              <Shimmer className="h-[12px] w-[140px]" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Shimmer className="h-[24px] w-[40px]" />
            <Shimmer className="h-[12px] w-[50px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
