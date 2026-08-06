import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notifyUser } from "@/lib/push-client";

export const Route = createFileRoute("/admin_/kyc")({
  head: () => ({
    meta: [
      { title: "KYC Review — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Admin review of seller identity documents submitted for verification.",
      },
      { property: "og:title", content: "KYC Review — Ndauka Rabbits Farm Marketplace" },
      { property: "og:description", content: "Approve or reject seller verification documents." },
    ],
  }),
  component: AdminKycPage,
});

type Submission = {
  id: string;
  user_id: string;
  kind: "breeder" | "builder";
  id_document_path: string;
  farm_photo_paths: string[];
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  submitted_at: string;
};

function DocPreview({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void supabase.storage
      .from("kyc-documents")
      .createSignedUrl(path, 60 * 10)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  if (!url) return <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />;
  if (path.toLowerCase().endsWith(".pdf")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-xs font-medium underline">
        Fungua PDF ya kitambulisho
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img
        src={url}
        alt="Nyaraka ya kitambulisho iliyowasilishwa"
        className="h-44 w-full rounded-xl border border-border object-cover"
        loading="lazy"
      />
    </a>
  );
}

function AdminKycPage() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});

  const { data } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-kyc"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids)
        : { data: [] };
      return (rows ?? []).map((r) => ({
        ...(r as unknown as Submission),
        profile: (profiles ?? []).find((p) => p.id === r.user_id) ?? null,
      }));
    },
  });

  const review = useMutation({
    mutationFn: async ({
      row,
      approve,
    }: {
      row: Submission & { profile: { full_name: string | null } | null };
      approve: boolean;
    }) => {
      const notes = approve ? null : (reason[row.id] ?? "").trim() || "Nyaraka hazikukidhi vigezo";
      const { error } = await supabase
        .from("kyc_submissions")
        .update({
          status: approve ? "approved" : "rejected",
          notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;

      if (approve) {
        const { error: pErr } = await supabase
          .from("profiles")
          .update({ verified: true, verification_kind: row.kind, approved: true })
          .eq("id", row.user_id);
        if (pErr) throw pErr;
      }

      notifyUser({
        userId: row.user_id,
        kind: "kyc",
        title: approve ? "Uthibitisho umekamilika" : "Nyaraka zimekataliwa",
        body: approve
          ? `Umepata beji ya ${row.kind === "builder" ? "Verified Builder ✔️" : "Verified Breeder ✔️"}.`
          : `Sababu: ${notes}`,
        link: "/profile",
      });
    },
    onSuccess: () => {
      toast.success("KYC imesasishwa");
      void qc.invalidateQueries({ queryKey: ["admin-kyc"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <MobileShell title="KYC Review" />;

  if (!isAdmin) {
    return (
      <MobileShell title="KYC Review">
        <EmptyState
          icon={ShieldAlert}
          title="Admins only"
          description="Ukurasa huu unaonekana kwa wasimamizi pekee."
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="KYC Review" subtitle="Nyaraka zinazosubiri ukaguzi">
      <div className="space-y-3 px-4 pt-4">
        {data && data.length > 0 ? (
          data.map((row) => (
            <article key={row.id} className="surface-card space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{row.profile?.full_name ?? "Muuzaji"}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {row.kind === "builder" ? "Builder" : "Breeder"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {row.profile?.phone ?? ""} · {new Date(row.submitted_at).toLocaleDateString()}
              </p>

              <DocPreview path={row.id_document_path} />
              {row.farm_photo_paths?.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {row.farm_photo_paths.map((p) => (
                    <DocPreview key={p} path={p} />
                  ))}
                </div>
              ) : null}

              <Input
                value={reason[row.id] ?? ""}
                onChange={(e) => setReason((s) => ({ ...s, [row.id]: e.target.value }))}
                placeholder="Sababu ya kukataa (hiari)"
                aria-label="Sababu ya kukataa"
                className="h-11 rounded-xl"
              />
              <div className="flex gap-2">
                <Button
                  className="h-11 flex-1 rounded-xl"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ row, approve: true })}
                >
                  <Check className="mr-2 h-4 w-4" /> Idhinisha
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ row, approve: false })}
                >
                  <X className="mr-2 h-4 w-4" /> Kataa
                </Button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            icon={Inbox}
            title="Hakuna KYC inayosubiri"
            description="Nyaraka mpya zitaonekana hapa mara zitakapowasilishwa."
          />
        )}
        <p className="flex items-center gap-1.5 pb-4 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Nyaraka hufunguliwa kwa muda mfupi kwa usalama.
        </p>
      </div>
    </MobileShell>
  );
}
