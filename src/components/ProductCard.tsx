import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { categoryName, formatTZS } from "@/lib/marketplace";
import type { PublicProduct } from "@/lib/marketplace";
import { Cover, useCover } from "@/components/CompactProductCard";
import { Badge } from "@/components/ui/badge";
import { SocialCounts } from "@/components/SocialCounts";
import { useProductCounts } from "@/lib/social";

export function ProductCard({ product }: { product: PublicProduct }) {
  const cover = useCover(product.media_urls);
  const counts = useProductCounts()(product.id);

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="surface-card flex gap-3 overflow-hidden p-2.5 transition-transform active:scale-[0.99]"
    >
      <Cover src={cover} alt={product.title} className="h-24 w-24 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.title}</h3>
        </div>
        <Badge variant="secondary" className="mt-1.5 text-[10px] font-medium">
          {categoryName(product.category_slug)}
        </Badge>
        <p className="mt-1.5 text-base font-bold text-primary">{formatTZS(product.price_tzs)}</p>
        <SocialCounts likes={counts.likes} comments={counts.comments} className="mt-1" />
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