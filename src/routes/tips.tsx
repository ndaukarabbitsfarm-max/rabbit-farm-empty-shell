import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, MessageSquare, Loader2 } from "lucide-react";
import { MobileShell, NotificationBell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { VideoComments } from "@/components/VideoComments";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";

export const Route = createFileRoute("/tips")({
  head: () => ({
    meta: [
      { title: "Elimika — Ndauka Farm" },
      {
        name: "description",
        content: "Video na maelekezo ya ufugaji bora wa sungura, kuku, bata na njiwa Tanzania.",
      },
      { property: "og:title", content: "Elimika — Ndauka Farm" },
      { property: "og:description", content: "Maelekezo ya ufugaji bora wa mifugo." },
    ],
  }),
  component: TipsPage,
});

type Reel = {
  id: string;
  caption: string | null;
  video_path: string;
  product_id: string | null;
  seller_id: string;
};

function ReelCard({ reel, onComments }: { reel: Reel; onComments: () => void }) {
  const { data: url } = useQuery({
    queryKey: ["reel-media", reel.video_path],
    queryFn: () => signedUrl("listings", reel.video_path),
  });

  return (
    <article className="relative h-[75vh] w-full snap-start overflow-hidden rounded-2xl bg-black">
      {url ? (
        <video
          src={url}
          controls
          playsInline
          loop
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/70" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="min-w-0">
          {reel.caption ? <p className="text-sm text-white">{reel.caption}</p> : null}
          {reel.product_id ? (
            <Link
              to="/product/$id"
              params={{ id: reel.product_id }}
              className="pointer-events-auto mt-2 inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground"
            >
              Angalia bidhaa
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onComments}
          aria-label="Fungua maoni"
          className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}

function TipsPage() {
  const [openComments, setOpenComments] = useState<string | null>(null);

  const { data: reels, isLoading } = useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_posts")
        .select("id, caption, video_path, product_id, seller_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Reel[];
    },
  });

  return (
    <MobileShell title="Elimika" subtitle="Video na maarifa ya ufugaji" right={<NotificationBell />}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : reels?.length ? (
        <div className="snap-y snap-mandatory space-y-3 px-3 py-3">
          {reels.map((r) => (
            <ReelCard key={r.id} reel={r} onComments={() => setOpenComments(r.id)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Hakuna video za elimu bado."
          description="Maudhui ya mafunzo yatawekwa na wafugaji na wasimamizi wa soko."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/">Rudi sokoni</Link>
            </Button>
          }
        />
      )}
      {openComments ? (
        <VideoComments videoId={openComments} onClose={() => setOpenComments(null)} />
      ) : null}
    </MobileShell>
  );
}
