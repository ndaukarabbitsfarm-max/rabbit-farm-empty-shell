import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, LogIn, MapPin, Phone, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTZS } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Enums } from "@/integrations/supabase/types";

const STATUSES: Enums<"order_status">[] = [
  "requested",
  "accepted",
  "in_transit",
  "completed",
  "cancelled",
];

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content:
          "Track orders you placed and incoming orders for your listings, with buyer contact, delivery address and TZS totals.",
      },
      { property: "og:title", content: "Orders — Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content: "Track your purchases and incoming seller orders with TZS totals.",
      },
    ],
  }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  quantity: number;
  total_tzs: number;
  transport_cost_tzs: number;
  status: Enums<"order_status">;
  created_at: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  shipping_address: string | null;
  delivery_region: string | null;
  delivery_city: string | null;
  products: { title: string } | null;
  order_items: { id: string; quantity: number; price_per_unit_tzs: number; products: { title: string } | null }[];
};

function OrdersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("buying");

  const { data, isLoading } = useQuery({
    enabled: Boolean(user),
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, products(title), order_items(id, quantity, price_per_unit_tzs, products(title))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  const { data: buyers } = useQuery({
    enabled: Boolean(user && data?.some((o) => o.seller_id === user.id)),
    queryKey: ["order-buyers", user?.id, data?.length],
    queryFn: async () => {
      const ids = Array.from(
        new Set((data ?? []).filter((o) => o.seller_id === user!.id).map((o) => o.buyer_id)),
      );
      if (!ids.length) return {};
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, whatsapp, region, city")
        .in("id", ids);
      if (error) throw error;
      const map: Record<string, (typeof profiles)[number]> = {};
      for (const p of profiles ?? []) map[p.id] = p;
      return map;
    },
  });

  async function updateStatus(orderId: string, status: Enums<"order_status">) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order updated");
    await queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
  }

  if (!user) {
    return (
      <MobileShell title="Orders">
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

  const buying = (data ?? []).filter((o) => o.buyer_id === user.id);
  const selling = (data ?? []).filter((o) => o.seller_id === user.id);

  return (
    <MobileShell title="Orders" subtitle="Maagizo yako">
      <div className="px-4 pt-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="buying" className="rounded-lg">
              Buying ({buying.length})
            </TabsTrigger>
            <TabsTrigger value="selling" className="rounded-lg">
              Selling ({selling.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buying" className="space-y-3 pt-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : buying.length ? (
              buying.map((o) => <OrderCard key={o.id} order={o} />)
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
          </TabsContent>

          <TabsContent value="selling" className="space-y-3 pt-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : selling.length ? (
              selling.map((o) => {
                const buyer = buyers?.[o.buyer_id];
                return (
                  <OrderCard
                    key={o.id}
                    order={o}
                    buyer={{
                      name: o.buyer_name ?? buyer?.full_name ?? null,
                      phone: o.buyer_phone ?? buyer?.phone ?? null,
                    }}
                    onStatusChange={(s) => updateStatus(o.id, s)}
                  />
                );
              })
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No incoming orders yet"
                description="Maagizo ya wanunuzi kwa bidhaa zako yataonekana hapa."
                action={
                  <Button asChild size="lg" className="rounded-xl">
                    <Link to="/post">Post an item</Link>
                  </Button>
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileShell>
  );
}

function OrderCard({
  order,
  buyer,
  onStatusChange,
}: {
  order: OrderRow;
  buyer?: { name: string | null; phone: string | null };
  onStatusChange?: (status: Enums<"order_status">) => void;
}) {
  const items = order.order_items ?? [];
  const location = [order.delivery_city, order.delivery_region].filter(Boolean).join(", ");

  return (
    <div className="surface-card p-3.5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {order.products?.title ??
            (items.length ? `${items.length} items` : "Order")}
        </h3>
        <Badge variant="secondary" className="text-[10px] capitalize">
          {order.status.replace("_", " ")}
        </Badge>
      </div>

      {items.length ? (
        <ul className="space-y-0.5 pt-2 text-xs text-muted-foreground">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between gap-2">
              <span className="truncate">
                {it.products?.title ?? "Item"} × {it.quantity}
              </span>
              <span>{formatTZS(it.quantity * Number(it.price_per_unit_tzs))}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pt-1 text-xs text-muted-foreground">Qty {order.quantity}</p>
      )}

      <p className="pt-1 text-xs text-muted-foreground">
        Transport {formatTZS(order.transport_cost_tzs)}
      </p>
      <p className="pt-1 text-base font-bold text-primary">{formatTZS(order.total_tzs)}</p>

      {buyer ? (
        <div className="mt-3 space-y-1 rounded-xl bg-muted p-3 text-xs">
          <p className="flex items-center gap-1.5 font-medium">
            <UserIcon className="h-3.5 w-3.5" /> {buyer.name ?? "Buyer"}
          </p>
          {buyer.phone ? (
            <a href={`tel:${buyer.phone}`} className="flex items-center gap-1.5 text-primary">
              <Phone className="h-3.5 w-3.5" /> {buyer.phone}
            </a>
          ) : (
            <p className="text-muted-foreground">No phone provided</p>
          )}
          <p className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{order.shipping_address || location || "No address provided"}</span>
          </p>
        </div>
      ) : null}

      {onStatusChange ? (
        <div className="pt-3">
          <Select value={order.status} onValueChange={(v) => onStatusChange(v as Enums<"order_status">)}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}