import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { ProductMiniCard } from "@/components/CompactProductCard";
import type { CardProduct } from "@/components/CompactProductCard";
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_PRODUCT_COLUMNS } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Vipendwa Vyangu — Ndauka Farm" },
      { name: "description", content: "Bidhaa ulizohifadhi kwenye orodha yako ya vipendwa." },
      { property: "og:title", content: "Vipendwa Vyangu — Ndauka Farm" },
      { property: "og:description", content: "Bidhaa ulizohifadhi kwenye orodha yako." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    enabled: Boolean(user),
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase.from("favorites").select("product_id").eq("user_id", user!.id);
      const ids = (favs ?? []).map((f) => f.product_id);
      if (!ids.length) return [] as CardProduct[];
      const { data: products } = await supabase
        .from("products")
        .select(PUBLIC_PRODUCT_COLUMNS)
        .in("id", ids);
      return (products ?? []) as CardProduct[];
    },
  });

  const list = data ?? [];

  return (
    <MobileShell title="My Favorites" subtitle="Bidhaa ulizohifadhi">
      {list.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Hakuna bidhaa uliyohifadhi."
          description="Gusa alama ya moyo kwenye bidhaa ili kuihifadhi hapa."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/">Vinjari soko</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3">
          {list.map((p) => (
            <ProductMiniCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </MobileShell>
  );
}