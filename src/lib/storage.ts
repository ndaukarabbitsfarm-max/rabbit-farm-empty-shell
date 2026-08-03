import { supabase } from "@/integrations/supabase/client";

/** Buckets served straight from the CDN — no signing needed, so media never fails to load. */
const PUBLIC_BUCKETS = new Set(["listings", "avatars"]);

/**
 * Storage keys only accept a safe subset of characters — phone galleries often
 * produce names with spaces or non-latin characters, which made uploads fail.
 */
export function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

/**
 * Returns a displayable URL for a stored object. Public buckets use the CDN URL,
 * private buckets (KYC documents) fall back to a short-lived signed URL.
 */
export async function signedUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  if (PUBLIC_BUCKETS.has(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl ?? null;
  }
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}