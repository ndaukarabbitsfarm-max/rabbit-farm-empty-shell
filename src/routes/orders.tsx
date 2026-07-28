import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, LogIn } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTZS } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Track rabbit and supply orders you have requested or received, with TZS totals.",
      },
      { property: "og:title", content: "My Orders — Ndauka Rabbits Farm Marketplace" },
      { property: "og:description", content: "Track orders you have requested or received." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    enabled: Boolean(user),
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!user) {
    return (
      <MobileShell title="My Orders">
        <EmptyState
          icon={LogIn}
          title="Sign in to see your orders"
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
    <MobileShell title="My Orders" subtitle="Maagizo yako">
      <div className="space-y-3 px-4 pt-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : data && data.length > 0 ? (
          data.map((o) => (
            <div key={o.id} className="surface-card p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  {(o.products as { title: string } | null)?.title ?? "Listing"}
                </h3>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {o.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Qty {o.quantity} · Transport {formatTZS(o.transport_cost_tzs)}
              </p>
              <p className="pt-1 text-base font-bold text-primary">{formatTZS(o.total_tzs)}</p>
            </div>
          ))
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="Hakuna maagizo bado. Maagizo yako yataonekana hapa."
            action={
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/">Browse marketplace</Link>
              </Button>
            }
          />
        )}
      </div>
    </MobileShell>
  );
}