import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackagePlus, LogIn } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
      <div className="space-y-3 px-4 pt-4">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : data && data.length > 0 ? (
          data.map((p) => (
            <div key={p.id} className="space-y-1">
              <ProductCard product={p} />
              <div className="px-1">
                <Badge
                  variant={p.status === "approved" ? "default" : "secondary"}
                  className="text-[10px] capitalize"
                >
                  {p.status}
                </Badge>
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
    </MobileShell>
  );
}