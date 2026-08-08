import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, Loader2, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { notifyUser } from "@/lib/push-client";
import { cn } from "@/lib/utils";

export type Reel = {
  id: string;
  caption: string | null;
  video_path: string;
  product_id: string | null;
  seller_id: string;
};

function ActionButton({
  icon: Icon,
  count,
  active,
  label,
  onClick,
}: {
  icon: typeof Heart;
  count?: number;
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1 text-white"
    >
      <Icon
        className={cn("h-7 w-7 drop-shadow", active ? "fill-current text-primary" : "text-white")}
      />
      <span className="text-[11px] font-semibold drop-shadow">{count ?? 0}</span>
    </button>
  );
}

export function ReelCard({ reel, onComments }: { reel: Reel; onComments: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const { data: url } = useQuery({
    queryKey: ["reel-media", reel.video_path],
    queryFn: () => signedUrl("listings", reel.video_path),
  });

  // Autoplay the reel that is centred in the viewport; pause the others.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          void el.play().catch(() => {
            /* autoplay can be refused before any user gesture */
          });
        } else {
          el.pause();
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [url]);

  const { data: seller } = useQuery({
    queryKey: ["reel-seller", reel.seller_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", reel.seller_id)
        .maybeSingle();
      return data;
    },
  });

  const { data: avatar } = useQuery({
    enabled: Boolean(seller?.avatar_url),
    queryKey: ["avatar", seller?.avatar_url],
    queryFn: () => signedUrl("avatars", seller?.avatar_url),
  });

  const { data: stats } = useQuery({
    queryKey: ["reel-stats", reel.id, user?.id ?? "anon"],
    queryFn: async () => {
      const [likes, comments, saves, myLike, mySave, myFollow] = await Promise.all([
        supabase.from("video_likes").select("*", { count: "exact", head: true }).eq("video_id", reel.id),
        supabase
          .from("video_comments")
          .select("*", { count: "exact", head: true })
          .eq("video_id", reel.id),
        supabase.from("video_saves").select("*", { count: "exact", head: true }).eq("video_id", reel.id),
        user
          ? supabase.from("video_likes").select("video_id").eq("video_id", reel.id).eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        user
          ? supabase.from("video_saves").select("video_id").eq("video_id", reel.id).eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        user
          ? supabase
              .from("follows")
              .select("followed_id")
              .eq("followed_id", reel.seller_id)
              .eq("follower_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return {
        likes: likes.count ?? 0,
        comments: comments.count ?? 0,
        saves: saves.count ?? 0,
        liked: Boolean(myLike.data),
        saved: Boolean(mySave.data),
        following: Boolean(myFollow.data),
      };
    },
  });

  function requireLogin() {
    if (user) return true;
    toast.error("Ingia kwanza ili kuendelea.");
    return false;
  }

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["reel-stats", reel.id, user?.id ?? "anon"] });
  }

  async function toggleLike() {
    if (!requireLogin()) return;
    if (stats?.liked) {
      await supabase.from("video_likes").delete().eq("video_id", reel.id).eq("user_id", user!.id);
    } else {
      const { error } = await supabase
        .from("video_likes")
        .insert({ video_id: reel.id, user_id: user!.id });
      if (error) return toast.error(error.message);
      notifyUser({
        userId: reel.seller_id,
        kind: "like",
        title: "Like mpya kwenye Reel yako",
        body: "Mtumiaji amependa video yako kwenye Vidokezo.",
        link: "/tips",
      });
    }
    await refresh();
  }

  async function toggleSave() {
    if (!requireLogin()) return;
    if (stats?.saved) {
      await supabase.from("video_saves").delete().eq("video_id", reel.id).eq("user_id", user!.id);
    } else {
      const { error } = await supabase
        .from("video_saves")
        .insert({ video_id: reel.id, user_id: user!.id });
      if (error) return toast.error(error.message);
    }
    await refresh();
  }

  async function toggleFollow() {
    if (!requireLogin()) return;
    if (stats?.following) {
      await supabase
        .from("follows")
        .delete()
        .eq("followed_id", reel.seller_id)
        .eq("follower_id", user!.id);
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ followed_id: reel.seller_id, follower_id: user!.id });
      if (error) return toast.error(error.message);
      notifyUser({
        userId: reel.seller_id,
        kind: "follow",
        title: "Una mfuasi mpya",
        body: "Mtumiaji ameanza kukufuata kwenye Ndauka Farm.",
        link: "/tips",
      });
    }
    await refresh();
  }

  async function share() {
    const link = `${window.location.origin}/tips`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ndauka Farm", text: reel.caption ?? "Angalia Reel hii", url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Kiungo kimenakiliwa.");
      }
    } catch {
      /* user cancelled */
    }
  }

  const name = seller?.full_name ?? "Mfugaji";

  return (
    <article className="relative h-[75vh] w-full snap-start overflow-hidden rounded-2xl bg-black">
      {url ? (
        <>
          <video
            ref={videoRef}
            src={url}
            muted={muted}
            playsInline
            loop
            preload="metadata"
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              if (el.paused) void el.play().catch(() => {});
              else el.pause();
            }}
            className="h-full w-full object-contain"
          />
          <button
            type="button"
            onClick={() => setMuted((v) => !v)}
            aria-label={muted ? "Washa sauti" : "Zima sauti"}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/70" />
        </div>
      )}

      {/* Right action rail */}
      <div className="pointer-events-auto absolute bottom-28 right-3 flex flex-col items-center gap-5">
        <ActionButton
          icon={Heart}
          label="Like"
          count={stats?.likes}
          active={stats?.liked}
          onClick={() => void toggleLike()}
        />
        <ActionButton icon={MessageCircle} label="Maoni" count={stats?.comments} onClick={onComments} />
        <button
          type="button"
          onClick={() => void share()}
          aria-label="Sambaza"
          className="flex flex-col items-center gap-1 text-white"
        >
          <Share2 className="h-7 w-7 drop-shadow" />
          <span className="text-[11px] font-semibold drop-shadow">Share</span>
        </button>
        <ActionButton
          icon={Bookmark}
          label="Hifadhi"
          count={stats?.saves}
          active={stats?.saved}
          onClick={() => void toggleSave()}
        />
      </div>

      {/* Seller row + caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-4 pr-20">
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/60 bg-white/20">
            {avatar ? (
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          <span className="truncate text-sm font-semibold text-white">{name}</span>
          {user?.id === reel.seller_id ? null : (
            <button
              type="button"
              onClick={() => void toggleFollow()}
              className={cn(
                "shrink-0 rounded-md border px-3 py-1 text-[11px] font-bold",
                stats?.following
                  ? "border-white/60 text-white/80"
                  : "border-white text-white",
              )}
            >
              {stats?.following ? "Unafuata" : "Follow"}
            </button>
          )}
        </div>
        {reel.caption ? <p className="text-sm text-white">{reel.caption}</p> : null}
        {reel.product_id ? (
          <Link
            to="/product/$id"
            params={{ id: reel.product_id }}
            className="pointer-events-auto inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground"
          >
            Angalia bidhaa
          </Link>
        ) : null}
      </div>
    </article>
  );
}
