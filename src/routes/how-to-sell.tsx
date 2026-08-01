import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-to-sell")({
  head: () => ({
    meta: [
      { title: "Jinsi ya Kuuza — Ndauka Farm" },
      {
        name: "description",
        content: "Hatua za kuwa muuzaji aliyethibitishwa Ndauka Farm: sajili, thibitisha KYC, weka bidhaa.",
      },
      { property: "og:title", content: "Jinsi ya Kuuza — Ndauka Farm" },
      { property: "og:description", content: "Hatua za kuwa muuzaji aliyethibitishwa." },
    ],
  }),
  component: HowToSell,
});

const STEPS = [
  { t: "1. Fungua akaunti", d: "Jisajili kwa namba yako ya simu au barua pepe." },
  { t: "2. Badilisha wasifu kuwa Seller", d: "Nenda My Alibaba kisha gusa 'Want to sell?'" },
  { t: "3. Thibitisha KYC", d: "Pakia NIDA au leseni ya biashara na picha za banda lako." },
  { t: "4. Weka bidhaa", d: "Tumia kitufe cha '+' kuweka mifugo, mabanda au chakula na bei ya jumla (MOQ)." },
  { t: "5. Jibu maswali", d: "Wasiliana na wanunuzi kupitia Messenger na jibu RFQ haraka." },
];

function HowToSell() {
  return (
    <MobileShell title="How to Sell" subtitle="Kuwa muuzaji aliyethibitishwa">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 rounded-2xl bg-accent p-4 text-accent-foreground">
          <BadgeCheck className="h-8 w-8" />
          <p className="text-sm font-semibold">Wafugaji waliothibitishwa huuza mara 3 zaidi.</p>
        </div>
        {STEPS.map((s) => (
          <div key={s.t} className="surface-card p-4">
            <p className="text-sm font-bold">{s.t}</p>
            <p className="pt-1 text-xs text-muted-foreground">{s.d}</p>
          </div>
        ))}
        <Button asChild className="h-11 w-full rounded-xl">
          <Link to="/profile">Anza sasa</Link>
        </Button>
      </div>
    </MobileShell>
  );
}