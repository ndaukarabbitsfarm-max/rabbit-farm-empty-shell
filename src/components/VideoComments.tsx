import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Bottom-sheet comment panel for a Reel. The video keeps playing behind it. */
export function VideoComments({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["video-comments", videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_comments")
        .select("*")
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("video_comments").insert({
      video_id: videoId,
      user_id: user.id,
      author_name: profile?.full_name ?? null,
      content: text.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    await qc.invalidateQueries({ queryKey: ["video-comments", videoId] });
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Funga maoni"
        onClick={onClose}
        className="flex-1 bg-black/40"
      />
      <div className="max-h-[65vh] rounded-t-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold">Maoni ({comments?.length ?? 0})</h2>
          <button type="button" onClick={onClose} aria-label="Funga">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="max-h-[38vh] space-y-3 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : comments?.length ? (
            comments.map((c) => (
              <div key={c.id}>
                <p className="text-xs font-semibold">{c.author_name || "Mtumiaji"}</p>
                <p className="text-sm text-foreground/80">{c.content}</p>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Hakuna maoni bado. Kuwa wa kwanza kuandika.
            </p>
          )}
        </div>
        <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {user ? (
            <form onSubmit={post} className="flex items-center gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Andika maoni…"
                className="h-11 flex-1 rounded-xl"
                aria-label="Andika maoni"
              />
              <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <Button asChild className="h-11 w-full rounded-xl">
              <Link to="/auth">Ingia ili kuandika maoni</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
