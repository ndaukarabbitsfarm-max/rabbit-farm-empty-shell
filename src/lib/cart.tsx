import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CartItem = {
  productId: string;
  sellerId: string;
  title: string;
  priceTzs: number;
  quantity: number;
  mediaPath: string | null;
};

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  clearSeller: (sellerId: string) => void;
};

const STORAGE_KEY = "ndauka-cart-v1";
const CartContext = createContext<CartValue | undefined>(undefined);

/**
 * Cart is persisted server-side in `cart_items` for signed-in users so it
 * follows them across devices, and in localStorage for guests.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore malformed cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || user) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated, user]);

  const loadRemote = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("cart_items")
      .select("product_id, seller_id, quantity, products(title, price_tzs, media_urls)")
      .eq("user_id", uid);
    if (!data) return;
    setItems(
      data.map((row) => {
        const p = row.products as
          | { title: string; price_tzs: number; media_urls: string[] | null }
          | null;
        return {
          productId: row.product_id,
          sellerId: row.seller_id,
          title: p?.title ?? "Bidhaa",
          priceTzs: Number(p?.price_tzs ?? 0),
          quantity: row.quantity,
          mediaPath: p?.media_urls?.[0] ?? null,
        };
      }),
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadRemote(user.id);
  }, [user, loadRemote]);

  const value = useMemo<CartValue>(() => {
    const uid = user?.id ?? null;

    async function upsertRemote(item: CartItem) {
      if (!uid) return;
      await supabase.from("cart_items").upsert(
        {
          user_id: uid,
          product_id: item.productId,
          seller_id: item.sellerId,
          quantity: item.quantity,
        },
        { onConflict: "user_id,product_id" },
      );
    }

    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.quantity * i.priceTzs, 0),
      add: (item, quantity = 1) => {
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === item.productId);
          const next = existing
            ? prev.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
              )
            : [...prev, { ...item, quantity }];
          const changed = next.find((i) => i.productId === item.productId);
          if (changed) void upsertRemote(changed);
          return next;
        });
      },
      setQuantity: (productId, quantity) => {
        setItems((prev) => {
          const next = prev.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i,
          );
          const changed = next.find((i) => i.productId === productId);
          if (changed) void upsertRemote(changed);
          return next;
        });
      },
      remove: (productId) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
        if (uid) {
          void supabase.from("cart_items").delete().eq("user_id", uid).eq("product_id", productId);
        }
      },
      clear: () => {
        setItems([]);
        if (uid) void supabase.from("cart_items").delete().eq("user_id", uid);
      },
      clearSeller: (sellerId) => {
        setItems((prev) => prev.filter((i) => i.sellerId !== sellerId));
        if (uid) {
          void supabase.from("cart_items").delete().eq("user_id", uid).eq("seller_id", sellerId);
        }
      },
    };
  }, [items, user]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
