self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("api-cache"));
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "UNIBUS 알림";
  const options = {
    body: payload.body || "새 공지사항이 도착했습니다.",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: payload.noticeId || "unibus-notice",
    data: {
      url: payload.url || "/notice",
      noticeId: payload.noticeId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/notice";

  event.waitUntil((async () => {
    const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const origin = self.location.origin;
    let absoluteTarget = `${origin}/notice`;
    try {
      const requestedTarget = new URL(targetUrl, origin);
      if (requestedTarget.origin === origin) absoluteTarget = requestedTarget.href;
    } catch {
      // Keep the safe in-app fallback.
    }

    for (const client of clientList) {
      if ("focus" in client && client.url.startsWith(origin)) {
        await client.focus();
        if ("navigate" in client) await client.navigate(absoluteTarget);
        return;
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(absoluteTarget);
    }
  })());
});
