import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function ProfileMenuRow({
  to,
  icon: Icon,
  label,
  dot,
  value,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  dot?: boolean;
  value?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 last:border-b-0 active:bg-muted/60"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="h-[18px] w-[18px]" />
        {dot ? (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
        ) : null}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value ? <span className="text-xs text-muted-foreground">{value}</span> : null}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}