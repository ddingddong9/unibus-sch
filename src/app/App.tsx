import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import NotificationManager from "./components/NotificationManager";

function AppLoadingFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1e3a8a] border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationManager />
        <Suspense fallback={<AppLoadingFallback />}>
          <RouterProvider router={router} />
        </Suspense>
      </LanguageProvider>
    </AuthProvider>
  );
}
