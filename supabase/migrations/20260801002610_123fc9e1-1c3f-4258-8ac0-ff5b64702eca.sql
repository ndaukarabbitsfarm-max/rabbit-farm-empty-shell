-- profiles additions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
CREATE TYPE public.verification_kind AS ENUM ('breeder','builder');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_kind public.verification_kind;

-- products additions
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pedigree_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vaccination_records text;

CREATE TYPE public.kyc_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.report_status AS ENUM ('open','reviewed','actioned');

-- KYC submissions
CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.verification_kind NOT NULL DEFAULT 'breeder',
  id_document_path text NOT NULL,
  farm_photo_paths text[] NOT NULL DEFAULT '{}',
  status public.kyc_status NOT NULL DEFAULT 'pending',
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_submissions TO authenticated;
GRANT ALL ON public.kyc_submissions TO service_role;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kyc own read" ON public.kyc_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "kyc own insert" ON public.kyc_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "kyc admin update" ON public.kyc_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id, reviewer_id)
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews owner write" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid() AND o.status = 'completed'
    )
  );
CREATE POLICY "reviews owner update" ON public.reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "reviews owner delete" ON public.reviews FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports insert own" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports read own or admin" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports admin update" ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Price tiers
CREATE TABLE public.price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_qty integer NOT NULL CHECK (min_qty > 0),
  price_tzs integer NOT NULL CHECK (price_tzs >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, min_qty)
);
GRANT SELECT ON public.price_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_tiers TO authenticated;
GRANT ALL ON public.price_tiers TO service_role;
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiers public read" ON public.price_tiers FOR SELECT USING (true);
CREATE POLICY "tiers seller manage" ON public.price_tiers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.seller_id = auth.uid()));

-- Video tips
CREATE TABLE public.video_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  video_path text NOT NULL,
  caption text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_posts TO authenticated;
GRANT ALL ON public.video_posts TO service_role;
ALTER TABLE public.video_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos public read" ON public.video_posts FOR SELECT USING (true);
CREATE POLICY "videos seller manage" ON public.video_posts FOR ALL TO authenticated
  USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

CREATE TABLE public.video_likes (
  video_id uuid NOT NULL REFERENCES public.video_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);
GRANT SELECT ON public.video_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes public read" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "likes own write" ON public.video_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "likes own delete" ON public.video_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.follows (
  follower_id uuid NOT NULL,
  followed_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows public read" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows own write" ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows own delete" ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- updated_at triggers
CREATE TRIGGER kyc_updated_at BEFORE UPDATE ON public.kyc_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER video_posts_updated_at BEFORE UPDATE ON public.video_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_price_tiers_product ON public.price_tiers(product_id);
CREATE INDEX idx_video_posts_created ON public.video_posts(created_at DESC);