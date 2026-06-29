import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getLastNoticeSeenAt,
  getNotificationPermission,
  incrementUnreadNoticeCount,
  isNotificationEnabled,
  setLastNoticeSeenAt,
} from "../utils/notificationPreferences";

function showNoticeNotification(title: string, body: string) {
  if (!isNotificationEnabled() || getNotificationPermission() !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "unibus-notice",
    });
  } catch {
    // Some embedded browsers expose Notification but block construction.
  }
}

export default function NotificationManager() {
  const { isAuthenticated, isAdmin } = useAuth();
  const latestSeenRef = useRef<string | null>(getLastNoticeSeenAt());
  const [enabled, setEnabled] = useState(() => isNotificationEnabled());

  useEffect(() => {
    const handlePreference = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled: boolean }>;
      setEnabled(customEvent.detail?.enabled ?? isNotificationEnabled());
      latestSeenRef.current = getLastNoticeSeenAt();
    };
    window.addEventListener("unibus:notification-preference", handlePreference);
    return () => window.removeEventListener("unibus:notification-preference", handlePreference);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isAdmin || !enabled) return;
    let cancelled = false;
    let subscribedChannel: any = null;

    import("../services/supabase").then(({ supabase }) => {
      if (cancelled) return;

      subscribedChannel = supabase
        .channel(`notice-notifications-${Date.now()}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notices" },
          (payload) => {
            const notice = payload.new as any;
            const createdAt = notice.created_at || new Date().toISOString();

            if (latestSeenRef.current && new Date(createdAt) <= new Date(latestSeenRef.current)) {
              return;
            }

            latestSeenRef.current = createdAt;
            setLastNoticeSeenAt(createdAt);
            incrementUnreadNoticeCount();
            showNoticeNotification(notice.title || "UNIBUS 알림", notice.content || "새 공지사항이 도착했습니다.");
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (subscribedChannel) {
        import("../services/supabase").then(({ supabase }) => supabase.removeChannel(subscribedChannel));
      }
    };
  }, [isAuthenticated, isAdmin, enabled]);

  return null;
}
