CREATE OR REPLACE FUNCTION public.enforce_admin_only_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'products' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can change listing status';
    END IF;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.approved IS DISTINCT FROM OLD.approved AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can approve profiles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_admin_only_moderation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS products_admin_only_status ON public.products;
CREATE TRIGGER products_admin_only_status
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_only_moderation();

DROP TRIGGER IF EXISTS profiles_admin_only_approval ON public.profiles;
CREATE TRIGGER profiles_admin_only_approval
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_only_moderation();