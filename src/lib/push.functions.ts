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

/** Notify every admin that a new KYC submission is waiting for review. */
export const notifyAdminsKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sellerName: string; kind: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    let sent = 0;
    for (const row of admins ?? []) {
      const res = await deliverNotification({
        userId: row.user_id,
        kind: "kyc",
        title: "KYC mpya imewasilishwa",
        body: `${data.sellerName} amewasilisha nyaraka za ${data.kind === "builder" ? "Builder" : "Breeder"}.`,
        link: "/admin/kyc",
      });
      sent += res.sent;
    }
    return { sent };
  });
