import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Msaada — Ndauka Farm" },
      { name: "description", content: "Maswali yanayoulizwa mara kwa mara na njia za kupata msaada Ndauka Farm." },
      { property: "og:title", content: "Msaada — Ndauka Farm" },
      { property: "og:description", content: "Maswali na msaada kwa wanunuzi na wafugaji." },
    ],
  }),
  component: () => (
    <MobileShell title="Help Center" subtitle="Maswali na msaada">
      <div className="space-y-3 p-4">
        {[
          ["Nawezaje kuagiza kwa jumla?", "Tumia RFQ kuomba nukuu ya bei kwa oda kubwa au maalum."],
          ["Malipo yanafanyikaje?", "Malipo ni ya moja kwa moja kwa muuzaji baada ya oda kukubaliwa."],
          ["Nimekutana na muuzaji wa kutiliwa shaka.", "Tumia kitufe cha 'Report' kwenye wasifu au mazungumzo."],
        ].map(([q, a]) => (
          <div key={q} className="surface-card p-4">
            <p className="text-sm font-semibold">{q}</p>
            <p className="pt-1 text-xs text-muted-foreground">{a}</p>
          </div>
        ))}
      </div>
    </MobileShell>
  ),
});