import { useCallback, useEffect, useState } from "react";
import { Bell, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import {
  disablePush,
  enablePush,
  getPushStatus,
  isEmbedded,
  type PushStatus,
} from "@/lib/push-client";

const HINTS: Record<PushStatus, string> = {
  ready: "Pokea arifa za oda, ujumbe na maoni kwenye simu yako.",
  on: "Arifa zimewashwa kwenye kifaa hiki.",
  unsupported: "Kifaa hiki hakisapoti arifa za push.",
  embedded: "Bonyeza hapa kufungua app kamili kisha uwashe arifa.",
  blocked: "Ruhusa imezuiwa. Iwashe kwenye mipangilio ya kivinjari kisha ujaribu tena.",
};

/** "Washa Arifa" — subscribes this device to real push notifications. */
export function PushToggle() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>("ready");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const next = await getPushStatus();
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void getPushStatus().then((v) => {
      if (alive) setStatus(v);
    });
    return () => {
      alive = false;
    };
  }, [user?.id, refresh]);

  function openFullApp() {
    const url = window.location.href;
    window.open(url, "_blank", "noopener");
    toast("Fungua app kwenye dirisha jipya, kisha uwashe arifa hapo.", { duration: 7000 });
  }

  async function toggle(next: boolean) {
    if (!user || busy) return;
    if (isEmbedded()) {
      openFullApp();
      return;
    }
    setBusy(true);
    try {
      if (next) {
        await enablePush(user.id);
        setStatus("on");
        toast.success("Arifa zimewashwa kwenye kifaa hiki.");
        toast("Kwa matokeo bora, bonyeza menu ya kivinjari na uchague 'Add to Home Screen'.", {
          duration: 8000,
        });
      } else {
        await disablePush();
        setStatus("ready");
        toast.success("Arifa zimezimwa.");
      }
    } catch (err) {
      await refresh();
      toast.error(err instanceof Error ? err.message : "Imeshindikana kuwasha arifa.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const embedded = status === "embedded";

  return (
    <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 last:border-b-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Bell className="h-[18px] w-[18px]" />
      </span>
      <button
        type="button"
        onClick={() => (embedded ? openFullApp() : void toggle(status !== "on"))}
        disabled={status === "unsupported" || busy}
        className="flex-1 text-left disabled:opacity-100"
      >
        <span className="block text-sm font-medium">Washa Arifa</span>
        <span className="block text-[11px] text-muted-foreground">{HINTS[status]}</span>
      </button>
      {embedded ? (
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Switch
          checked={status === "on"}
          disabled={status === "unsupported" || busy}
          aria-label="Washa Arifa"
          onCheckedChange={(v) => void toggle(v)}
        />
      )}
    </div>
  );
}
