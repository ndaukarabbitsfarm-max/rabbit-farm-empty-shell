import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, PlusCircle, ClipboardList, User, MessageSquare } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/post", label: "Post Item", icon: PlusCircle },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function CartButton() {
  const { count } = useCart();
  return (
    <Link
      to="/cart"
      aria-label="Open cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground"
    >
      <ShoppingCart className="h-[18px] w-[18px]" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[30rem] border-t border-border bg-card/95 backdrop-blur"
      style={{ boxShadow: "var(--shadow-nav)" }}
    >
      <ul className="flex items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom,0px)] pt-1.5">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const isPost = to === "/post";
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isPost && "brand-surface -mt-4 h-11 w-11 shadow-lg",
                    !isPost && active && "bg-accent",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", isPost && "h-6 w-6")} strokeWidth={2} />
                </span>
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileShell({
  children,
  title,
  subtitle,
  right,
  hideNav,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="app-shell relative flex flex-col">
      {title ? (
        <header className="safe-top sticky top-0 z-30 border-b border-border bg-background/90 px-4 pb-3 pt-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {right}
          </div>
        </header>
      ) : null}
      <main className={cn("flex-1", hideNav ? "pb-8" : "safe-bottom")}>{children}</main>
      {hideNav ? null : <BottomNav />}
    </div>
  );
}