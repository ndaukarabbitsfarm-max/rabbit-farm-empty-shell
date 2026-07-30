import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, PackageOpen, SlidersHorizontal, Rabbit } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, PUBLIC_PRODUCT_COLUMNS } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ndauka Rabbits Farm Marketplace — Buy & Sell Rabbits in Tanzania" },
      {
        name: "description",
        content:
          "Browse breeding rabbits, custom cages, feeds and equipment from verified Tanzanian breeders. Prices in TZS.",
      },
      { property: "og:title", content: "Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content:
          "Browse breeding rabbits, custom cages, feeds and equipment from verified Tanzanian breeders.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("locations").select("*").order("region");
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["feed", search, category, region],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(PUBLIC_PRODUCT_COLUMNS)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (category !== "all") q = q.eq("category_slug", category);
      if (region !== "all") q = q.eq("region", region);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const regions = useMemo(
    () => Array.from(new Set((locations ?? []).map((l) => l.region))),
    [locations],
  );

  return (
    <MobileShell>
      <div className="brand-surface safe-top px-4 pb-6 pt-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Rabbit className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-80">Karibu</p>
            <h1 className="text-base font-semibold leading-tight">
              Ndauka Rabbits Farm Marketplace
            </h1>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rabbits, cages, feeds…"
            aria-label="Search listings"
            className="h-11 rounded-2xl border-0 bg-card pl-9 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-background pt-4">
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {[{ slug: "all", name: "All" }, ...CATEGORIES].map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                category === c.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 pt-3">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="h-9 flex-1 rounded-xl text-xs" aria-label="Filter by region">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 px-4 pt-4">
          {isLoading ? (
            <>
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </>
          ) : products && products.length > 0 ? (
            products.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <EmptyState
              icon={PackageOpen}
              title="Hakuna bidhaa zilizowekwa bado."
              description="Kuwa wa kwanza kuweka bidhaa!"
              action={
                <Button asChild size="lg" className="rounded-xl">
                  <Link to="/post">Post Item</Link>
                </Button>
              }
            />
          )}
        </div>
      </div>
    </MobileShell>
  );
}
