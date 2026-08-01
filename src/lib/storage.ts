import { supabase } from "@/integrations/supabase/client";

/** Avatars live in a private bucket, so the UI needs a short-lived signed URL. */
export async function signedUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}