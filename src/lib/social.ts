import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** 1234 -> "1.2K", 14500 -> "14.5K", 2100000 -> "2.1M" */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${v >= 100 ? Math.round(v) : Number(v.toFixed(1))}K`;
  }
  const v = n / 1_000_000;
  return `${v >= 100 ? Math.round(v) : Number(v.toFixed(1))}M`;
}

export type ProductCounts = { likes: number; comments: number };

function tally(rows: { product_id: string }[] | null | undefined) {
  const map = new Map<string, number>();
  for (const row of rows ?? []) map.set(row.product_id, (map.get(row.product_id) ?? 0) + 1);
  return map;
}

/**
 * One shared query that powers the "❤️ 128 · 💬 12" line on every product card,
 * so a grid of cards never fires two requests per tile.
 */
export function useProductCounts() {
  const { data } = useQuery({
    queryKey: ["product-counts"],
    staleTime: 30_000,
    queryFn: async () => {
      const [likes, comments] = await Promise.all([
        supabase.from("product_likes").select("product_id"),
        supabase.from("product_comments").select("product_id"),
      ]);
      return { likes: tally(likes.data), comments: tally(comments.data) };
    },
  });
  return (productId: string): ProductCounts => ({
    likes: data?.likes.get(productId) ?? 0,
    comments: data?.comments.get(productId) ?? 0,
  });
}

/** Like state + counts for a single listing (product detail page). */
export function useProductLikes(productId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["product-likes", productId, user?.id ?? "anon"],
    queryFn: async () => {
      const [likes, comments, mine] = await Promise.all([
        supabase
          .from("product_likes")
          .select("*", { count: "exact", head: true })
          .eq("product_id", productId),
        supabase
          .from("product_comments")
          .select("*", { count: "exact", head: true })
          .eq("product_id", productId),
        user
          ? supabase
              .from("product_likes")
              .select("id")
              .eq("product_id", productId)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return {
        likes: likes.count ?? 0,
        comments: comments.count ?? 0,
        liked: Boolean(mine.data),
      };
    },
  });

  async function toggle() {
    if (!user) return false;
    if (query.data?.liked) {
      await supabase
        .from("product_likes")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("product_likes").insert({ product_id: productId, user_id: user.id });
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["product-likes", productId, user.id] }),
      qc.invalidateQueries({ queryKey: ["product-counts"] }),
    ]);
    return true;
  }

  return {
    likes: query.data?.likes ?? 0,
    comments: query.data?.comments ?? 0,
    liked: query.data?.liked ?? false,
    toggle,
  };
}
