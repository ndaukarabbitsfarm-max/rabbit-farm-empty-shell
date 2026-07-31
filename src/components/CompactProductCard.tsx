import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff, BadgeCheck, MapPin } from "lucide-react";
import { formatTZS, resolveMediaUrls } from "@/lib/marketplace";
import type { PublicProduct } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export function useCover(mediaUrls: string[] | null | undefined) {
  const [cover, setCover] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const first = mediaUrls?.[0];
    if (!first) return;
    resolveMediaUrls([first]).then((urls) => {
      if (active) setCover(urls[0] ?? null);
    });
    return () => {
      active = false;
    };
  }, [mediaUrls]);
  return cover;
}

function Cover({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-muted text-muted-foreground",
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <ImageOff className="h-5 w-5" />
      )}
    </div>
  );
}

export type CardProduct = PublicProduct & { verified?: boolean };

/** Tall 3-column tile used by the New Arrivals grid. */
export function ProductTile({ product, tall }: { product: CardProduct; tall?: boolean }) {
  const cover = useCover(product.media_urls);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="block overflow-hidden rounded-lg bg-card shadow-sm active:opacity-90"
    >
      <Cover src={cover} alt={product.title} className={tall ? "aspect-[3/4]" : "aspect-square"} />
      <div className="space-y-1 p-1.5">
        <p className="text-[13px] font-extrabold leading-tight text-foreground">
          {formatTZS(product.price_tzs)}
        </p>
        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {product.title}
        </p>
        <p className="text-[10px] text-muted-foreground">{product.moq ?? 1} piece (MOQ)</p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {product.verified ? (
            <BadgeCheck className="h-3 w-3 shrink-0 text-primary" aria-label="Verified" />
          ) : null}
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{product.region ?? "TZ"}</span>
        </div>
      </div>
    </Link>
  );
}

/** Narrow horizontally-scrolled deal card. */
export function DealCard({ product }: { product: CardProduct }) {
  const cover = useCover(product.media_urls);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="w-[122px] shrink-0 overflow-hidden rounded-lg bg-card shadow-sm active:opacity-90"
    >
      <Cover src={cover} alt={product.title} className="aspect-square" />
      <div className="space-y-0.5 p-1.5">
        <p className="text-[13px] font-extrabold leading-tight">{formatTZS(product.price_tzs)}</p>
        <p className="text-[9px] font-medium text-primary">Lower priced than similar</p>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">{product.title}</p>
        <p className="text-[10px] text-muted-foreground">{product.moq ?? 1} piece (MOQ)</p>
      </div>
    </Link>
  );
}

/** Wide 2-column card used beside the "You may be looking for" rail. */
export function ProductMiniCard({ product }: { product: CardProduct }) {
  const cover = useCover(product.media_urls);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="overflow-hidden rounded-lg bg-card shadow-sm active:opacity-90"
    >
      <Cover src={cover} alt={product.title} className="aspect-square" />
      <div className="space-y-0.5 p-1.5">
        <p className="text-[13px] font-extrabold leading-tight">{formatTZS(product.price_tzs)}</p>
        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {product.title}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {product.verified ? <BadgeCheck className="h-3 w-3 text-primary" /> : null}
          <span className="truncate">{product.region ?? "TZ"}</span>
        </div>
      </div>
    </Link>
  );
}
