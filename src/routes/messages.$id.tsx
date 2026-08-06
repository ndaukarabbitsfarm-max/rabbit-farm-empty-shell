import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, LogIn, Send, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notifyUser } from "@/lib/push-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages/$id")({
  head: () => ({
    meta: [
      { title: "Conversation — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Chat about breeds, custom cage specifications, pricing and delivery arrangements.",
      },
      { property: "og:title", content: "Conversation — Ndauka Rabbits Farm Marketplace" },
      { property: "og:description", content: "Chat about specs, pricing and delivery." },
    ],
  }),
  component: ConversationPage,
});

function ConversationPage() {
  const { id } = useParams({ from: "/messages/$id" });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery({
    enabled: Boolean(user),
    queryKey: ["conversation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, product_id, products(title)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    enabled: Boolean(user),
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, user, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: id, sender_id: user.id, body: body.trim() });
      if (error) throw error;
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", id);
      const other =
        conversation?.buyer_id === user.id ? conversation?.seller_id : conversation?.buyer_id;
      notifyUser({
        userId: other,
        kind: "chat",
        title: "Ujumbe mpya Messenger",
        body: body.trim().slice(0, 120),
        link: `/messages/${id}`,
      });
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["messages", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <MobileShell title="Conversation">
        <EmptyState
          icon={LogIn}
          title="Sign in to view this conversation"
          action={
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/auth">Log in / Sign up</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  const title = (conversation?.products as { title: string } | null)?.title ?? "Conversation";

  return (
    <MobileShell
      title={title}
      subtitle={conversation?.seller_id === user.id ? "Buyer enquiry" : "Seller chat"}
      right={
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/messages" aria-label="Back to inbox">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-2 px-4 pt-4 pb-28">
        {conversation?.product_id ? (
          <div className="surface-card mb-2 flex items-center justify-between gap-3 p-3">
            <p className="line-clamp-1 text-xs font-medium">{title}</p>
            <Button asChild size="sm" className="h-9 shrink-0 rounded-xl">
              <Link to="/product/$id" params={{ id: conversation.product_id }}>
                <ShoppingBag className="mr-1.5 h-4 w-4" /> Weka Order
              </Link>
            </Button>
          </div>
        ) : null}
        {messages && messages.length > 0 ? (
          messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div
                key={m.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  mine
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted text-foreground",
                )}
              >
                {m.body}
              </div>
            );
          })
        ) : (
          <p className="pt-8 text-center text-sm text-muted-foreground">
            Anza mazungumzo — send the first message.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="fixed inset-x-0 bottom-[68px] z-30 mx-auto flex w-full max-w-[30rem] items-end gap-2 border-t border-border bg-card/95 px-3 py-2 backdrop-blur"
      >
        <Textarea
          rows={1}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-28 min-h-11 flex-1 resize-none rounded-xl"
        />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-xl" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </MobileShell>
  );
}