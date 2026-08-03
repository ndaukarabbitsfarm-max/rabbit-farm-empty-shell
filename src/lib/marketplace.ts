import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/**
 * Seller contact columns are not readable by signed-out visitors, so public
 * listing queries must select an explicit column list.
 */
export const PUBLIC_PRODUCT_COLUMNS =
  "id, seller_id, title, category_slug, breed, quantity, moq, price_tzs, description, region, city, media_urls, status, pedigree_verified, vaccination_records, created_at, updated_at" as const;

export type PublicProduct = Omit<Tables<"products">, "contact_phone" | "whatsapp">;

export const CATEGORIES = [
  { slug: "breeding-rabbits", name: "Breeding Rabbits", sw: "Sungura wa Kuzalisha" },
  { slug: "poultry", name: "Poultry", sw: "Kuku na Ndege" },
  { slug: "custom-cages", name: "Custom Cages", sw: "Vizimba Maalum" },
  { slug: "feeds-supplements", name: "Feeds & Supplements", sw: "Chakula na Virutubisho" },
  { slug: "equipment", name: "Equipment", sw: "Vifaa" },
] as const;

export function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function formatTZS(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `TZS ${n.toLocaleString("en-TZ", { maximumFractionDigits: 0 })}`;
}

/**
 * Media is stored as object paths in the public `listings` bucket. Full https
 * URLs (legacy rows) are passed through untouched so nothing renders broken.
 */
export function mediaUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
}

/** Resolves in order — the returned array always matches `paths` index-for-index. */
export async function resolveMediaUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  return paths.map(mediaUrl);
}

export function isVideoPath(path: string) {
  return /\.(mp4|mov|webm|m4v|avi)$/i.test(path);
}