import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-0 md:p-4">
      {/* Mobile-first container with responsive max-width */}
      <div className="w-full max-w-[430px] h-screen md:h-[844px] bg-white md:shadow-2xl md:rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}
