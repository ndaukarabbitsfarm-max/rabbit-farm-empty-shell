import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Inbox, Check, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTZS, categoryName } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Review — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Review and approve seller profiles and submitted marketplace listings.",
      },
      { property: "og:title", content: "Admin Review — Ndauka Rabbits Farm Marketplace" },
      { property: "og:description", content: "Approve seller profiles and submitted listings." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();

  const { data: pendingProducts } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingSellers } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "seller")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setProductStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("products").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing updated");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveSeller = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").update({ approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Seller approved");
      qc.invalidateQueries({ queryKey: ["admin-sellers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <MobileShell title="Admin Review"><div className="px-4 pt-6" /></MobileShell>;

  if (!isAdmin) {
    return (
      <MobileShell title="Admin Review">
        <EmptyState
          icon={ShieldAlert}
          title="Admins only"
          description="This area is restricted to marketplace administrators."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/">Back to marketplace</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Admin Review" subtitle="Approve sellers and listings">
      <Tabs defaultValue="listings" className="px-4 pt-4">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="listings" className="rounded-lg">
            Listings
          </TabsTrigger>
          <TabsTrigger value="sellers" className="rounded-lg">
            Sellers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-3 pt-4">
          {pendingProducts && pendingProducts.length > 0 ? (
            pendingProducts.map((p) => (
              <div key={p.id} className="surface-card p-3.5">
                <Badge variant="secondary" className="text-[10px]">
                  {categoryName(p.category_slug)}
                </Badge>
                <h3 className="pt-1.5 text-sm font-semibold">{p.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatTZS(p.price_tzs)} · {[p.city, p.region].filter(Boolean).join(", ") || "—"}
                </p>
                <div className="flex gap-2 pt-3">
                  <Button
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={() => setProductStatus.mutate({ id: p.id, status: "approved" })}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => setProductStatus.mutate({ id: p.id, status: "rejected" })}
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={Inbox} title="No listings awaiting review" />
          )}
        </TabsContent>

        <TabsContent value="sellers" className="space-y-3 pt-4">
          {pendingSellers && pendingSellers.length > 0 ? (
            pendingSellers.map((s) => (
              <div key={s.id} className="surface-card flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.full_name || "Unnamed seller"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.phone || "No phone"} · {[s.city, s.region].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <Button size="sm" className="rounded-lg" onClick={() => approveSeller.mutate(s.id)}>
                  Approve
                </Button>
              </div>
            ))
          ) : (
            <EmptyState icon={Inbox} title="No seller profiles awaiting approval" />
          )}
        </TabsContent>
      </Tabs>
    </MobileShell>
  );
}