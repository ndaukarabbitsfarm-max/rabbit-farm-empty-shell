import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { LANGUAGES, usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Mipangilio — Ndauka Farm" },
      { name: "description", content: "Chagua lugha na sarafu unayotumia kwenye soko la Ndauka Farm." },
      { property: "og:title", content: "Mipangilio — Ndauka Farm" },
      { property: "og:description", content: "Lugha na sarafu ya akaunti yako." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { lang, setLang, currency, setCurrency, t } = usePrefs();
  return (
    <MobileShell title="Settings" subtitle="Lugha na sarafu">
      <div className="space-y-4 p-4">
        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold">{t("language")}</h2>
          <div className="flex flex-wrap gap-2 pt-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  lang === l.code
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </section>
        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold">{t("currency")}</h2>
          <div className="flex flex-wrap gap-2 pt-2">
            {(["TZS", "KES", "UGX", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  currency === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}