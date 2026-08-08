import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff, BadgeCheck, MapPin, Play } from "lucide-react";
import { formatTZS, isVideoPath, mediaUrl } from "@/lib/marketplace";
import type { PublicProduct } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { SocialCounts } from "@/components/SocialCounts";
import { useProductCounts } from "@/lib/social";

export function useCover(mediaUrls: string[] | null | undefined) {
  const [cover, setCover] = useState<{ src: string; video: boolean } | null>(null);
  useEffect(() => {
    const first = mediaUrls?.[0];
    if (!first) {
      setCover(null);
      return;
    }
    setCover({ src: mediaUrl(first), video: isVideoPath(first) });
  }, [mediaUrls]);
  return cover;
}

export function Cover({
  src,
  alt,
  className,
}: {
  src: { src: string; video: boolean } | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-muted text-muted-foreground",
        className,
      )}
    >
      {src?.video ? (
        <>
          <video
            src={src.src}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <Play className="h-6 w-6 fill-background/70 text-background/90" />
          </span>
        </>
      ) : src ? (
        <img src={src.src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
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
  const counts = useProductCounts()(product.id);
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
        <SocialCounts likes={counts.likes} comments={counts.comments} />
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
  const counts = useProductCounts()(product.id);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="w-[122px] shrink-0 overflow-hidden rounded-lg bg-card shadow-sm active:opacity-90"
    >
      <Cover src={cover} alt={product.title} className="aspect-square" />
      <div className="space-y-0.5 p-1.5">
        <p className="text-[13px] font-extrabold leading-tight">{formatTZS(product.price_tzs)}</p>
        <SocialCounts likes={counts.likes} comments={counts.comments} />
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
  const counts = useProductCounts()(product.id);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="overflow-hidden rounded-lg bg-card shadow-sm active:opacity-90"
    >
      <Cover src={cover} alt={product.title} className="aspect-square" />
      <div className="space-y-0.5 p-1.5">
        <p className="text-[13px] font-extrabold leading-tight">{formatTZS(product.price_tzs)}</p>
        <SocialCounts likes={counts.likes} comments={counts.comments} />
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
