import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Loader2 } from "lucide-react";
import { MobileShell, NotificationBell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { VideoComments } from "@/components/VideoComments";
import { ReelCard, type Reel } from "@/components/ReelCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tips")({
  head: () => ({
    meta: [
      { title: "Vidokezo — Ndauka Farm" },
      {
        name: "description",
        content: "Video na maelekezo ya ufugaji bora wa sungura, kuku, bata na njiwa Tanzania.",
      },
      { property: "og:title", content: "Vidokezo — Ndauka Farm" },
      { property: "og:description", content: "Maelekezo ya ufugaji bora wa mifugo." },
    ],
  }),
  component: TipsPage,
});

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
    <MobileShell title="Vidokezo" subtitle="Video na maarifa ya ufugaji" right={<NotificationBell />}>
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
