DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;
CREATE POLICY "Users create own notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_chat_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_name text;
BEGIN
  SELECT COALESCE(full_name, 'Mnunuzi') INTO buyer_name FROM public.profiles WHERE id = NEW.buyer_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (NEW.seller_id, 'chat', buyer_name || ' ameomba chat na wewe',
          'Fungua Messenger kujibu ujumbe.', '/messages/' || NEW.id);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_chat_request() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_chat_request ON public.conversations;
CREATE TRIGGER notify_chat_request
AFTER INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.notify_chat_request();