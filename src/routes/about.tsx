import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Kuhusu TRBA" },
      { name: "description", content: "TRBA ni soko la kidijitali la B2B la mifugo, mabanda na chakula cha mifugo." },
      { property: "og:title", content: "Kuhusu TRBA" },
      { property: "og:description", content: "Soko la B2B la mifugo, mabanda na chakula cha mifugo." },
    ],
  }),
  component: () => (
    <MobileShell title="About" subtitle="Kuhusu TRBA">
      <div className="space-y-3 p-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          TRBA ni jukwaa la B2B linalounganisha wafugaji, wajenzi wa mabanda na wauzaji wa chakula cha
          mifugo na wanunuzi wa jumla.
        </p>
        <p className="text-xs">Toleo 1.0</p>
      </div>
    </MobileShell>
  ),
});