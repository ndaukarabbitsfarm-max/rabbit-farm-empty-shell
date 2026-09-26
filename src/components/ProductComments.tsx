import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notifyUser } from "@/lib/push-client";

/** Public Q&A thread under a listing (product_comments table). */
export function ProductComments({
  productId,
  sellerId,
  productTitle,
}: {
  productId: string;
  sellerId?: string | null;
  productTitle?: string | null;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["product-comments", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_comments")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string | null }[] };
      return (data ?? []).map((c) => ({
        ...c,
        author: profiles?.find((p) => p.id === c.user_id)?.full_name ?? "Mtumiaji",
      }));
    },
  });

  const [replyTo, setReplyTo] = useState<{ id: string; userId: string; author: string } | null>(null);
  const [replyText, setReplyText] = useState("");

  const topLevel = (comments ?? []).filter((c) => !c.parent_id);
  const repliesOf = (id: string) =>
    (comments ?? [])
      .filter((c) => c.parent_id === id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["product-comments", productId] }),
      qc.invalidateQueries({ queryKey: ["product-likes", productId] }),
      qc.invalidateQueries({ queryKey: ["product-counts"] }),
    ]);
  }

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from("product_comments")
      .insert({ product_id: productId, user_id: user.id, comment: text.trim() });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    notifyUser({
      userId: sellerId,
      kind: "comment",
      title: "Swali jipya kwenye bidhaa yako",
      body: `${productTitle ?? "Bidhaa yako"}: ${text.trim().slice(0, 100)}`,
      link: `/product/${productId}`,
    });
    setText("");
    toast.success("Maoni yametumwa");
    await refresh();
  }

  async function postReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !replyTo || !replyText.trim()) return;
    setBusy(true);
    const body = replyText.trim();
    const { error } = await supabase.from("product_comments").insert({
      product_id: productId,
      user_id: user.id,
      comment: body,
      parent_id: replyTo.id,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    notifyUser({
      userId: replyTo.userId,
      kind: "comment",
      title: "Jibu jipya kwenye maoni yako",
      body: `${productTitle ?? "Bidhaa"}: ${body.slice(0, 100)}`,
      link: `/product/${productId}`,
    });
    if (sellerId && sellerId !== replyTo.userId) {
      notifyUser({
        userId: sellerId,
        kind: "comment",
        title: "Jibu jipya kwenye bidhaa yako",
        body: `${productTitle ?? "Bidhaa yako"}: ${body.slice(0, 100)}`,
        link: `/product/${productId}`,
      });
    }
    setReplyText("");
    setReplyTo(null);
    toast.success("Jibu limetumwa");
    await refresh();
  }

  return (
    <section id="product-comments" className="surface-card scroll-mt-20 space-y-3 p-4">
      <h3 className="text-sm font-semibold">Maoni na maswali ({comments?.length ?? 0})</h3>
      {user ? (
        <form onSubmit={post} className="flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Uliza swali kuhusu bidhaa hii…"
            className="h-11 flex-1 rounded-xl"
            aria-label="Andika maoni kuhusu bidhaa"
          />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      ) : (
        <Button asChild variant="outline" className="h-11 w-full rounded-xl">
          <Link to="/auth">Ingia ili kuandika maoni</Link>
        </Button>
      )}
      <div className="space-y-3">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : topLevel.length ? (
          topLevel.map((c) => {
            const replies = repliesOf(c.id);
            return (
              <div key={c.id} className="border-t border-border/70 pt-2 first:border-t-0 first:pt-0">
                <p className="text-xs font-semibold">{c.author}</p>
                <p className="text-sm text-foreground/80">{c.comment}</p>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>Majibu {replies.length}</span>
                  {user && (
                    <button
                      type="button"
                      className="font-semibold text-primary"
                      onClick={() => setReplyTo({ id: c.id, userId: c.user_id, author: c.author })}
                    >
                      Jibu
                    </button>
                  )}
                </div>
                {replies.length > 0 && (
                  <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
                    {replies.map((r) => (
                      <div key={r.id}>
                        <p className="text-xs font-semibold">{r.author}</p>
                        <p className="text-sm text-foreground/80">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
                {replyTo?.id === c.id && (
                  <form onSubmit={postReply} className="mt-2 flex items-center gap-2">
                    <Input
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Jibu ${c.author}…`}
                      className="h-10 flex-1 rounded-xl"
                      aria-label="Andika jibu"
                    />
                    <Button type="submit" size="icon" className="h-10 w-10 rounded-xl" disabled={busy}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground">Hakuna maoni bado.</p>
        )}
      </div>
    </section>
  );
}
