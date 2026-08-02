import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  PackageOpen,
  Rabbit,
  LayoutGrid,
  FileText,
  Wheat,
  Bird,
  Boxes,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { MobileShell, CartButton, NotificationBell, TopTabs } from "@/components/MobileShell";
import { AnimatedSearchBar } from "@/components/AnimatedSearchBar";
import { StoriesBar } from "@/components/StoriesBar";
import { EmptyState } from "@/components/EmptyState";
import { DealCard, ProductTile, ProductMiniCard } from "@/components/CompactProductCard";
import type { CardProduct } from "@/components/CompactProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, PUBLIC_PRODUCT_COLUMNS } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ndauka Farm — Soko la Jumla la Mifugo, Mabanda na Chakula" },
      {
        name: "description",
        content:
          "Soko kuu la kidijitali la B2B Tanzania: sungura wa mbegu, kuku, bata, mabanda ya kisasa na chakula cha mifugo kwa bei ya jumla (TZS).",
      },
      { property: "og:title", content: "Ndauka Farm — Soko la Jumla la Mifugo" },
      {
        property: "og:description",
        content: "Nunua na uuze mifugo, mabanda na chakula cha mifugo kwa bei ya jumla.",
      },
    ],
  }),
  component: HomePage,
});

const CATEGORY_ICONS = {
  "breeding-rabbits": Rabbit,
  poultry: Bird,
  "custom-cages": Boxes,
  "feeds-supplements": Wheat,
  equipment: Wrench,
} as const;

const SHORTCUTS = [
  {
    to: "/categories" as const,
    icon: LayoutGrid,
    title: "Source by Category",
    sub: "Vinjari makundi yote",
  },
  { to: "/rfq" as const, icon: FileText, title: "Omba Nukuu ya Bei", sub: "RFQ ya jumla" },
  {
    to: "/category/$slug" as const,
    params: { slug: "feeds-supplements" },
    icon: Wheat,
    title: "Chakula na Dawa",
    sub: "Virutubisho bora",
  },
];

function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="flex items-center justify-between px-3 pb-2 pt-3">
      <h2 className="text-[15px] font-extrabold tracking-tight">{title}</h2>
      {to ? (
        <Link to={to} className="flex items-center text-[11px] font-medium text-muted-foreground">
          Zaidi <ChevronRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}

function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ["feed", search, category],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(PUBLIC_PRODUCT_COLUMNS)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (category !== "all") q = q.eq("category_slug", category);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: verifiedIds } = useQuery({
    queryKey: ["verified-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id").eq("verified", true);
      if (error) return [] as string[];
      return data.map((r) => r.id);
    },
  });

  const list: CardProduct[] = useMemo(
    () =>
      (products ?? []).map((p) => ({
        ...p,
        verified: (verifiedIds ?? []).includes(p.seller_id),
      })),
    [products, verifiedIds],
  );

  const deals = list.slice(0, 10);
  const arrivals = list.slice(0, 9);
  const rest = list.slice(9);

  const empty = !isLoading && list.length === 0;

  return (
    <MobileShell>
      <div className="brand-surface safe-top px-3 pb-5 pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm font-extrabold tracking-tight">
            <Rabbit className="h-5 w-5" /> Ndauka Farm
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell onBrand />
            <CartButton />
          </div>
        </div>

        <div className="pt-3">
          <TopTabs active="/" />
        </div>

        <AnimatedSearchBar value={search} onChange={setSearch} className="mt-3" />
      </div>

      <div className="-mt-3 rounded-t-2xl bg-muted/40 pb-4">
        {/* Stories from sellers (active 24h) */}
        <StoriesBar />

        {/* Shortcut banners */}
        <div className="grid grid-cols-3 gap-2 px-3 pt-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.title}
              to={s.to}
              params={"params" in s ? (s.params as never) : undefined}
              className="flex flex-col items-start gap-1 rounded-xl bg-card p-2 shadow-sm"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-bold leading-tight">{s.title}</span>
              <span className="text-[9px] leading-tight text-muted-foreground">{s.sub}</span>
            </Link>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto px-3 pt-3 [scrollbar-width:none]">
          {[{ slug: "all", name: "Zote" }, ...CATEGORIES].map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                category === c.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 px-3 pt-4">
            <Skeleton className="aspect-[3/4] rounded-lg" />
            <Skeleton className="aspect-[3/4] rounded-lg" />
            <Skeleton className="aspect-[3/4] rounded-lg" />
          </div>
        ) : empty ? (
          <EmptyState
            icon={PackageOpen}
            title="Hakuna bidhaa zilizowekwa bado."
            description="Kuwa wa kwanza kuweka mifugo, mabanda au chakula cha mifugo kwenye soko."
            action={
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/post">Weka Bidhaa</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Top deals */}
            <SectionHeader title="Top Deals" />
            <div className="flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
              {deals.map((p) => (
                <DealCard key={p.id} product={p} />
              ))}
            </div>

            {/* New arrivals */}
            <SectionHeader title="New Arrivals" to="/categories" />
            <div className="grid grid-cols-3 gap-2 px-3">
              {arrivals.map((p) => (
                <ProductTile key={p.id} product={p} tall />
              ))}
            </div>

            {/* You may be looking for */}
            <SectionHeader title="You May Be Looking For" />
            <div className="flex gap-2 px-3">
              <div className="flex w-[72px] shrink-0 flex-col gap-2.5">
                {CATEGORIES.map((c) => {
                  const Icon = CATEGORY_ICONS[c.slug];
                  return (
                    <Link
                      key={c.slug}
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="line-clamp-2 text-center text-[9px] leading-tight text-muted-foreground">
                        {c.sw}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="grid flex-1 grid-cols-2 gap-2">
                {(rest.length ? rest : list).map((p) => (
                  <ProductMiniCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </MobileShell>
  );
}
