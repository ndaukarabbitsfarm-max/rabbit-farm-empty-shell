import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { MobileShell, NotificationBell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tips")({
  head: () => ({
    meta: [
      { title: "Elimika — Ndauka Farm" },
      {
        name: "description",
        content: "Video na maelekezo ya ufugaji bora wa sungura, kuku, bata na njiwa Tanzania.",
      },
      { property: "og:title", content: "Elimika — Ndauka Farm" },
      { property: "og:description", content: "Maelekezo ya ufugaji bora wa mifugo." },
    ],
  }),
  component: TipsPage,
});

function TipsPage() {
  return (
    <MobileShell title="Elimika" subtitle="Video na maarifa ya ufugaji" right={<NotificationBell />}>
      <EmptyState
        icon={GraduationCap}
        title="Hakuna video za elimu bado."
        description="Maudhui ya mafunzo yatawekwa na wafugaji na wasimamizi wa soko."
        action={
          <Button asChild className="rounded-xl">
            <Link to="/">Rudi sokoni</Link>
          </Button>
        }
      />
    </MobileShell>
  );
}
