import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus, LogIn, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatTZS } from "@/lib/marketplace";

export const Route = createFileRoute("/my-listings")({
  head: () => ({
    meta: [
      { title: "My Listings — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Manage the rabbit, cage, feed and equipment listings you have posted for sale.",
      },
      { property: "og:title", content: "My Listings — Ndauka Rabbits Farm Marketplace" },
      { property: "og:description", content: "Manage the listings you have posted for sale." },
    ],
  }),
  component: MyListingsPage,
});

function MyListingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    enabled: Boolean(user),
    queryKey: ["my-listings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function deleteListing(id: string) {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing deleted");
    await queryClient.invalidateQueries({ queryKey: ["my-listings", user?.id] });
  }

  if (!user) {
    return (
      <MobileShell title="My Listings">
        <EmptyState
          icon={LogIn}
          title="Sign in to manage your listings"
          action={
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/auth">Log in / Sign up</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="My Listings" subtitle="Bidhaa zako">
      <ErrorBoundary label="my-listings">
      <div className="space-y-3 px-4 pt-4">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : data && data.length > 0 ? (
          data.map((p) => (
            <div key={p.id} className="space-y-1.5">
              <ProductCard product={p} />
              <div className="flex items-center justify-between gap-2 px-1">
                <Badge
                  variant={p.status === "approved" ? "default" : "secondary"}
                  className="text-[10px] capitalize"
                >
                  {p.status}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Stock {p.quantity} · {formatTZS(p.price_tzs)}
                  </span>
                  <Button asChild variant="outline" size="sm" className="h-8 rounded-lg px-2.5">
                    <Link to="/listing/$id/edit" params={{ id: p.id }}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg px-2.5 text-destructive"
                    onClick={() => deleteListing(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete listing</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={PackagePlus}
            title="You have no listings yet"
            description="Bidhaa zako zitaonekana hapa mara tu utakapoweka ya kwanza."
            action={
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/post">Post Item</Link>
              </Button>
            }
          />
        )}
      </div>
      </ErrorBoundary>
    </MobileShell>
  );
}
