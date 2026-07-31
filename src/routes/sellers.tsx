import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, BadgeCheck, MapPin } from "lucide-react";
import { MobileShell, TopTabs, NotificationBell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sellers")({
  head: () => ({
    meta: [
      { title: "Wafugaji — Ndauka Farm" },
      {
        name: "description",
        content: "Orodha ya wafugaji na wauzaji walioidhinishwa kwenye soko la Ndauka Farm.",
      },
      { property: "og:title", content: "Wafugaji — Ndauka Farm" },
      { property: "og:description", content: "Wafugaji walioidhinishwa na wenye beji ya uaminifu." },
    ],
  }),
  component: SellersPage,
});

function SellersPage() {
  const { data: sellers, isLoading } = useQuery({
    queryKey: ["sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, region, city, verified, approved")
        .eq("role", "seller")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data;
    },
  });

  return (
    <MobileShell>
      <div className="brand-surface safe-top px-3 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-extrabold">Ndauka Farm</h1>
          <NotificationBell onBrand />
        </div>
        <div className="pt-3">
          <TopTabs active="/sellers" />
        </div>
      </div>

      <div className="space-y-2 px-3 pt-3">
        {isLoading ? null : sellers && sellers.length > 0 ? (
          sellers.map((s) => (
            <div key={s.id} className="surface-card flex items-center gap-3 p-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {(s.full_name ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-sm font-semibold">
                  <span className="truncate">{s.full_name ?? "Mfugaji"}</span>
                  {s.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-primary" /> : null}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {[s.city, s.region].filter(Boolean).join(", ") || "Tanzania"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Users}
            title="Hakuna wafugaji walioidhinishwa bado."
            description="Wafugaji watakaojisajili na kuidhinishwa wataonekana hapa."
          />
        )}
        <p className="pt-2 text-center text-xs text-muted-foreground">
          <Link to="/auth" className="underline underline-offset-4">
            Jisajili kama mfugaji
          </Link>
        </p>
      </div>
    </MobileShell>
  );
}
