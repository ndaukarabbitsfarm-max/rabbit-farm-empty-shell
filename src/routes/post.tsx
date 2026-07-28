import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, LogIn, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/post")({
  head: () => ({
    meta: [
      { title: "Post an Item — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content:
          "List your breeding rabbits, cages, feeds or equipment with photos, price in TZS and location.",
      },
      { property: "og:title", content: "Post an Item — Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content: "List your rabbits, cages, feeds or equipment for buyers across Tanzania.",
      },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category_slug: "",
    breed: "",
    quantity: "1",
    price_tzs: "",
    description: "",
    region: "",
    city: "",
    contact_phone: "",
    whatsapp: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.category_slug) {
      toast.error("Please choose a category");
      return;
    }
    setSubmitting(true);
    try {
      const paths: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("listings").upload(path, file);
        if (error) throw error;
        paths.push(path);
      }

      const { error } = await supabase.from("products").insert({
        seller_id: user.id,
        title: form.title,
        category_slug: form.category_slug,
        breed: form.breed || null,
        quantity: Number(form.quantity) || 1,
        price_tzs: Number(form.price_tzs) || 0,
        description: form.description || null,
        region: form.region || null,
        city: form.city || null,
        contact_phone: form.contact_phone || null,
        whatsapp: form.whatsapp || null,
        media_urls: paths,
      });
      if (error) throw error;

      if (form.region) {
        await supabase
          .from("locations")
          .upsert({ region: form.region, city: form.city || null }, { onConflict: "region,city" });
      }

      toast.success("Listing submitted for review");
      navigate({ to: "/my-listings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post listing");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <MobileShell title="Post Item"><div className="px-4 pt-6" /></MobileShell>;
  }

  if (!user) {
    return (
      <MobileShell title="Post Item">
        <EmptyState
          icon={LogIn}
          title="Sign in to post an item"
          description="Ingia au fungua akaunti ya Seller / Breeder ili kuweka bidhaa."
          action={
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/auth">Log in / Sign up</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Post Item" subtitle="Weka bidhaa yako sokoni">
      <form onSubmit={handleSubmit} className="space-y-4 px-4 pt-4">
        <div className="surface-card p-3.5">
          <Label className="text-sm font-semibold">Photos & videos</Label>
          <p className="pb-2 pt-0.5 text-xs text-muted-foreground">
            Use your camera or pick real media from your gallery.
          </p>
          <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground">
            <Camera className="h-5 w-5" />
            <span className="text-xs font-medium">Add photos / videos</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            />
          </label>
          {files.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Field id="title" label="Title" required value={form.title} onChange={(v) => set("title", v)} placeholder="e.g. New Zealand White doe" />

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category_slug} onValueChange={(v) => set("category_slug", v)}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Field id="breed" label="Breed" value={form.breed} onChange={(v) => set("breed", v)} placeholder="e.g. Chinchilla, Flemish Giant" />

        <div className="grid grid-cols-2 gap-3">
          <Field id="quantity" label="Quantity" type="number" value={form.quantity} onChange={(v) => set("quantity", v)} />
          <Field id="price" label="Price (TZS)" type="number" required value={form.price_tzs} onChange={(v) => set("price_tzs", v)} placeholder="0" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Age, health records, delivery notes…"
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field id="region" label="Region" value={form.region} onChange={(v) => set("region", v)} placeholder="e.g. Mbeya" />
          <Field id="city" label="City / Ward" value={form.city} onChange={(v) => set("city", v)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            id="contact_phone"
            label="Call number"
            type="tel"
            value={form.contact_phone || profile?.phone || ""}
            onChange={(v) => set("contact_phone", v)}
            placeholder="+255…"
          />
          <Field id="whatsapp" label="WhatsApp" type="tel" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="+255…" />
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish listing"}
        </Button>
        <p className="pb-2 text-center text-xs text-muted-foreground">
          New listings appear in the marketplace once an admin approves them.
        </p>
      </form>
    </MobileShell>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl"
      />
    </div>
  );
}