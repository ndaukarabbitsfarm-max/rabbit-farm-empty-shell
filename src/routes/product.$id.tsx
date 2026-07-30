import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ImageOff, MapPin, Phone, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  categoryName,
  formatTZS,
  isVideoPath,
  resolveMediaUrls,
  PUBLIC_PRODUCT_COLUMNS,
} from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Listing details — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content:
          "View breed specs, price in TZS and seller location, then call, chat on WhatsApp or request an order.",
      },
      { property: "og:title", content: "Listing details — Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content: "View breed specs, price in TZS and seller location for this listing.",
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = useParams({ from: "/product/$id" });
  const { user } = useAuth();
  const [media, setMedia] = useState<{ url: string; path: string }[]>([]);
  const [qty, setQty] = useState("1");
  const [distanceKm, setDistanceKm] = useState("");
  const [ratePerKm, setRatePerKm] = useState("");
  const [deliveryRegion, setDeliveryRegion] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PUBLIC_PRODUCT_COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Seller phone/WhatsApp are readable only by signed-in users.
  const { data: contact } = useQuery({
    enabled: Boolean(user && id),
    queryKey: ["product-contact", id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("contact_phone, whatsapp")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!product?.media_urls?.length) return;
    let active = true;
    resolveMediaUrls(product.media_urls).then((urls) => {
      if (active)
        setMedia(urls.map((url, i) => ({ url, path: product.media_urls[i] ?? "" })));
    });
    return () => {
      active = false;
    };
  }, [product?.media_urls]);

  const transportCost = (Number(distanceKm) || 0) * (Number(ratePerKm) || 0);
  const subtotal = (Number(qty) || 0) * Number(product?.price_tzs ?? 0);
  const total = subtotal + transportCost;

  async function requestOrder() {
    if (!product) return;
    if (!user) {
      toast.error("Please log in to request an order");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("orders").insert({
        buyer_id: user.id,
        seller_id: product.seller_id,
        product_id: product.id,
        quantity: Number(qty) || 1,
        unit_price_tzs: Number(product.price_tzs),
        transport_cost_tzs: transportCost,
        total_tzs: total,
        delivery_region: deliveryRegion || null,
        delivery_city: deliveryCity || null,
      });
      if (error) throw error;
      toast.success("Order request sent to the seller");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send order request");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <MobileShell title="Listing">
        <div className="space-y-3 px-4 pt-4">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </MobileShell>
    );
  }

  if (!product) {
    return (
      <MobileShell title="Listing">
        <EmptyState
          icon={ImageOff}
          title="Listing not available"
          description="This listing may have been removed or is awaiting approval."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/">Back to marketplace</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  const contactPhone = contact?.contact_phone ?? null;
  const waNumber = (contact?.whatsapp || contactPhone || "").replace(/[^\d]/g, "");

  return (
    <MobileShell
      title={product.title}
      right={
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/" aria-label="Back to marketplace">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-4 px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto rounded-2xl [scrollbar-width:none]">
          {media.length > 0 ? (
            media.map((m) =>
              isVideoPath(m.path) ? (
                <video key={m.url} src={m.url} controls className="h-52 w-full shrink-0 rounded-2xl object-cover" />
              ) : (
                <img
                  key={m.url}
                  src={m.url}
                  alt={product.title}
                  className="h-52 w-full shrink-0 rounded-2xl object-cover"
                />
              ),
            )
          ) : (
            <div className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted text-muted-foreground">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs">No media uploaded</span>
            </div>
          )}
        </div>

        <div className="surface-card p-4">
          <Badge variant="secondary" className="text-[10px]">
            {categoryName(product.category_slug)}
          </Badge>
          <h2 className="pt-2 text-lg font-semibold leading-snug">{product.title}</h2>
          <p className="pt-1 text-xl font-bold text-primary">{formatTZS(product.price_tzs)}</p>
          <dl className="grid grid-cols-2 gap-3 pt-3 text-xs">
            <Spec label="Breed" value={product.breed || "—"} />
            <Spec label="Quantity available" value={String(product.quantity)} />
          </dl>
          <p className="flex items-center gap-1.5 pt-3 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {[product.city, product.region].filter(Boolean).join(", ") || "Location not set"}
          </p>
          {product.description ? (
            <p className="whitespace-pre-line pt-3 text-sm leading-relaxed text-foreground/80">
              {product.description}
            </p>
          ) : null}
        </div>

        {user ? (
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-11 rounded-xl" disabled={!contactPhone}>
              <a href={contactPhone ? `tel:${contactPhone}` : "#"}>
                <Phone className="mr-1.5 h-4 w-4" /> Call Seller
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl" disabled={!waNumber}>
              <a
                href={waNumber ? `https://wa.me/${waNumber}` : "#"}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          </div>
        ) : (
          <div className="surface-card flex items-center justify-between gap-3 p-3.5">
            <p className="text-xs text-muted-foreground">
              Ingia ili uone namba ya muuzaji — sign in to see seller contact details.
            </p>
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        )}

        <div className="surface-card space-y-3 p-4">
          <h3 className="text-sm font-semibold">Shipping & transport estimator</h3>
          <div className="grid grid-cols-2 gap-3">
            <Num id="qty" label="Quantity" value={qty} onChange={setQty} />
            <Num id="distance" label="Distance (km)" value={distanceKm} onChange={setDistanceKm} />
            <Num id="rate" label="Rate per km (TZS)" value={ratePerKm} onChange={setRatePerKm} />
            <div className="space-y-1.5">
              <Label htmlFor="dregion">Delivery region</Label>
              <Input
                id="dregion"
                value={deliveryRegion}
                onChange={(e) => setDeliveryRegion(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dcity">Delivery city / ward</Label>
            <Input
              id="dcity"
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <dl className="space-y-1 rounded-xl bg-muted p-3 text-xs">
            <Row label="Items subtotal" value={formatTZS(subtotal)} />
            <Row label="Estimated transport" value={formatTZS(transportCost)} />
            <Row label="Total" value={formatTZS(total)} strong />
          </dl>
          <Button onClick={requestOrder} className="h-12 w-full rounded-xl" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Order"}
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="pt-0.5 text-sm font-medium">{value}</dd>
    </div>
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

function Num({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl"
      />
    </div>
  );
}