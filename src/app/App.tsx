import { Suspense, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import NotificationManager from "./components/NotificationManager";
import { AppLoadingSkeleton } from "./components/SkeletonLoaders";

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
            <Suspense fallback={<AppLoadingSkeleton />}>
              <RouterProvider router={router} />
            </Suspense>
          </div>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
