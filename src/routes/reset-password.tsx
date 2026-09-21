import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Rabbit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Weka nywila mpya — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Set a new password for your Ndauka Rabbits Farm marketplace account.",
      },
      { property: "og:title", content: "Weka nywila mpya — Ndauka Rabbits Farm Marketplace" },
      { property: "og:description", content: "Set a new password for your marketplace account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Nywila imebadilishwa. Karibu tena!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Imeshindikana kubadilisha nywila");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex flex-col">
      <div className="brand-surface safe-top px-6 pb-10 pt-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <Rabbit className="h-7 w-7" />
        </span>
        <h1 className="mt-3 text-xl font-semibold">Weka nywila mpya</h1>
        <p className="mt-1 text-sm opacity-85">Set a new password</p>
      </div>

      <div className="-mt-6 flex-1 rounded-t-3xl bg-background px-5 pb-10 pt-6">
        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nywila mpya</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hifadhi nywila"}
            </Button>
          </form>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Fungua kiungo kilichotumwa kwenye barua pepe yako ili kuweka nywila mpya.
          </p>
        )}
      </div>
    </div>
  );
}
