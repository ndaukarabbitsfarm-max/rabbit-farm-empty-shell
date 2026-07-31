-- 1. Verified seller badge
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- only admins may flip verified / approved
CREATE OR REPLACE FUNCTION public.enforce_verified_admin_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
      RAISE EXCEPTION 'Only admins can change verified status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_verified_admin_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_verified_admin_only ON public.profiles;
CREATE TRIGGER enforce_verified_admin_only
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_admin_only();

-- admins can update any profile (for verification)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- 2. MOQ on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS moq integer NOT NULL DEFAULT 1;
GRANT SELECT (moq) ON public.products TO anon;

-- 3. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

-- fan-out: notify everyone (except the seller) when a listing becomes approved
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    SELECT p.id, 'listing',
           NEW.title || ' mpya imewekwa' || COALESCE(' ' || NEW.region, ''),
           'Angalia bidhaa mpya kwenye soko.',
           '/product/' || NEW.id
    FROM public.profiles p
    WHERE p.id <> NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_new_listing() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_new_listing ON public.products;
CREATE TRIGGER notify_new_listing
AFTER INSERT OR UPDATE OF status ON public.products
FOR EACH ROW EXECUTE FUNCTION public.notify_new_listing();

-- 4. RFQ requests
CREATE TABLE IF NOT EXISTS public.rfq_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug text NOT NULL,
  title text NOT NULL,
  details text,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'piece',
  target_price_tzs numeric,
  region text,
  contact_phone text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_requests TO authenticated;
GRANT ALL ON public.rfq_requests TO service_role;
ALTER TABLE public.rfq_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers manage own rfq" ON public.rfq_requests;
CREATE POLICY "Buyers manage own rfq" ON public.rfq_requests
FOR ALL TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());
DROP POLICY IF EXISTS "Admins view all rfq" ON public.rfq_requests;
CREATE POLICY "Admins view all rfq" ON public.rfq_requests
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP TRIGGER IF EXISTS set_updated_at_rfq ON public.rfq_requests;
CREATE TRIGGER set_updated_at_rfq BEFORE UPDATE ON public.rfq_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Page views
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read page views" ON public.page_views;
CREATE POLICY "Admins read page views" ON public.page_views
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE OR REPLACE FUNCTION public.record_page_view(_path text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.page_views (path, user_id) VALUES (left(_path, 300), auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.record_page_view(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS TABLE (total_views bigint, total_users bigint, total_products bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.page_views),
    (SELECT count(*) FROM public.profiles),
    (SELECT count(*) FROM public.products);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;