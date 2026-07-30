import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, ImageOff } from "lucide-react";
import { categoryName, formatTZS, resolveMediaUrls } from "@/lib/marketplace";
import type { PublicProduct } from "@/lib/marketplace";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: PublicProduct }) {
  const [cover, setCover] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const first = product.media_urls?.[0];
    if (!first) return;
    resolveMediaUrls([first]).then((urls) => {
      if (active) setCover(urls[0] ?? null);
    });
    return () => {
      active = false;
    };
  }, [product.media_urls]);

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="surface-card flex gap-3 overflow-hidden p-2.5 transition-transform active:scale-[0.99]"
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
        {cover ? (
          <img src={cover} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ImageOff className="h-6 w-6" />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.title}</h3>
        </div>
        <Badge variant="secondary" className="mt-1.5 text-[10px] font-medium">
          {categoryName(product.category_slug)}
        </Badge>
        <p className="mt-1.5 text-base font-bold text-primary">{formatTZS(product.price_tzs)}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {[product.city, product.region].filter(Boolean).join(", ") || "Location not set"}
          </span>
        </p>
      </div>
    </Link>
  );
}