import type { ReactNode } from "react";

interface UserPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function UserPageHeader({ title, subtitle, action }: UserPageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#e8edf3] bg-white/95 pt-safe backdrop-blur-xl">
      <div className="flex min-h-[68px] items-center justify-between gap-4 px-5 py-3">
        <div className="min-w-0">
          <h1 className="truncate font-['Public_Sans'] text-[21px] font-bold leading-7 text-[#0f172a]">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate font-['Public_Sans'] text-[12px] font-medium leading-4 text-[#64748b]">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center">{action}</div>
      </div>
    </header>
  );
}
