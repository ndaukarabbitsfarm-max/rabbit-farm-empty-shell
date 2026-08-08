import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  sender?: string;
};

/** Which preference switch guards each notification kind. */
const PREF_BY_KIND: Record<string, "orders" | "messages" | "reels" | "kyc"> = {
  order: "orders",
  orders: "orders",
  chat: "messages",
  message: "messages",
  comment: "reels",
  like: "reels",
  follow: "reels",
  reel: "reels",
  kyc: "kyc",
};

function vapid() {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:support@ndauka.farm";
  if (!publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

async function isKindAllowed(userId: string, kind: string) {
  const column = PREF_BY_KIND[kind];
  if (!column) return true;
  const { data } = await supabaseAdmin
    .from("notification_prefs")
    .select("orders, messages, reels, kyc")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return true; // no row yet = everything on
  return data[column] !== false;
}

/** Send a web-push message to every registered device of a user. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const keys = vapid();
  if (!keys) return { sent: 0 };

  const { data } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", userId);

  let sent = 0;
  await Promise.all(
    (data ?? []).map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        expirationTime: null,
        keys: row.keys as unknown as { p256dh: string; auth: string },
      } satisfies PushSubscription;
      try {
        const request = await buildPushPayload(
          {
            data: JSON.stringify(payload),
            options: {
              ttl: 60 * 60 * 24,
              // High urgency = heads-up banner on Android, delivered even on a locked screen.
              urgency: "high",
              ...(payload.tag ? { topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) } : {}),
            },
          },
          subscription,
          keys,
        );
        const res = await fetch(subscription.endpoint, request as unknown as RequestInit);
        if (res.status === 404 || res.status === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", row.id);
        } else if (res.ok) {
          sent += 1;
        }
      } catch {
        /* one bad device must not break the rest */
      }
    }),
  );
  return { sent };
}

/** Store the in-app notification row and push it to the user's devices. */
export async function deliverNotification(input: {
  userId: string;
  kind: string;
  title: string;
  body: string;
  link?: string | null;
  sender?: string | null;
}) {
  await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
  });

  if (!(await isKindAllowed(input.userId, input.kind))) return { sent: 0 };

  // Group by conversation (or kind) so repeat messages stack like WhatsApp.
  const tag = input.link?.startsWith("/messages/")
    ? `chat-${input.link.split("/").pop()}`
    : input.kind;

  return sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    url: input.link ?? "/notifications",
    tag,
    ...(input.sender ? { sender: input.sender } : {}),
  });
}
