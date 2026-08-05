import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { disablePush, enablePush, isPushEnabled, isPushSupported } from "@/lib/push-client";

/** "Washa Arifa" — subscribes this device to real push notifications. */
export function PushToggle() {
  const { user } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const supported = isPushSupported();

  useEffect(() => {
    void isPushEnabled().then(setOn);
  }, [user?.id]);

  async function toggle(next: boolean) {
    if (!user) return;
    setBusy(true);
    try {
      if (next) {
        await enablePush(user.id);
        setOn(true);
        toast.success("Arifa zimewashwa kwenye kifaa hiki.");
      } else {
        await disablePush();
        setOn(false);
        toast.success("Arifa zimezimwa.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Imeshindikana kuwasha arifa.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 last:border-b-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Bell className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium">Washa Arifa</span>
        <span className="block text-[11px] text-muted-foreground">
          {supported
            ? "Pokea arifa za oda, ujumbe na maoni kwenye simu yako."
            : "Kifaa hiki hakisapoti arifa za push."}
        </span>
      </span>
      <Switch checked={on} disabled={!supported || busy} onCheckedChange={(v) => void toggle(v)} />
    </div>
  );
}
