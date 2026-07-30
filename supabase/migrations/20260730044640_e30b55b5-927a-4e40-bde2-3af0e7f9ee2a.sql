-- Orders: cart checkout fields
ALTER TABLE public.orders
  ALTER COLUMN product_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS buyer_name text,
  ADD COLUMN IF NOT EXISTS buyer_phone text,
  ADD COLUMN IF NOT EXISTS shipping_address text;

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_pair
  ON public.conversations (buyer_id, seller_id, COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::uuid));

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation participants select" ON public.conversations
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "conversation buyer insert" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "conversation participants update" ON public.conversations
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages (conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages participants select" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "messages participants insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));
CREATE POLICY "messages participants update" ON public.messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

CREATE TRIGGER conversations_set_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER messages_set_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sellers can read buyer profile basics for orders on their products
CREATE POLICY "sellers read buyer profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.buyer_id = profiles.id AND o.seller_id = auth.uid()));
