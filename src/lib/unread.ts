import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Number of messages sent to me that I have not opened yet. */
export function useUnreadMessages() {
  const { user } = useAuth();
  const { data } = useQuery({
    enabled: Boolean(user),
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`);
      const ids = (convos ?? []).map((c) => c.id);
      if (!ids.length) return 0;
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", user!.id)
        .is("read_at", null);
      return count ?? 0;
    },
  });
  return data ?? 0;
}