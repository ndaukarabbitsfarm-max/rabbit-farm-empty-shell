import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing, MessageCircle, PackagePlus } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, markAllNotificationsRead } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Taarifa — Ndauka Farm" },
      { name: "description", content: "Taarifa za bidhaa mpya na maombi ya chat kwenye Ndauka Farm." },
      { property: "og:title", content: "Taarifa — Ndauka Farm" },
      { property: "og:description", content: "Taarifa za papo hapo za soko." },
    ],
  }),
  component: NotificationsPage,
});

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "sasa hivi";
  if (mins < 60) return `dakika ${mins}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `saa ${hrs}`;
  return `siku ${Math.floor(hrs / 24)}`;
}

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { items } = useNotifications();

  useEffect(() => {
    if (!user || items.length === 0) return;
    void markAllNotificationsRead(user.id).then(() =>
      qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, items.length]);

  if (!user) {
    return (
      <MobileShell title="Taarifa">
        <EmptyState
          icon={BellRing}
          title="Ingia ili kuona taarifa zako"
          description="Utapata taarifa za bidhaa mpya na maombi ya chat."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/auth">Ingia</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Taarifa" subtitle="Notification Center">
      {items.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="Hakuna taarifa bado."
          description="Taarifa za bidhaa mpya na maombi ya chat zitaonekana hapa."
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const Icon = n.kind === "chat" ? MessageCircle : PackagePlus;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => n.link && navigate({ to: n.link })}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left",
                    n.read ? "" : "bg-accent/40",
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                    {n.body ? (
                      <span className="block text-xs text-muted-foreground">{n.body}</span>
                    ) : null}
                    <span className="block pt-0.5 text-[10px] text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </MobileShell>
  );
}
