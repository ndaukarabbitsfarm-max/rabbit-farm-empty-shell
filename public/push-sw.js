/* Web Push handlers, merged into the generated Workbox service worker. */

/** Remembers the individual lines of each grouped notification tag. */
const GROUPS = new Map();

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Ndauka Rabbit Market", body: event.data ? event.data.text() : "" };
  }

  const tag = payload.tag || "ndauka";
  const sender = payload.sender || payload.title || "Ndauka Rabbit Market";
  const line = payload.body || "";
  const url = payload.url || "/notifications";

  event.waitUntil(
    (async () => {
      // Collect what is already on screen for this tag so repeats stack together.
      const existing = await self.registration.getNotifications({ tag });
      const previous = GROUPS.get(tag) || [];
      const lines = (existing.length ? previous : []).concat(line ? [`${sender}: ${line}`] : []);
      GROUPS.set(tag, lines.slice(-8));

      const grouped = lines.length > 1;
      const title = grouped ? "Ndauka Rabbit Market" : sender;
      const body = grouped ? `Ujumbe ${lines.length} mpya` : line;

      await self.registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag,
        renotify: true,
        requireInteraction: false,
        silent: false,
        vibrate: [120, 60, 120],
        timestamp: Date.now(),
        data: { url, tag },
        ...(grouped ? { body: `${body}\n${lines.join("\n")}` } : {}),
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  if (data.tag) GROUPS.delete(data.tag);
  const url = data.url || "/notifications";
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});

self.addEventListener("notificationclose", (event) => {
  const data = event.notification.data || {};
  if (data.tag) GROUPS.delete(data.tag);
});
