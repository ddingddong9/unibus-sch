import { Suspense, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import NotificationManager from "./components/NotificationManager";

function AppLoadingFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white dark:bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1e3a8a] border-t-transparent" />
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} themes={["light", "dark"]} disableTransitionOnChange>
      <ThemeModeMigration />
      <AuthProvider>
        <LanguageProvider>
          <div className="unibus-theme min-h-dvh bg-background text-foreground">
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
