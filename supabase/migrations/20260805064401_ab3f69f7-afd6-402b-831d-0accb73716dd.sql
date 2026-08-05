-- 1. Security definer -> invoker for client-callable functions
CREATE OR REPLACE FUNCTION public.record_page_view(_path text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  INSERT INTO public.page_views (path, user_id) VALUES (left(_path, 300), auth.uid());
$$;

GRANT INSERT ON public.page_views TO anon, authenticated;
DROP POLICY IF EXISTS "anyone can record a page view" ON public.page_views;
CREATE POLICY "anyone can record a page view"
ON public.page_views FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NOT DISTINCT FROM auth.uid());

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS TABLE(total_views bigint, total_users bigint, total_products bigint)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.page_views),
    (SELECT count(*) FROM public.profiles),
    (SELECT count(*) FROM public.products);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_page_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_page_view(text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;

-- 2. Public buckets: remove broad SELECT policies that allow listing every file.
-- Public buckets are still served over the CDN, so media keeps loading.
DROP POLICY IF EXISTS "listing media public read" ON storage.objects;
DROP POLICY IF EXISTS "avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars read" ON storage.objects;

-- 3. price_tiers: only for approved (public) listings
DROP POLICY IF EXISTS "tiers public read" ON public.price_tiers;
CREATE POLICY "tiers read for approved listings"
ON public.price_tiers FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.products p
  WHERE p.id = price_tiers.product_id
    AND (p.status = 'approved' OR p.seller_id = auth.uid())
));

-- 4. Reviews, stories, reel comments/likes: signed-in users only
DROP POLICY IF EXISTS "reviews public read" ON public.reviews;
CREATE POLICY "reviews readable by signed-in users"
ON public.reviews FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.reviews FROM anon;

DROP POLICY IF EXISTS "active stories are public" ON public.stories;
CREATE POLICY "active stories readable by signed-in users"
ON public.stories FOR SELECT TO authenticated USING (expires_at > now());
REVOKE SELECT ON public.stories FROM anon;

DROP POLICY IF EXISTS "video comments are public" ON public.video_comments;
CREATE POLICY "video comments readable by signed-in users"
ON public.video_comments FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.video_comments FROM anon;

DROP POLICY IF EXISTS "likes public read" ON public.video_likes;
CREATE POLICY "likes readable by signed-in users"
ON public.video_likes FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.video_likes FROM anon;