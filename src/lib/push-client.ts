import { getVapidPublicKey, sendAppNotification } from "@/lib/push.functions";
import { supabase } from "@/integrations/supabase/client";

const SW_URL = "/sw.js";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_URL, { scope: "/" });
}

export async function isPushEnabled() {
  if (!isPushSupported() || Notification.permission !== "granted") return false;
  const registration = await navigator.serviceWorker.getRegistration();
  const sub = await registration?.pushManager.getSubscription();
  return Boolean(sub);
}

/** Ask for permission, subscribe the device, and store it for this user. */
export async function enablePush(userId: string) {
  if (!isPushSupported()) throw new Error("Kifaa hiki hakisapoti arifa za push.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Ruhusa ya arifa haikutolewa.");

  const { publicKey } = await getVapidPublicKey();
  if (!publicKey) throw new Error("Arifa hazijawekwa vizuri kwenye seva.");

  const registration = await getRegistration();
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: json.keys ?? {},
      user_agent: navigator.userAgent.slice(0, 300),
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
  return true;
}

export async function disablePush() {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
}

/** Fire-and-forget in-app + push notification. Never blocks the calling UI. */
export function notifyUser(input: {
  userId: string | null | undefined;
  kind: string;
  title: string;
  body: string;
  link?: string;
}) {
  if (!input.userId) return;
  void sendAppNotification({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      ...(input.link ? { link: input.link } : {}),
    },
  }).catch(() => {
    /* notifications are best-effort */
  });
}
