import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  GraduationCap,
  MessageCircle,
  ShoppingCart,
  User,
  Bell,
  Plus,
  Package,
  Film,
  Camera,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import { CreateMediaDialog, type MediaKind } from "@/components/CreateMediaDialog";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tips", label: "Tips", icon: GraduationCap },
  { to: "/messages", label: "Messenger", icon: MessageCircle },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/profile", label: "Akaunti Yangu", icon: User },
] as const;

export const TOP_TABS = [
  { to: "/", label: "Bidhaa Zote" },
  { to: "/sellers", label: "Wafugaji" },
  { to: "/categories", label: "Masoko" },
] as const;

export function TopTabs({ active }: { active: string }) {
  return (
    <nav aria-label="Sehemu za soko" className="flex items-center gap-5 text-sm">
      {TOP_TABS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={cn(
            "relative pb-1 font-semibold transition-opacity",
            active === t.to ? "opacity-100" : "opacity-70",
          )}
        >
          {t.label}
          {active === t.to ? (
            <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-current" />
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

export function CartButton() {
  const { count } = useCart();
  return (
    <Link
      to="/cart"
      aria-label="Fungua kikapu"
      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15"
    >
      <ShoppingCart className="h-[18px] w-[18px]" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function NotificationBell({ onBrand }: { onBrand?: boolean }) {
  const { unread } = useNotifications();
  return (
    <Link
      to="/notifications"
      aria-label="Taarifa"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full",
        onBrand ? "bg-primary-foreground/15" : "bg-accent text-accent-foreground",
      )}
    >
      <Bell className="h-[18px] w-[18px]" />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

export function PostItemFab() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<MediaKind | null>(null);

  if (pathname.startsWith("/post") || pathname.startsWith("/auth")) return null;

  const isSeller = profile?.role === "seller";

  // Buyers never see the floating button; their Profile page shows a
  // "Want to sell? Switch to Seller" link instead.
  if (user && !isSeller) return null;

  function handleClick() {
    if (!user) {
      toast.info("Ingia kwenye akaunti yako ili kuweka bidhaa", {
        action: { label: "Ingia", onClick: () => navigate({ to: "/auth" }) },
      });
      return;
    }
    setOpen((v) => !v);
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Funga menyu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/30"
        />
      ) : null}
      {open ? (
        <div className="fixed bottom-36 right-4 z-40 w-44 overflow-hidden rounded-2xl bg-card shadow-lg">
          {(
            [
              { key: "post", label: "Post — Bidhaa", icon: Package },
              { key: "reel", label: "Reel — Video", icon: Film },
              { key: "story", label: "Story — Saa 24", icon: Camera },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setOpen(false);
                if (key === "post") navigate({ to: "/post" });
                else setDialog(key);
              }}
              className="flex w-full items-center gap-2.5 border-b border-border/70 px-3 py-3 text-left text-sm font-medium last:border-b-0 active:bg-muted/60"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        aria-label={open ? "Funga menyu ya kuweka" : "Weka bidhaa, reel au story"}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        {open ? <X className="h-7 w-7" strokeWidth={2.6} /> : <Plus className="h-7 w-7" strokeWidth={2.6} />}
      </button>
      <CreateMediaDialog
        kind={dialog}
        open={dialog !== null}
        onOpenChange={(v) => (v ? null : setDialog(null))}
      />
    </>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[30rem] border-t border-border bg-card/95 backdrop-blur"
      style={{ boxShadow: "var(--shadow-nav)" }}
    >
      <ul className="flex items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom,0px)] pt-1.5">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                  {to === "/cart" && count > 0 ? (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {count}
                    </span>
                  ) : null}
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
      {hideNav ? null : (
        <>
          <PostItemFab />
          <BottomNav />
        </>
      )}
    </div>
  );
}
