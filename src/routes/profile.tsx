import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, ShieldCheck, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Manage your buyer or seller profile, contact details and location on the marketplace.",
      },
      { property: "og:title", content: "Profile — Ndauka Rabbits Farm Marketplace" },
      { property: "og:description", content: "Manage your buyer or seller profile and contacts." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, isAdmin, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", whatsapp: "", region: "", city: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        whatsapp: profile.whatsapp ?? "",
        region: profile.region ?? "",
        city: profile.city ?? "",
      });
    }
  }, [profile]);

  if (!user) {
    return (
      <MobileShell title="Profile">
        <EmptyState
          icon={LogIn}
          title="You are not signed in"
          description="Ingia ili kudhibiti wasifu wako."
          action={
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/auth">Log in / Sign up</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved");
      await refreshProfile();
    }
  }

  return (
    <MobileShell title="Profile" subtitle={user.email ?? user.phone ?? undefined}>
      <div className="space-y-4 px-4 pt-4">
        <div className="surface-card flex items-center gap-3 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
            {(profile?.full_name || user.email || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.full_name || "Unnamed user"}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary" className="text-[10px] capitalize">
                {profile?.role === "seller" ? "Seller / Breeder" : "Buyer"}
              </Badge>
              <Badge variant={profile?.approved ? "default" : "outline"} className="text-[10px]">
                {profile?.approved ? "Approved" : "Pending approval"}
              </Badge>
              {isAdmin ? <Badge className="text-[10px]">Admin</Badge> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Button asChild variant="outline" className="h-11 justify-start rounded-xl">
            <Link to="/my-listings">
              <Package className="mr-2 h-4 w-4" /> My Listings
            </Link>
          </Button>
          {isAdmin ? (
            <Button asChild variant="outline" className="h-11 justify-start rounded-xl">
              <Link to="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" /> Admin review
              </Link>
            </Button>
          ) : null}
        </div>

        <form onSubmit={save} className="surface-card space-y-3 p-4">
          <h3 className="text-sm font-semibold">Contact details</h3>
          {(
            [
              ["full_name", "Full name"],
              ["phone", "Phone number"],
              ["whatsapp", "WhatsApp number"],
              ["region", "Region"],
              ["city", "City / Ward"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
          ))}
          <Button type="submit" className="h-11 w-full rounded-xl" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="h-11 w-full rounded-xl text-destructive"
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </Button>
      </div>
    </MobileShell>
  );
}