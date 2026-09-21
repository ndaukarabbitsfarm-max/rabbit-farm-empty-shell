import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Rabbit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhoneInput } from "@/components/PhoneInput";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Create a buyer or seller account to trade rabbits and farm supplies in Tanzania.",
      },
      { property: "og:title", content: "Sign in — Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content: "Create a buyer or seller account to trade rabbits and farm supplies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function authErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  const msg = raw.toLowerCase();
  if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
    return "Barua pepe yako haijathibitishwa. Bonyeza 'Tuma tena kiungo cha uthibitisho' hapa chini.";
  }
  if (msg.includes("invalid login credentials")) {
    return "Barua pepe au nywila si sahihi. Kama umesahau nywila, bonyeza 'Nimesahau nywila'.";
  }
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "Akaunti hii ipo tayari. Tafadhali ingia (Log in) badala ya kufungua mpya.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Umejaribu mara nyingi. Subiri dakika chache kisha ujaribu tena.";
  }
  return raw || "Imeshindikana kuingia. Jaribu tena.";
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+255");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/" });
    } catch (err) {
      const message = authErrorMessage(err);
      if (message.includes("haijathibitishwa")) setNeedsConfirm(true);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const metadata = {
        full_name: fullName,
        role,
        phone: phone ? `${countryCode}${phone}` : null,
      };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: metadata },
      });
      if (error) throw error;
      if (data.session) {
        navigate({ to: "/" });
      } else {
        setNeedsConfirm(true);
        toast.success("Akaunti imefunguliwa. Fungua barua pepe yako uthibitishe kabla ya kuingia.");
      }
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    if (!email) {
      toast.error("Andika barua pepe yako kwanza.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success("Kiungo cha uthibitisho kimetumwa kwenye barua pepe yako.");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    if (!email) {
      toast.error("Andika barua pepe yako kwanza.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Tumekutumia kiungo cha kuweka nywila mpya.");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const credentialFields = (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="email">Barua pepe / Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Nywila / Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
    </>
  );

  return (
    <div className="app-shell flex flex-col">
      <div className="brand-surface safe-top px-6 pb-10 pt-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <Rabbit className="h-7 w-7" />
        </span>
        <h1 className="mt-3 text-xl font-semibold">Ndauka Rabbits Farm</h1>
        <p className="mt-1 text-sm opacity-85">Marketplace ya sungura na vifaa vya shamba</p>
      </div>

      <div className="-mt-6 flex-1 rounded-t-3xl bg-background px-5 pb-10 pt-6">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="signin" className="rounded-lg">
              Log in
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-lg">
              Sign up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3.5 pt-4">
              {credentialFields}
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
              </Button>
              <div className="flex flex-col gap-1.5 pt-1 text-center">
                <button
                  type="button"
                  onClick={forgotPassword}
                  disabled={loading}
                  className="text-xs text-muted-foreground underline underline-offset-4"
                >
                  Nimesahau nywila / Forgot password
                </button>
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={loading}
                  className={cn(
                    "text-xs underline underline-offset-4",
                    needsConfirm ? "font-medium text-primary" : "text-muted-foreground",
                  )}
                >
                  Tuma tena kiungo cha uthibitisho
                </button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-3.5 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Jina kamili / Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              {credentialFields}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Namba ya simu (hiari)</Label>
                <PhoneInput
                  code={countryCode}
                  onCodeChange={setCountryCode}
                  value={phone}
                  onValueChange={setPhone}
                />
              </div>
              <div className="space-y-2">
                <Label>I am a…</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setRole(v as "buyer" | "seller")}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { value: "buyer", label: "Buyer", hint: "Mnunuzi" },
                    { value: "seller", label: "Seller / Breeder", hint: "Mfugaji" },
                  ].map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={`role-${opt.value}`}
                      className={cn(
                        "flex cursor-pointer flex-col gap-0.5 rounded-xl border p-3 transition-colors",
                        role === opt.value ? "border-primary bg-accent" : "border-border bg-card",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <RadioGroupItem id={`role-${opt.value}`} value={opt.value} />
                        {opt.label}
                      </span>
                      <span className="pl-6 text-[11px] text-muted-foreground">{opt.hint}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="pt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">
            Continue browsing without an account
          </Link>
        </p>
      </div>
    </div>
  );
}
