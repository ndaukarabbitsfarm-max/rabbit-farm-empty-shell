import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ClipboardList, X } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/admin_/orders")({
  head: () => ({
    meta: [
      { title: "Admin orders — Ndauka Farm" },
      {
        name: "description",
        content: "Admin dashboard listing every order on the marketplace with buyer, seller and totals.",
      },
      { property: "og:title", content: "Admin orders — Ndauka Farm" },
      { property: "og:description", content: "All marketplace orders with filters and totals." },
    ],
  }),
  component: AdminOrdersPage,
});

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  quantity: number;
  total_tzs: number;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  shipping_address: string | null;
  delivery_region: string | null;
  delivery_city: string | null;
};

const STATUSES = ["all", "pending", "accepted", "rejected", "completed", "cancelled"];

function AdminOrdersPage() {
  const { isAdmin, loading } = useAuth();
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<OrderRow | null>(null);

  const { data, isLoading } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "id, created_at, status, quantity, total_tzs, buyer_id, seller_id, product_id, buyer_name, buyer_phone, shipping_address, delivery_region, delivery_city",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (orders ?? []) as OrderRow[];
      const userIds = Array.from(new Set(rows.flatMap((o) => [o.buyer_id, o.seller_id])));
      const productIds = Array.from(
        new Set(rows.map((o) => o.product_id).filter((v): v is string => Boolean(v))),
      );
      const [{ data: profiles }, { data: products }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("id, full_name, phone").in("id", userIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null; phone: string | null }[] }),
        productIds.length
          ? supabase.from("products").select("id, title").in("id", productIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);
      return rows.map((o) => ({
        ...o,
        buyer: profiles?.find((p) => p.id === o.buyer_id)?.full_name ?? o.buyer_name ?? "Mnunuzi",
        buyerPhone: profiles?.find((p) => p.id === o.buyer_id)?.phone ?? o.buyer_phone ?? null,
        seller: profiles?.find((p) => p.id === o.seller_id)?.full_name ?? "Muuzaji",
        product: products?.find((p) => p.id === o.product_id)?.title ?? "Bidhaa nyingi",
      }));
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (from && new Date(o.created_at) < new Date(from)) return false;
      if (q && ![o.buyer, o.seller, o.product].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data, status, from, search]);

  const totals = useMemo(
    () => ({
      count: filtered.length,
      value: filtered.reduce((n, o) => n + Number(o.total_tzs ?? 0), 0),
    }),
    [filtered],
  );

  if (loading) {
    return (
      <MobileShell title="Admin orders">
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  if (!isAdmin) {
    return (
      <MobileShell title="Admin orders">
        <EmptyState
          icon={ShieldAlert}
          title="Huna ruhusa"
          description="Ukurasa huu ni wa wasimamizi pekee."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/">Rudi mwanzo</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Admin orders" subtitle="Maagizo yote ya soko">
      <div className="space-y-3 px-3 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="surface-card p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Maagizo</p>
            <p className="text-lg font-bold">{totals.count}</p>
          </div>
          <div className="surface-card p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Thamani jumla</p>
            <p className="text-lg font-bold text-primary">{formatTZS(totals.value)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 rounded-xl" aria-label="Chuja kwa hali">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "Hali zote" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Kuanzia tarehe"
            className="h-10 rounded-xl"
          />
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tafuta mnunuzi, muuzaji au bidhaa…"
          aria-label="Tafuta agizo"
          className="h-10 rounded-xl"
        />

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length ? (
          <ul className="space-y-2">
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setDetail(o as OrderRow)}
                  className="surface-card w-full p-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-semibold">{o.product}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {o.status}
                    </Badge>
                  </div>
                  <p className="pt-1 text-[11px] text-muted-foreground">
                    {o.buyer} → {o.seller} · x{o.quantity}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-bold text-primary">{formatTZS(o.total_tzs)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="Hakuna maagizo"
            description="Maagizo yatakayowekwa na watumiaji yataonekana hapa."
          />
        )}
      </div>

      {detail ? (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <button
            type="button"
            aria-label="Funga"
            onClick={() => setDetail(null)}
            className="flex-1 bg-black/40"
          />
          <div className="space-y-2 rounded-t-2xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Maelezo ya agizo</h2>
              <button type="button" onClick={() => setDetail(null)} aria-label="Funga">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {(
              [
                ["Hali", detail.status],
                ["Idadi", String(detail.quantity)],
                ["Jumla", formatTZS(detail.total_tzs)],
                ["Jina la mnunuzi", detail.buyer_name || "—"],
                ["Simu ya mnunuzi", detail.buyer_phone || "—"],
                ["Anwani", detail.shipping_address || "—"],
                [
                  "Eneo",
                  [detail.delivery_city, detail.delivery_region].filter(Boolean).join(", ") || "—",
                ],
                ["Tarehe", new Date(detail.created_at).toLocaleString()],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </MobileShell>
  );
}
