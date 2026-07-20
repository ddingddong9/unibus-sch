import { Suspense, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import NotificationManager from "./components/NotificationManager";

function AppLoadingFallback() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground"
      role="status"
    >
      <div aria-hidden="true" className="flex items-center gap-3 rounded-3xl border border-unibus-divider bg-unibus-surface px-5 py-4 shadow-[var(--unibus-shadow-card)]">
        <div className="grid size-12 animate-pulse place-items-center rounded-2xl bg-[var(--unibus-brand)] text-base font-black text-[var(--unibus-brand-foreground)] motion-reduce:animate-none">
          U
        </div>
        <div>
          <p className="font-black tracking-[0.16em] text-unibus-text">UNIBUS</p>
          <p className="mt-0.5 text-xs font-semibold text-unibus-muted">앱을 준비하고 있어요</p>
        </div>
      </div>
      <span className="sr-only">유니버스 앱을 불러오는 중입니다.</span>
    </div>
  );
}

function ThemeModeMigration() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme && theme !== "light" && theme !== "dark") setTheme("light");
  }, [setTheme, theme]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} themes={["light", "dark"]}>
      <ThemeModeMigration />
      <AuthProvider>
        <LanguageProvider>
          <div className="unibus-theme min-h-dvh bg-background text-foreground transition-colors duration-200 motion-reduce:transition-none">
            <NotificationManager />
            <Suspense fallback={<AppLoadingFallback />}>
              <RouterProvider router={router} />
            </Suspense>
          </div>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
