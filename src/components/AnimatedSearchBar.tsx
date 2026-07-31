import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Sungura Flemish Giant",
  "Bata",
  "Kuku wa Mayai",
  "Njiwa",
  "Mabanda ya Ghorofa",
  "Chakula cha Sungura",
];

export function AnimatedSearchBar({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fade = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % SUGGESTIONS.length);
        setVisible(true);
      }, 400);
    }, 2600);
    return () => clearInterval(fade);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Tafuta bidhaa"
        className="h-11 w-full rounded-full border-0 bg-card pl-10 pr-24 text-sm shadow-sm outline-none ring-0 focus:ring-2 focus:ring-primary/30"
      />
      {value ? null : (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 truncate pr-24 text-sm text-muted-foreground transition-opacity duration-400",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          {SUGGESTIONS[index]}
        </span>
      )}
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
        Tafuta
      </span>
    </div>
  );
}
