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
  Megaphone,
  CreditCard,
  BookOpen,
} from "lucide-react";
import { MobileShell, CartButton, NotificationBell, TopTabs } from "@/components/MobileShell";
import { AnimatedSearchBar } from "@/components/AnimatedSearchBar";
import { AiAssistantSheet, AiModeButton } from "@/components/AiAssistant";
import { StoriesBar } from "@/components/StoriesBar";
import { EmptyState } from "@/components/EmptyState";
import { DealCard, ProductTile, ProductMiniCard } from "@/components/CompactProductCard";
import type { CardProduct } from "@/components/CompactProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, PUBLIC_PRODUCT_COLUMNS } from "@/lib/marketplace";
import { TRBA } from "@/lib/trba";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/trba-rabbits.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRBA — Tanzania Rabbit Breeders Association" },
      {
        name: "description",
        content:
          "Jukwaa rasmi la Chama cha Wafugaji Sungura Tanzania: uanachama, daftari la nasaba, nyaraka za chama na soko la wafugaji. Connecting breeders, improving breeds, creating opportunities.",
      },
      { property: "og:title", content: "TRBA — Tanzania Rabbit Breeders Association" },
      {
        property: "og:description",
        content: "Connecting breeders, improving breeds, creating opportunities.",
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
  const [aiOpen, setAiOpen] = useState(false);

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

  const { data: announcements } = useQuery({
    queryKey: ["trba-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trba_announcements")
        .select("id, title, body, kind, meeting_at, location, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return [];
      return data;
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
            <Rabbit className="h-5 w-5" /> TRBA
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell onBrand />
            <CartButton />
          </div>
        </div>

        <div className="pt-3">
          <TopTabs active="/" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <AnimatedSearchBar value={search} onChange={setSearch} className="flex-1" />
          <AiModeButton onClick={() => setAiOpen(true)} />
        </div>
      </div>

      {aiOpen ? <AiAssistantSheet onClose={() => setAiOpen(false)} /> : null}

      <div className="-mt-3 rounded-t-2xl bg-muted/40 pb-4">
        {/* Association hero */}
        <section className="px-3 pt-3">
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
            <div className="relative">
              <img
                src={heroImg}
                alt="Sungura wa kuzaliana wa TRBA"
                className="h-36 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-[13px] font-extrabold leading-tight">
                  Tanzania Rabbit Breeders Association
                </p>
                <p className="pt-0.5 text-[10px] italic leading-tight opacity-90">
                  {TRBA.slogan}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2.5">
              <Link
                to="/membership"
                className="flex flex-col items-center gap-1 rounded-xl bg-primary px-2 py-2.5 text-primary-foreground"
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-[10px] font-bold leading-tight">Jiunge na Chama</span>
              </Link>
              <Link
                to="/registry"
                className="flex flex-col items-center gap-1 rounded-xl bg-accent px-2 py-2.5 text-accent-foreground"
              >
                <Rabbit className="h-4 w-4" />
                <span className="text-[10px] font-bold leading-tight">Daftari la Nasaba</span>
              </Link>
              <Link
                to="/documents"
                className="flex flex-col items-center gap-1 rounded-xl bg-accent px-2 py-2.5 text-accent-foreground"
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-[10px] font-bold leading-tight">Nyaraka za Chama</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Association announcements & meetings */}
        {announcements && announcements.length > 0 ? (
          <section className="px-3 pt-3">
            <div className="surface-card space-y-2.5 p-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-extrabold">
                <Megaphone className="h-4 w-4 text-gold" /> Matangazo ya Chama
              </p>
              {announcements.map((a) => (
                <div key={a.id} className="border-t border-border/60 pt-2 first:border-t-0 first:pt-0">
                  <p className="text-xs font-bold leading-snug">{a.title}</p>
                  <p className="line-clamp-2 pt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {a.body}
                  </p>
                  {a.kind === "meeting" && a.meeting_at ? (
                    <p className="pt-0.5 text-[10px] font-semibold text-primary">
                      Mkutano: {new Date(a.meeting_at).toLocaleString("sw-TZ")}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

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
