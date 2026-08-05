import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Sparkles, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/ai.functions";
import { formatTzs } from "@/lib/marketplace";

type AssistantProduct = {
  id: string;
  title: string;
  price_tzs: number | null;
  region: string | null;
  city: string | null;
  moq: number | null;
};

type Turn = { role: "user" | "assistant"; text: string; products?: AssistantProduct[] };

const EXAMPLES = [
  "Nataka sungura wa Flemish Giant chini ya TZS 50,000 karibu na Mbeya",
  "Ninawezaje kuagiza kwa jumla?",
  "How does payment work?",
];

export function AiAssistantSheet({ onClose }: { onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setTurns((t) => [...t, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await askAssistant({ data: { question } });
      setTurns((t) => [
        ...t,
        { role: "assistant", text: res.reply, products: res.products as AssistantProduct[] },
      ]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "assistant", text: "Samahani, imeshindikana kujibu kwa sasa. Jaribu tena." },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: 1e6, behavior: "smooth" }));
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <button type="button" aria-label="Funga AI" onClick={onClose} className="flex-1 bg-black/40" />
      <div className="flex max-h-[82vh] flex-col rounded-t-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-primary" /> AI Mode
          </span>
          <button type="button" onClick={onClose} aria-label="Funga">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {turns.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Uliza chochote kuhusu bidhaa au jinsi soko linavyofanya kazi. / Ask anything.
              </p>
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => void ask(e)}
                  className="block w-full rounded-xl border border-border px-3 py-2 text-left text-xs"
                >
                  {e}
                </button>
              ))}
            </div>
          ) : null}

          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  t.role === "user"
                    ? "max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                    : "max-w-full space-y-2"
                }
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{t.text}</p>
                {t.products?.length ? (
                  <ul className="space-y-2">
                    {t.products.map((p) => (
                      <li key={p.id}>
                        <Link
                          to="/product/$id"
                          params={{ id: p.id }}
                          onClick={onClose}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold">{p.title}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              {[p.city, p.region].filter(Boolean).join(", ") || "—"}
                              {p.moq ? ` · MOQ ${p.moq}` : ""}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-bold text-primary">
                            {p.price_tzs != null ? formatTzs(p.price_tzs) : "—"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
          {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
          className="safe-bottom flex items-center gap-2 border-t border-border px-3 py-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Uliza swali lako…"
            aria-label="Swali kwa AI"
            className="h-11 rounded-xl"
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-xl" disabled={busy}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AiModeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 text-xs font-bold text-primary"
      aria-label="Fungua AI Mode"
    >
      <Sparkles className="h-4 w-4" /> AI
    </button>
  );
}
