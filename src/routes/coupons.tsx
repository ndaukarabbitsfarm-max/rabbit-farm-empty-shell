import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/coupons")({
  head: () => ({
    meta: [
      { title: "Kuponi Zangu — Ndauka Farm" },
      { name: "description", content: "Kuponi na punguzo lako la manunuzi ya jumla Ndauka Farm." },
      { property: "og:title", content: "Kuponi Zangu — Ndauka Farm" },
      { property: "og:description", content: "Kuponi na punguzo la manunuzi ya jumla." },
    ],
  }),
  component: () => (
    <MobileShell title="My Coupons" subtitle="Punguzo na kuponi">
      <EmptyState
        icon={Ticket}
        title="Kuponi zinakuja hivi karibuni."
        description="Bado hakuna kuponi zilizotolewa kwenye akaunti yako."
        action={
          <Button asChild className="rounded-xl">
            <Link to="/">Rudi sokoni</Link>
          </Button>
        }
      />
    </MobileShell>
  ),
});