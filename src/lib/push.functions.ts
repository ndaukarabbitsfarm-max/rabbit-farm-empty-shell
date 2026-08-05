import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deliverNotification } from "@/lib/push.server";

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => ({
  publicKey: process.env["VAPID_PUBLIC_KEY"] ?? "",
}));

export const sendAppNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { userId: string; kind: string; title: string; body: string; link?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    if (!data.userId || data.userId === context.userId) return { sent: 0 };
    return deliverNotification({
      userId: data.userId,
      kind: data.kind,
      title: data.title,
      body: data.body,
      link: data.link ?? null,
    });
  });
