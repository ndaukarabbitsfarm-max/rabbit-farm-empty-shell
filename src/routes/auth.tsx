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
    ],
  }),
  component: AuthPage,
});

type Method = "email" | "phone";

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
 const [countryCode, setCountryCode] = useState("+255");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (method === "email") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ phone: `${countryCode}${phone}` });
        if (error) throw error;
        setOtpSent(true);
        toast.success("Code sent by SMS");
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: `${countryCode}${phone}`,
          token: otp,
          type: "sms",
        });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
const metadata = { full_name: fullName, role, phone: `${countryCode}${phone}` };
if (method === "email") {

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: metadata },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      } else if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: `${countryCode}${phone}`,
          options: { data: metadata },
        });
        if (error) throw error;
        setOtpSent(true);
        toast.success("Code sent by SMS");
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: `${countryCode}${phone}`,
          token: otp,
          type: "sms",
        });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  const identityFields = (
    <>
      <div className="grid grid-cols-2 gap-2">
        {(["email", "phone"] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMethod(m);
              setOtpSent(false);
            }}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-medium capitalize transition-colors",
              method === m
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {m === "email" ? "Email" : "Phone number"}
          </button>
        ))}
      </div>
      {method === "email" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="rounded-xl border px-2 py-2 bg-card text-sm w-24"
            >
              <option value="+255">TZ +255</option>
              <option value="+254">KE +254</option>
              <option value="+256">UG +256</option>
              <option value="+250">RW +250</option>
              <option value="+257">BI +257</option>
              <option value="+243">CD +243</option>
              <option value="+260">ZM +260</option>
              <option value="+265">MW +265</option>
              <option value="+27">ZA +27</option>
              <option value="+234">NG +234</option>
              <option value="+233">GH +233</option>
              <option value="+91">IN +91</option>
              <option value="+86">CN +86</option>
              <option value="+971">AE +971</option>
              <option value="+44">GB +44</option>
              <option value="+1">US +1</option>
              <option value="+49">DE +49</option>
              <option value="+33">FR +33</option>
            </select>
            <Input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="7XX XXX XXX"
              className="flex-1"
            />
          </div>
        </div>
         
            
              
              
             
              
              
            

         
          {otpSent ? (
            <div className="space-y-1.5">
              <Label htmlFor="otp">SMS code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
            </div>
          ) : null}
        </>
      )}
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
              {identityFields}
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-3.5 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              {identityFields}
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