import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { PhoneInput } from "@/components/PhoneInput";
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

export const Route = createFileRoute("/rfq")({
  head: () => ({
    meta: [
      { title: "Omba Nukuu ya Bei (RFQ) — Ndauka Farm" },
      {
        name: "description",
        content:
          "Omba nukuu ya bei kwa mabanda ya vipimo maalum au mifugo ya jumla kutoka kwa wafugaji wa Ndauka Farm.",
      },
      { property: "og:title", content: "Omba Nukuu ya Bei (RFQ) — Ndauka Farm" },
      { property: "og:description", content: "Fomu ya maombi ya bei maalum kwa oda za jumla." },
    ],
  }),
  component: RfqPage,
});

function RfqPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("+255");
  const [form, setForm] = useState({
    title: "",
    category_slug: "",
    quantity: "1",
    unit: "piece",
    target_price_tzs: "",
    region: "",
    phone: "",
    details: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("rfq_requests").insert({
        buyer_id: user.id,
        title: form.title,
        category_slug: form.category_slug || "custom-cages",
        quantity: Number(form.quantity) || 1,
        unit: form.unit,
        target_price_tzs: form.target_price_tzs ? Number(form.target_price_tzs) : null,
        region: form.region || null,
        contact_phone: `${code}${form.phone}`,
        details: form.details || null,
      });
      if (error) throw error;
      toast.success("Ombi lako limetumwa. Wafugaji watawasiliana nawe.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Imeshindikana kutuma ombi");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <MobileShell title="Omba Nukuu ya Bei">
        <EmptyState
          icon={FileText}
          title="Ingia ili kutuma RFQ"
          description="Unahitaji akaunti ili kuomba bei maalum ya jumla."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/auth">Ingia</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Omba Nukuu ya Bei (RFQ)" subtitle="Mabanda maalum au oda ya jumla">
      <form onSubmit={submit} className="space-y-3.5 px-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="rfq-title">Unachohitaji</Label>
          <Input
            id="rfq-title"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Mfano: Banda la ghorofa vyumba 12"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Kundi</Label>
          <Select value={form.category_slug} onValueChange={(v) => set("category_slug", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Chagua kundi" />
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

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="rfq-qty">Idadi</Label>
            <Input
              id="rfq-qty"
              inputMode="numeric"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rfq-unit">Kipimo</Label>
            <Input
              id="rfq-unit"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              placeholder="piece / kg / set"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rfq-price">Bei unayotarajia (TZS)</Label>
          <Input
            id="rfq-price"
            inputMode="numeric"
            value={form.target_price_tzs}
            onChange={(e) => set("target_price_tzs", e.target.value)}
            placeholder="Hiari"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rfq-region">Mkoa</Label>
          <Input
            id="rfq-region"
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            placeholder="Mfano: Njombe"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rfq-phone">Namba ya simu</Label>
          <PhoneInput
            id="rfq-phone"
            required
            code={code}
            onCodeChange={setCode}
            value={form.phone}
            onValueChange={(v) => set("phone", v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rfq-details">Maelezo / vipimo</Label>
          <Textarea
            id="rfq-details"
            rows={4}
            value={form.details}
            onChange={(e) => set("details", e.target.value)}
            placeholder="Eleza vipimo, muda wa kupokea, na mahitaji mengine."
          />
        </div>

        <Button type="submit" className="h-11 w-full rounded-xl" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tuma ombi la bei"}
        </Button>
      </form>
    </MobileShell>
  );
}
