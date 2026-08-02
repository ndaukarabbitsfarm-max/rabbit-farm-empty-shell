import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export type StoryRow = {
  id: string;
  user_id: string;
  media_path: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

export type StoryGroup = {
  userId: string;
  name: string;
  avatarPath: string | null;
  stories: StoryRow[];
};

const SEEN_KEY = "ndauka-seen-stories";

function readSeen(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function useActiveStories() {
  return useQuery({
    queryKey: ["stories"],
    queryFn: async (): Promise<StoryGroup[]> => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as StoryRow[];
      if (!rows.length) return [];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);
      return ids.map((uid) => {
        const p = profiles?.find((x) => x.id === uid);
        return {
          userId: uid,
          name: p?.full_name ?? "Mfugaji",
          avatarPath: p?.avatar_url ?? null,
          stories: rows.filter((r) => r.user_id === uid),
        };
      });
    },
  });
}

function Avatar({ path, name }: { path: string | null; name: string }) {
  const { data: url } = useQuery({
    enabled: Boolean(path),
    queryKey: ["avatar", path],
    queryFn: () => signedUrl("avatars", path),
  });
  return url ? (
    <img src={url} alt={name} className="h-full w-full rounded-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function StoriesBar({ onAdd }: { onAdd?: () => void }) {
  const { data: groups } = useActiveStories();
  const [seen, setSeen] = useState<string[]>([]);
  const [active, setActive] = useState<StoryGroup | null>(null);

  useEffect(() => setSeen(readSeen()), []);

  if (!groups?.length && !onAdd) return null;

  function open(g: StoryGroup) {
    setActive(g);
    const next = Array.from(new Set([...readSeen(), ...g.stories.map((s) => s.id)]));
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setSeen(next);
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex w-14 shrink-0 flex-col items-center gap-1"
            aria-label="Weka Story yako"
          >
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-card">
              <Plus className="h-5 w-5 text-primary" />
            </span>
            <span className="w-full truncate text-center text-[9px] text-muted-foreground">
              Story yako
            </span>
          </button>
        ) : null}
        {(groups ?? []).map((g) => {
          const unseen = g.stories.some((s) => !seen.includes(s.id));
          return (
            <button
              key={g.userId}
              type="button"
              onClick={() => open(g)}
              className="flex w-14 shrink-0 flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full p-[2px]",
                  unseen ? "bg-primary" : "bg-border",
                )}
              >
                <span className="h-full w-full overflow-hidden rounded-full bg-card p-[2px]">
                  <Avatar path={g.avatarPath} name={g.name} />
                </span>
              </span>
              <span className="w-full truncate text-center text-[9px] text-muted-foreground">
                {g.name}
              </span>
            </button>
          );
        })}
      </div>
      {active ? <StoryViewer group={active} onClose={() => setActive(null)} /> : null}
    </>
  );
}

export function StoryViewer({ group, onClose }: { group: StoryGroup; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const story = group.stories[index];

  const { data: url } = useQuery({
    enabled: Boolean(story),
    queryKey: ["story-media", story?.media_path],
    queryFn: () => signedUrl("listings", story!.media_path),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (index + 1 < group.stories.length) setIndex((i) => i + 1);
      else onClose();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [index, group.stories.length, onClose]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex gap-1 px-2 pt-2">
        {group.stories.map((s, i) => (
          <span
            key={s.id}
            className={cn("h-0.5 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/30")}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-white">
        <span className="text-sm font-semibold">{group.name}</span>
        <button type="button" onClick={onClose} aria-label="Funga story">
          <X className="h-5 w-5" />
        </button>
      </div>
      <button
        type="button"
        aria-label="Story inayofuata"
        onClick={() =>
          index + 1 < group.stories.length ? setIndex((i) => i + 1) : onClose()
        }
        className="flex flex-1 items-center justify-center"
      >
        {url ? (
          story.media_type === "video" ? (
            <video src={url} autoPlay muted playsInline className="max-h-full w-full object-contain" />
          ) : (
            <img src={url} alt={story.caption ?? "Story"} className="max-h-full w-full object-contain" />
          )
        ) : null}
      </button>
      {story.caption ? (
        <p className="px-4 pb-8 text-center text-sm text-white">{story.caption}</p>
      ) : (
        <div className="pb-8" />
      )}
    </div>
  );
}
