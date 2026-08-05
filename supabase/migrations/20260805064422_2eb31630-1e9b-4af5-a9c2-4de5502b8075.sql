-- Restore table-level SELECT grants so signed-out visitors get empty results
-- instead of hard permission errors; row access is still blocked by RLS
-- (all SELECT policies on these tables are restricted TO authenticated).
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.stories TO anon;
GRANT SELECT ON public.video_comments TO anon;
GRANT SELECT ON public.video_likes TO anon;