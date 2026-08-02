import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MediaKind = "reel" | "story";

/** Upload dialog shared by the Reel (video_posts) and Story (stories) flows. */
export function CreateMediaDialog({
  kind,
  open,
  onOpenChange,
}: {
  kind: MediaKind | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [productId, setProductId] = useState<string>("none");
  const [busy, setBusy] = useState(false);

  const { data: myProducts } = useQuery({
    enabled: Boolean(user) && kind === "reel",
    queryKey: ["my-products-lite", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  function reset() {
    setFile(null);
    setCaption("");
    setProductId("none");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !kind) return;
    if (!file) {
      toast.error(kind === "reel" ? "Chagua video" : "Chagua picha au video");
      return;
    }
    setBusy(true);
    try {
      const path = `${user.id}/${kind}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const up = await supabase.storage.from("listings").upload(path, file);
      if (up.error) throw up.error;

      if (kind === "reel") {
        const { error } = await supabase.from("video_posts").insert({
          seller_id: user.id,
          video_path: path,
          caption: caption || null,
          product_id: productId === "none" ? null : productId,
        });
        if (error) throw error;
        toast.success("Reel imewekwa");
        await qc.invalidateQueries({ queryKey: ["reels"] });
      } else {
        const { error } = await supabase.from("stories").insert({
          user_id: user.id,
          media_path: path,
          media_type: file.type.startsWith("video") ? "video" : "image",
          caption: caption || null,
        });
        if (error) throw error;
        toast.success("Story yako itaonekana kwa saa 24");
        await qc.invalidateQueries({ queryKey: ["stories"] });
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Imeshindikana kupakia");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[22rem] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{kind === "reel" ? "Weka Reel" : "Weka Story"}</DialogTitle>
          <DialogDescription>
            {kind === "reel"
              ? "Pakia video fupi ya ufugaji, ongeza maelezo na unganisha na bidhaa yako."
              : "Picha au video fupi inayopotea baada ya saa 24."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="media-file">{kind === "reel" ? "Video" : "Picha / Video"}</Label>
            <Input
              id="media-file"
              type="file"
              accept={kind === "reel" ? "video/*" : "image/*,video/*"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-caption">Maelezo</Label>
            <Textarea
              id="media-caption"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="rounded-xl"
            />
          </div>
          {kind === "reel" ? (
            <div className="space-y-1.5">
              <Label htmlFor="media-product">Unganisha bidhaa (hiari)</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="media-product" className="h-11 rounded-xl">
                  <SelectValue placeholder="Hakuna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Hakuna</SelectItem>
                  {(myProducts ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pakia"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
