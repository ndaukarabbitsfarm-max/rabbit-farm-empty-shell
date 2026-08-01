import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — Ndauka Farm" },
      { name: "description", content: "Jinsi Ndauka Farm inavyohifadhi nyaraka zako za NIDA, leseni na taarifa binafsi." },
      { property: "og:title", content: "Privacy Notice — Ndauka Farm" },
      { property: "og:description", content: "Usiri wa nyaraka za KYC na taarifa binafsi." },
    ],
  }),
  component: () => (
    <MobileShell title="Privacy Notice" subtitle="Usiri wa taarifa zako">
      <div className="space-y-3 p-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Nyaraka za uthibitisho (NIDA, leseni, picha za shamba) huhifadhiwa kwenye hifadhi ya siri (private
          bucket) na husomwa na wasimamizi wa Ndauka Farm pekee kwa lengo la uhakiki.
        </p>
        <p>Hatushiriki nyaraka hizi na wanunuzi, wauzaji wengine, au watu wa tatu.</p>
        <p>Namba ya simu na WhatsApp huonekana kwa mnunuzi baada tu ya oda kukubaliwa.</p>
        <p>Unaweza kuomba kufuta nyaraka zako wakati wowote kupitia ukurasa wa Msaada.</p>
      </div>
    </MobileShell>
  ),
});