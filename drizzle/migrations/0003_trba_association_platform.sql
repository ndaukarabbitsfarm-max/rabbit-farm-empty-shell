CREATE TABLE public.trba_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, member_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE, full_name text NOT NULL, nida_number text NOT NULL UNIQUE, region text NOT NULL, phone text NOT NULL, email text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')), reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.trba_members TO authenticated;
GRANT UPDATE ON public.trba_members TO authenticated;
GRANT ALL ON public.trba_members TO service_role;
ALTER TABLE public.trba_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_read ON public.trba_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY members_register ON public.trba_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND reviewed_at IS NULL);
CREATE POLICY members_admin_review ON public.trba_members FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.trba_rabbits (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL, registration_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE, name text NOT NULL, breed text NOT NULL, sex text NOT NULL CHECK (sex IN ('male','female')), date_of_birth date NOT NULL, sire_id uuid REFERENCES public.trba_rabbits(id), dam_id uuid REFERENCES public.trba_rabbits(id), notes text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.trba_rabbits TO authenticated;
GRANT ALL ON public.trba_rabbits TO service_role;
ALTER TABLE public.trba_rabbits ENABLE ROW LEVEL SECURITY;
CREATE POLICY rabbits_read ON public.trba_rabbits FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY rabbits_register ON public.trba_rabbits FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.trba_members m WHERE m.user_id = auth.uid() AND m.status = 'approved'));
CREATE FUNCTION public.trba_validate_pedigree() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$ BEGIN
 IF NEW.date_of_birth > current_date THEN RAISE EXCEPTION 'Birth date cannot be in the future'; END IF;
 IF NEW.sire_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.trba_rabbits WHERE id=NEW.sire_id AND owner_id=NEW.owner_id AND sex='male' AND date_of_birth < NEW.date_of_birth) THEN RAISE EXCEPTION 'Sire must be an older male in your registry'; END IF;
 IF NEW.dam_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.trba_rabbits WHERE id=NEW.dam_id AND owner_id=NEW.owner_id AND sex='female' AND date_of_birth < NEW.date_of_birth) THEN RAISE EXCEPTION 'Dam must be an older female in your registry'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER validate_trba_pedigree BEFORE INSERT OR UPDATE ON public.trba_rabbits FOR EACH ROW EXECUTE FUNCTION public.trba_validate_pedigree();
REVOKE EXECUTE ON FUNCTION public.trba_validate_pedigree() FROM PUBLIC, anon, authenticated;
CREATE TABLE public.trba_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, category text NOT NULL CHECK (category IN ('constitution','guidelines','other')), file_url text NOT NULL CHECK (file_url LIKE 'https://%'), created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trba_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trba_documents TO authenticated;
GRANT ALL ON public.trba_documents TO service_role;
ALTER TABLE public.trba_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_public_read ON public.trba_documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY documents_admin_write ON public.trba_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by=auth.uid());
CREATE TABLE public.trba_announcements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text NOT NULL, kind text NOT NULL CHECK (kind IN ('announcement','meeting')), meeting_at timestamptz, location text, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trba_announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trba_announcements TO authenticated;
GRANT ALL ON public.trba_announcements TO service_role;
ALTER TABLE public.trba_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY announcements_public_read ON public.trba_announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY announcements_admin_write ON public.trba_announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by=auth.uid());
CREATE TABLE public.trba_leadership_terms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id uuid NOT NULL REFERENCES public.trba_members(id), position text NOT NULL, starts_on date NOT NULL, ends_on date NOT NULL, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trba_leadership_terms TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trba_leadership_terms TO authenticated;
GRANT ALL ON public.trba_leadership_terms TO service_role;
ALTER TABLE public.trba_leadership_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY terms_read ON public.trba_leadership_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY terms_admin_write ON public.trba_leadership_terms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by=auth.uid());
CREATE FUNCTION public.trba_validate_leadership_term() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$ BEGIN
 IF NEW.ends_on <= NEW.starts_on OR NEW.ends_on > (NEW.starts_on + interval '5 years')::date THEN RAISE EXCEPTION 'Leadership term must be positive and cannot exceed five years'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.trba_members WHERE id=NEW.member_id AND status='approved') THEN RAISE EXCEPTION 'Leader must be an approved member'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER validate_trba_term BEFORE INSERT OR UPDATE ON public.trba_leadership_terms FOR EACH ROW EXECUTE FUNCTION public.trba_validate_leadership_term();
REVOKE EXECUTE ON FUNCTION public.trba_validate_leadership_term() FROM PUBLIC, anon, authenticated;