import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = [
  { slug: "breeding-rabbits", name: "Breeding Rabbits", sw: "Sungura wa Kuzalisha" },
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

/** Media is stored as object paths in the private `listings` bucket. */
export async function resolveMediaUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { data } = await supabase.storage.from("listings").createSignedUrls(paths, 3600);
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean);
}

export function isVideoPath(path: string) {
  return /\.(mp4|mov|webm|m4v|avi)$/i.test(path);
}