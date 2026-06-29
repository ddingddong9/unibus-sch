const NOTIFICATION_ENABLED_KEY = "unibus_notifications_enabled";
const NOTIFICATION_UNREAD_KEY = "unibus_notifications_unread";
const LAST_NOTICE_SEEN_KEY = "unibus_last_notice_seen_at";

export function isBrowserNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export function isNotificationEnabled() {
  return localStorage.getItem(NOTIFICATION_ENABLED_KEY) !== "false";
}

export function setNotificationEnabled(enabled: boolean) {
  localStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("unibus:notification-preference", { detail: { enabled } }));
}

export async function requestNotificationPermission() {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.requestPermission();
}

export function getUnreadNoticeCount() {
  return Number(localStorage.getItem(NOTIFICATION_UNREAD_KEY) || "0");
}

export function setUnreadNoticeCount(count: number) {
  localStorage.setItem(NOTIFICATION_UNREAD_KEY, String(Math.max(0, count)));
  window.dispatchEvent(new CustomEvent("unibus:notification-unread", { detail: { count: Math.max(0, count) } }));
}

export function incrementUnreadNoticeCount() {
  setUnreadNoticeCount(getUnreadNoticeCount() + 1);
}

export function clearUnreadNoticeCount() {
  setUnreadNoticeCount(0);
}

export function getLastNoticeSeenAt() {
  return localStorage.getItem(LAST_NOTICE_SEEN_KEY);
}

export function setLastNoticeSeenAt(timestamp: string) {
  localStorage.setItem(LAST_NOTICE_SEEN_KEY, timestamp);
}
