import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LogIn,
  LogOut,
  ShieldCheck,
  Package,
  Loader2,
  ClipboardList,
  MessageCircle,
  ShoppingCart,
  Heart,
  Ticket,
  BadgeCheck,
  HelpCircle,
  Globe,
  Settings as SettingsIcon,
  Info,
  User as UserIcon,
  Camera,
  Store,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { ProfileMenuRow } from "@/components/ProfileMenuRow";
import { KycSection } from "@/components/KycSection";
import { CreateMediaDialog } from "@/components/CreateMediaDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePrefs } from "@/lib/prefs";
import { useUnreadMessages } from "@/lib/unread";
import { signedUrl } from "@/lib/storage";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Akaunti Yangu — Ndauka Farm Marketplace" },
      {
        name: "description",
        content: "Manage your buyer or seller profile, contact details and location on the marketplace.",
      },
      { property: "og:title", content: "Akaunti Yangu — Ndauka Farm Marketplace" },
      { property: "og:description", content: "Manage your buyer or seller profile and contacts." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, isAdmin, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, currency, lang } = usePrefs();
  const unread = useUnreadMessages();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [about, setAbout] = useState("");
  const [savingAbout, setSavingAbout] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", whatsapp: "", region: "", city: "" });

  const { data: avatarUrl, refetch: refetchAvatar } = useQuery({
    enabled: Boolean(profile?.avatar_url),
    queryKey: ["avatar", profile?.avatar_url],
    queryFn: () => signedUrl("avatars", profile?.avatar_url),
  });

  const { data: kyc } = useQuery({
    enabled: Boolean(user),
    queryKey: ["kyc", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", user!.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        whatsapp: profile.whatsapp ?? "",
        region: profile.region ?? "",
        city: profile.city ?? "",
      });
      setAbout(profile.about_text ?? "");
    }
  }, [profile]);

  if (!user) {
    return (
      <MobileShell title="Akaunti Yangu">
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

  async function uploadAvatar(file: File) {
    setUploading(true);
    const path = `${user!.id}/avatar-${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (up.error) {
      setUploading(false);
      toast.error(up.error.message);
      return;
    }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
    setUploading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Picha imewekwa");
      await refreshProfile();
      await refetchAvatar();
    }
  }

  async function becomeSeller() {
    const { error } = await supabase.from("profiles").update({ role: "seller" }).eq("id", user!.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Wasifu wako sasa ni Seller / Breeder");
      await refreshProfile();
    }
  }

  async function saveAbout(e: React.FormEvent) {
    e.preventDefault();
    setSavingAbout(true);
    const { error } = await supabase
      .from("profiles")
      .update({ about_text: about })
      .eq("id", user!.id);
    setSavingAbout(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Maelezo yamehifadhiwa");
      await refreshProfile();
    }
  }

  const isSeller = profile?.role === "seller";
  const verifiedBadge =
    kyc?.status === "approved"
      ? kyc.kind === "builder"
        ? "Verified Builder ✔️"
        : "Verified Breeder ✔️"
      : null;

  return (
    <MobileShell title="Akaunti Yangu" subtitle={user.email ?? user.phone ?? undefined}>
      {/* Header: avatar + name + verification badge space */}
      <div className="brand-surface px-4 pb-6 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Badilisha picha ya wasifu"
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-foreground/20"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Picha ya wasifu" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-8 w-8 opacity-70" />
            )}
            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </span>
          </button>
          {isSeller ? (
            <button
              type="button"
              onClick={() => setStoryOpen(true)}
              aria-label="Anza Story"
              className="-ml-4 mt-8 flex h-6 w-6 items-center justify-center self-start rounded-full bg-primary-foreground text-xs font-bold text-primary"
            >
              +
            </button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadAvatar(f);
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">{profile?.full_name || "Unnamed user"}</p>
            <div className="flex min-h-6 flex-wrap items-center gap-1.5 pt-1">
              {verifiedBadge ? (
                <Badge className="bg-primary-foreground text-[10px] text-primary">{verifiedBadge}</Badge>
              ) : null}
              <Badge variant="secondary" className="text-[10px]">
                {isSeller ? "Seller / Breeder" : "Buyer"}
              </Badge>
              {isAdmin ? <Badge className="text-[10px]">Admin</Badge> : null}
            </div>
          </div>
        </div>
        {!isSeller ? (
          <button
            type="button"
            onClick={() => void becomeSeller()}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold underline"
          >
            <Store className="h-3.5 w-3.5" /> {t("wantToSell")}
          </button>
        ) : null}
      </div>

      <div className="space-y-4 px-0 pt-3">
        {/* Primary menu */}
        <nav className="mx-3 overflow-hidden rounded-2xl bg-card shadow-sm">
          <ProfileMenuRow to="/orders" icon={ClipboardList} label={t("manageOrders")} />
          <ProfileMenuRow to="/messages" icon={MessageCircle} label={t("messenger")} dot={unread > 0} />
          <ProfileMenuRow to="/cart" icon={ShoppingCart} label={t("shoppingCart")} />
          <ProfileMenuRow to="/favorites" icon={Heart} label={t("favorites")} />
          <ProfileMenuRow to="/coupons" icon={Ticket} label={t("coupons")} />
          <ProfileMenuRow to="/how-to-sell" icon={BadgeCheck} label={t("howToSell")} />
          <ProfileMenuRow to="/help" icon={HelpCircle} label={t("help")} />
        </nav>

        {/* Separated settings band */}
        <div className="bg-muted/60 py-3">
          <nav className="mx-3 overflow-hidden rounded-2xl bg-card shadow-sm">
            <ProfileMenuRow
              to="/settings"
              icon={Globe}
              label={t("regionCurrency")}
              value={`${currency} · ${lang.toUpperCase()}`}
            />
            <ProfileMenuRow to="/settings" icon={SettingsIcon} label={t("settings")} />
            <ProfileMenuRow to="/about" icon={Info} label={t("about")} />
          </nav>
        </div>

        <div className="space-y-4 px-3">
          {/* Safety banner */}
          <div className="flex items-center gap-3 rounded-2xl bg-accent p-4 text-accent-foreground">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t("safetyTitle")}</p>
              <p className="pt-1 text-xs leading-snug opacity-90">{t("safetyBody")}</p>
            </div>
            <ShieldCheck className="h-10 w-10 shrink-0 opacity-70" />
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
            {isAdmin ? (
              <Button asChild variant="outline" className="h-11 justify-start rounded-xl">
                <Link to="/admin/orders">
                  <ClipboardCheck className="mr-2 h-4 w-4" /> Admin orders
                </Link>
              </Button>
            ) : null}
          </div>

          <form onSubmit={saveAbout} className="surface-card space-y-3 p-4">
            <h3 className="text-sm font-semibold">
              {isSeller ? "Kuhusu Shamba" : "Kuhusu mimi"}
            </h3>
            <Textarea
              rows={5}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              aria-label={isSeller ? "Maelezo ya shamba" : "Maelezo yako"}
              placeholder={
                isSeller
                  ? "Eleza shamba lako: unafuga nini, uzoefu wa miaka mingapi, mahali ulipo…"
                  : "Maelezo mafupi kukuhusu…"
              }
              className="rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground">
              {isSeller ? "Maelezo haya yataonekana kwa wanunuzi kwenye ukurasa wako." : "Yataonekana kwenye wasifu wako."}
            </p>
            <Button type="submit" className="h-11 w-full rounded-xl" disabled={savingAbout}>
              {savingAbout ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hifadhi maelezo"}
            </Button>
          </form>

          <KycSection />

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
      </div>
    </MobileShell>
  );
}