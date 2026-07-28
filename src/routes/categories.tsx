import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Rabbit, Boxes, Wheat, Wrench } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { CATEGORIES } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";

const ICONS = {
  "breeding-rabbits": Rabbit,
  "custom-cages": Boxes,
  "feeds-supplements": Wheat,
  equipment: Wrench,
} as const;

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content:
          "Browse breeding rabbits, custom cages, feeds and supplements, and farm equipment categories.",
      },
      { property: "og:title", content: "Categories — Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content: "Browse rabbit, cage, feed and equipment categories on the marketplace.",
      },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: counts } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category_slug")
        .eq("status", "approved");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data) map[row.category_slug] = (map[row.category_slug] ?? 0) + 1;
      return map;
    },
  });

  return (
    <MobileShell title="Categories" subtitle="Chagua kundi la bidhaa">
      <ul className="space-y-2.5 px-4 pt-4">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c.slug];
          const count = counts?.[c.slug] ?? 0;
          return (
            <li key={c.slug}>
              <Link
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="surface-card flex items-center gap-3 p-3.5 transition-transform active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {c.sw} · {count} {count === 1 ? "listing" : "listings"}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </MobileShell>
  );
}