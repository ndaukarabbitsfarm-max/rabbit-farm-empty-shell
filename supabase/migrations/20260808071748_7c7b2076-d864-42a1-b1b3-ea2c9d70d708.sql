CREATE TABLE public.product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.product_likes TO authenticated;
GRANT SELECT ON public.product_likes TO anon;
GRANT ALL ON public.product_likes TO service_role;
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read product likes" ON public.product_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can like" ON public.product_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike own" ON public.product_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_product_likes_product ON public.product_likes(product_id);

CREATE TABLE public.notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  orders boolean NOT NULL DEFAULT true,
  messages boolean NOT NULL DEFAULT true,
  reels boolean NOT NULL DEFAULT true,
  kyc boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification prefs" ON public.notification_prefs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER notification_prefs_set_updated_at BEFORE UPDATE ON public.notification_prefs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;