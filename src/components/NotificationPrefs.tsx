import { useEffect, useState } from "react";
import { BellRing, ClipboardList, MessageCircle, Film, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Prefs = { orders: boolean; messages: boolean; reels: boolean; kyc: boolean };

const DEFAULTS: Prefs = { orders: true, messages: true, reels: true, kyc: true };

const ROWS = [
  { key: "orders", icon: ClipboardList, label: "Oda", hint: "Oda mpya na mabadiliko ya hali." },
  { key: "messages", icon: MessageCircle, label: "Ujumbe", hint: "Ujumbe wa Messenger." },
  { key: "reels", icon: Film, label: "Reels", hint: "Like, maoni na wafuasi wapya." },
  { key: "kyc", icon: ShieldCheck, label: "KYC", hint: "Uthibitishaji wa nyaraka." },
] as const;

/** Lets each user choose which kinds of notifications they receive. */
export function NotificationPrefs({ isAdmin }: { isAdmin?: boolean }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void supabase
      .from("notification_prefs")
      .select("orders, messages, reels, kyc")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive && data) setPrefs(data);
      });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  async function update(key: keyof Prefs, value: boolean) {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { error } = await supabase
      .from("notification_prefs")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    if (error) {
      setPrefs(prefs);
      toast.error("Imeshindikana kuhifadhi mapendeleo ya arifa.");
    }
  }

  if (!user) return null;
  const rows = ROWS.filter((r) => r.key !== "kyc" || isAdmin);

  return (
    <div className="border-b border-border/70 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <BellRing className="h-[18px] w-[18px]" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Aina za Arifa</span>
          <span className="block text-[11px] text-muted-foreground">
            Chagua arifa unazotaka kupokea.
          </span>
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Ficha" : "Fungua"}</span>
      </button>
      {open ? (
        <div className="space-y-1 border-t border-border/70 bg-muted/40 px-4 py-2">
          {rows.map(({ key, icon: Icon, label, hint }) => (
            <div key={key} className="flex items-center gap-3 py-2">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-[11px] text-muted-foreground">{hint}</span>
              </span>
              <Switch
                checked={prefs[key]}
                onCheckedChange={(v) => void update(key, v)}
                aria-label={`Arifa za ${label}`}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
