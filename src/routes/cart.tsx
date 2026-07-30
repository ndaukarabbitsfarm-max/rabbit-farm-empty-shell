import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatTZS } from "@/lib/marketplace";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart & Checkout — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content:
          "Review your rabbits, cages and feed items, see itemized TZS totals and submit your order with delivery details.",
      },
      { property: "og:title", content: "Cart & Checkout — Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content: "Review itemized TZS totals and submit your order with delivery details.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQuantity, remove, clear } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [transport, setTransport] = useState("");

  const transportCost = Number(transport) || 0;
  const total = subtotal + transportCost;

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to place your order");
      return;
    }
    if (!items.length) return;
    setSubmitting(true);
    try {
      const sellers = Array.from(new Set(items.map((i) => i.sellerId)));
      for (const sellerId of sellers) {
        const sellerItems = items.filter((i) => i.sellerId === sellerId);
        const sellerSubtotal = sellerItems.reduce((n, i) => n + i.quantity * i.priceTzs, 0);
        const share = subtotal > 0 ? (sellerSubtotal / subtotal) * transportCost : 0;
        const first = sellerItems[0];

        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            buyer_id: user.id,
            seller_id: sellerId,
            product_id: sellerItems.length === 1 ? first.productId : null,
            quantity: sellerItems.reduce((n, i) => n + i.quantity, 0),
            unit_price_tzs: first.priceTzs,
            transport_cost_tzs: Math.round(share),
            total_tzs: Math.round(sellerSubtotal + share),
            delivery_region: region || null,
            delivery_city: city || null,
            buyer_name: buyerName || profile?.full_name || null,
            buyer_phone: phone || profile?.phone || null,
            shipping_address: address || null,
          })
          .select("id")
          .single();
        if (error) throw error;

        const { error: itemsError } = await supabase.from("order_items").insert(
          sellerItems.map((i) => ({
            order_id: order.id,
            product_id: i.productId,
            quantity: i.quantity,
            price_per_unit_tzs: i.priceTzs,
          })),
        );
        if (itemsError) throw itemsError;
      }

      clear();
      toast.success("Order submitted to the seller");
      navigate({ to: "/orders" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return (
      <MobileShell title="Cart" subtitle="Kikapu chako">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Ongeza bidhaa kutoka sokoni ili uanze kuagiza."
          action={
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/">Browse marketplace</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Cart" subtitle="Kikapu chako">
      <div className="space-y-4 px-4 pt-4">
        <ul className="space-y-2.5">
          {items.map((i) => (
            <li key={i.productId} className="surface-card p-3.5">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to="/product/$id"
                  params={{ id: i.productId }}
                  className="line-clamp-2 text-sm font-semibold leading-snug"
                >
                  {i.title}
                </Link>
                <button
                  type="button"
                  aria-label={`Remove ${i.title}`}
                  onClick={() => remove(i.productId)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(i.productId, i.quantity - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(i.productId, i.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-base font-bold text-primary">
                  {formatTZS(i.quantity * i.priceTzs)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={checkout} className="surface-card space-y-3 p-4">
          <h2 className="text-sm font-semibold">Delivery details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="buyer-name">Full name</Label>
            <Input
              id="buyer-name"
              required
              value={buyerName || profile?.full_name || ""}
              onChange={(e) => setBuyerName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="buyer-phone">Contact phone</Label>
            <Input
              id="buyer-phone"
              type="tel"
              required
              placeholder="+255…"
              value={phone || profile?.phone || ""}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Shipping address</Label>
            <Textarea
              id="address"
              rows={3}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, landmark, delivery notes…"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City / Ward</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transport">Transport estimate (TZS)</Label>
            <Input
              id="transport"
              type="number"
              min="0"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <dl className="space-y-1 rounded-xl bg-muted p-3 text-xs">
            <Row label="Items subtotal" value={formatTZS(subtotal)} />
            <Row label="Transport" value={formatTZS(transportCost)} />
            <Row label="Total" value={formatTZS(total)} strong />
          </dl>

          {user ? (
            <Button type="submit" className="h-12 w-full rounded-xl" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit order"}
            </Button>
          ) : (
            <Button asChild className="h-12 w-full rounded-xl">
              <Link to="/auth">Sign in to checkout</Link>
            </Button>
          )}
        </form>
      </div>
    </MobileShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "text-sm font-bold text-primary" : "font-medium"}>{value}</dd>
    </div>
  );
}