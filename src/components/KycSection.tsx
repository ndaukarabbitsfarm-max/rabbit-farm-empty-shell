import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { safeFileName } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABEL = {
  pending: "Inasubiri ukaguzi",
  approved: "Imethibitishwa",
  rejected: "Imekataliwa",
} as const;

export function KycSection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [kind, setKind] = useState<"breeder" | "builder">("breeder");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: submission } = useQuery({
    enabled: Boolean(user),
    queryKey: ["kyc", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", user!.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !idFile) {
      toast.error("Pakia nakala ya NIDA au leseni");
      return;
    }
    setBusy(true);
    try {
      const base = `${user.id}/${Date.now()}`;
      const idPath = `${base}-id-${safeFileName(idFile.name)}`;
      const up = await supabase.storage
        .from("kyc-documents")
        .upload(idPath, idFile, { contentType: idFile.type || undefined });
      if (up.error) throw up.error;

      const photoPaths: string[] = [];
      for (const file of Array.from(photos ?? [])) {
        const p = `${base}-farm-${safeFileName(file.name)}`;
        const r = await supabase.storage
          .from("kyc-documents")
          .upload(p, file, { contentType: file.type || undefined });
        if (r.error) throw r.error;
        photoPaths.push(p);
      }

      const { error } = await supabase.from("kyc_submissions").insert({
        user_id: user.id,
        kind,
        id_document_path: idPath,
        farm_photo_paths: photoPaths,
      });
      if (error) throw error;
      toast.success("Nyaraka zimetumwa kwa ukaguzi");
      setIdFile(null);
      setPhotos(null);
      await qc.invalidateQueries({ queryKey: ["kyc", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Imeshindikana kupakia");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface-card space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" /> Uthibitisho (KYC)
        </h3>
        {submission ? (
          <Badge variant={submission.status === "approved" ? "default" : "outline"} className="text-[10px]">
            {STATUS_LABEL[submission.status]}
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Nyaraka zako (NIDA / leseni) huhifadhiwa kwa siri na huonwa na wasimamizi pekee.{" "}
        <a href="/privacy" className="underline">
          Privacy Notice
        </a>
      </p>

      {submission?.status === "approved" ? (
        <p className="text-xs font-medium text-primary">
          {submission.kind === "builder" ? "Verified Builder ✔️" : "Verified Breeder ✔️"}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            {(["breeder", "builder"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  kind === k
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {k === "breeder" ? "Mfugaji (Breeder)" : "Mjenzi wa Mabanda (Builder)"}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kyc-id">Nakala ya NIDA / Leseni</Label>
            <Input
              id="kyc-id"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kyc-photos">Picha za shamba / banda (hiari)</Label>
            <Input
              id="kyc-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(e.target.files)}
              className="h-11 rounded-xl"
            />
          </div>
          <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Tuma nyaraka
              </>
            )}
          </Button>
        </form>
      )}
    </section>
  );
}