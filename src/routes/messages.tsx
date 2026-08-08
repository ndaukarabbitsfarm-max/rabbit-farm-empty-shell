import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { LogIn, MessageSquare } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages, UNREAD_KEY } from "@/lib/unread";
import { cn } from "@/lib/utils";

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString();
}

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content:
          "Chat directly with buyers and sellers about breeds, custom cage specs and delivery arrangements.",
      },
      { property: "og:title", content: "Messages — Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content: "Your buyer and seller conversations in one inbox.",
      },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { byConversation } = useUnreadMessages();

  const { data, isLoading } = useQuery({
    enabled: Boolean(user),
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, product_id, last_message_at, products(title)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;

      const ids = (conversations ?? []).map((c) => c.id);
      if (!ids.length) return [];
      const { data: messages } = await supabase
        .from("messages")
        .select("conversation_id, body, created_at, sender_id")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });

      return (conversations ?? []).map((c) => ({
        ...c,
        preview: messages?.find((m) => m.conversation_id === c.id) ?? null,
      }));
    },
  });

  // Any new message should refresh the thread list previews live.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void qc.invalidateQueries({ queryKey: ["conversations", user.id] });
        void qc.invalidateQueries({ queryKey: [UNREAD_KEY, user.id] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  if (!user) {
    return (
      <MobileShell title="Messages">
        <EmptyState
          icon={LogIn}
          title="Sign in to see your messages"
          description="Ingia ili uweze kuwasiliana na wauzaji au wanunuzi."
          action={
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/auth">Log in / Sign up</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Messages" subtitle="Ujumbe wako">
      <div className="space-y-2.5 px-4 pt-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : data && data.length > 0 ? (
          data.map((c) => {
            const unread = byConversation[c.id] ?? 0;
            return (
            <Link
              key={c.id}
              to="/messages/$id"
              params={{ id: c.id }}
              className="surface-card block p-3.5 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className={cn("line-clamp-1 text-sm", unread ? "font-extrabold" : "font-semibold")}>
                  {(c.products as { title: string } | null)?.title ?? "Direct conversation"}
                </h3>
                <span
                  className={cn(
                    "shrink-0 text-[10px]",
                    unread ? "font-bold text-primary" : "text-muted-foreground",
                  )}
                >
                  {formatWhen(c.preview?.created_at ?? c.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <p
                  className={cn(
                    "line-clamp-1 text-xs",
                    unread ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {c.preview
                    ? `${c.preview.sender_id === user.id ? "Wewe: " : ""}${c.preview.body}`
                    : "Hakuna ujumbe bado"}
                </p>
                {unread > 0 ? (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {c.seller_id === user.id ? "Buyer" : "Seller"}
                  </Badge>
                )}
              </div>
            </Link>
            );
          })
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Anzisha mazungumzo kutoka ukurasa wa bidhaa yoyote."
            action={
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/">Browse marketplace</Link>
              </Button>
            }
          />
        )}
      </div>
    </MobileShell>
  );
}