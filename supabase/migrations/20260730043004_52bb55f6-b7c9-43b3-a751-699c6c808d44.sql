-- 1) Hide seller contact columns from anonymous visitors (column-level privileges)
REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (
  id, seller_id, title, category_slug, breed, quantity, price_tzs,
  description, region, city, media_urls, status, created_at, updated_at
) ON public.products TO anon;

-- 2) Internal functions must not be directly callable by app users
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_admin_only_moderation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_admin_only_moderation() TO service_role;

-- 3) has_role must remain executable by authenticated: RLS policy expressions
--    are evaluated with the caller's privileges. Keep it away from anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;