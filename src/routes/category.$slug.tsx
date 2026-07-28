import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageOpen, ArrowLeft } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryName } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const name = categoryName(params.slug);
    return {
      meta: [
        { title: `${name} — Ndauka Rabbits Farm Marketplace` },
        {
          name: "description",
          content: `Listings in ${name} from Tanzanian rabbit farmers and suppliers, priced in TZS.`,
        },
        { property: "og:title", content: `${name} — Ndauka Rabbits Farm Marketplace` },
        { property: "og:description", content: `Listings in ${name} from Tanzanian suppliers.` },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = useParams({ from: "/category/$slug" });

  const { data, isLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "approved")
        .eq("category_slug", slug)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <MobileShell
      title={categoryName(slug)}
      right={
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/categories" aria-label="Back to categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-3 px-4 pt-4">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : data && data.length > 0 ? (
          data.map((p) => <ProductCard key={p.id} product={p} />)
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
    </MobileShell>
  );
}