import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const UNREAD_KEY = "unread-messages";

/**
 * Unread message counts, per conversation and in total.
 * Kept live with Supabase Realtime so the Messenger badge updates without a refresh.
 */
export function useUnreadMessages() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    enabled: Boolean(user),
    queryKey: [UNREAD_KEY, user?.id],
    queryFn: async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`);
      const ids = (convos ?? []).map((c) => c.id);
      if (!ids.length) return { total: 0, byConversation: {} as Record<string, number> };
      const { data: rows } = await supabase
        .from("messages")
        .select("id, conversation_id")
        .in("conversation_id", ids)
        .neq("sender_id", user!.id)
        .is("read_at", null);
      const byConversation: Record<string, number> = {};
      for (const row of rows ?? []) {
        byConversation[row.conversation_id] = (byConversation[row.conversation_id] ?? 0) + 1;
      }
      return { total: rows?.length ?? 0, byConversation };
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`unread-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void qc.invalidateQueries({ queryKey: [UNREAD_KEY, user.id] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return {
    total: data?.total ?? 0,
    byConversation: data?.byConversation ?? {},
  };
}

/** Mark every incoming message in a conversation as read, right when it is opened. */
export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}
