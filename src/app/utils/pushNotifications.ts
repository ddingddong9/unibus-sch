import { api } from "../services/api";

const FALLBACK_VAPID_PUBLIC_KEY = "BLfZ_aHNm22NBBLedLm5NfFb3SR1iIbUL3WrNM-2-BPdHIcP3KCjanwpCrTIQ4JB6WFboaFf889eQ2K2RrNNMbQ";

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function getVapidPublicKey() {
  try {
    const key = await api.getVapidPublicKey();
    return key || FALLBACK_VAPID_PUBLIC_KEY;
  } catch {
    return FALLBACK_VAPID_PUBLIC_KEY;
  }
}

export async function ensurePushSubscription() {
  if (!isPushSupported()) {
    throw new Error("이 브라우저에서는 백그라운드 푸시 알림을 지원하지 않습니다.");
  }

  const registration = await navigator.serviceWorker.ready;
  const publicKey = await getVapidPublicKey();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    });
  }

  await api.subscribePush(subscription.toJSON());
  return subscription;
}

export async function disablePushSubscription() {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return;

  await api.unsubscribePush(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe().catch(() => {});
}
