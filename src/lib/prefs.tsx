import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "sw" | "en";
export type CurrencyCode = "TZS" | "KES" | "UGX" | "USD";

export const CURRENCIES: { code: CurrencyCode; label: string; rate: number }[] = [
  { code: "TZS", label: "Tanzania Shilling (TZS)", rate: 1 },
  { code: "KES", label: "Kenyan Shilling (KES)", rate: 0.055 },
  { code: "UGX", label: "Ugandan Shilling (UGX)", rate: 1.53 },
  { code: "USD", label: "US Dollar (USD)", rate: 0.00038 },
];

const STRINGS = {
  myAccount: { sw: "Akaunti Yangu", en: "My Account" },
  manageOrders: { sw: "Dhibiti Oda", en: "Manage Orders" },
  messenger: { sw: "Messenger", en: "Messenger" },
  shoppingCart: { sw: "Kikapu / Oda Zangu", en: "Shopping Cart" },
  favorites: { sw: "Vipendwa Vyangu", en: "My Favorites" },
  coupons: { sw: "Kuponi Zangu", en: "My Coupons" },
  howToSell: { sw: "Jinsi ya Kuuza Ndauka Farm", en: "How to Sell on Ndauka Farm" },
  help: { sw: "Kituo cha Msaada", en: "Help Center" },
  regionCurrency: { sw: "Nchi, Sarafu na Lugha", en: "Country/Region, Currency & Language" },
  settings: { sw: "Mipangilio", en: "Setting" },
  about: { sw: "Kuhusu Ndauka Farm", en: "About Ndauka Farm" },
  language: { sw: "Lugha", en: "Language" },
  currency: { sw: "Sarafu", en: "Currency" },
  safetyTitle: { sw: "Nunua kwa uhakika", en: "Shop with confidence" },
  safetyBody: {
    sw: "🛡️ Vidokezo vya Usalama — Kagua mifugo au mabanda ana kwa ana kabla ya kulipa. Ndauka Farm haishikilii fedha zako.",
    en: "🛡️ Buyer Safety Tips — Inspect livestock or cages in person before paying. Ndauka Farm does not hold your funds.",
  },
  wantToSell: { sw: "Unataka kuuza? Badilisha uwe Seller", en: "Want to sell? Switch to Seller" },
} as const;

export type StringKey = keyof typeof STRINGS;

type PrefsValue = {
  lang: Lang;
  currency: CurrencyCode;
  setLang: (l: Lang) => void;
  setCurrency: (c: CurrencyCode) => void;
  t: (key: StringKey) => string;
  formatMoney: (tzs: number) => string;
};

const PrefsContext = createContext<PrefsValue | undefined>(undefined);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sw");
  const [currency, setCurrencyState] = useState<CurrencyCode>("TZS");

  useEffect(() => {
    try {
      const l = window.localStorage.getItem("ndauka-lang") as Lang | null;
      const c = window.localStorage.getItem("ndauka-currency") as CurrencyCode | null;
      if (l === "sw" || l === "en") setLangState(l);
      if (c && CURRENCIES.some((x) => x.code === c)) setCurrencyState(c);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<PrefsValue>(
    () => ({
      lang,
      currency,
      setLang: (l) => {
        setLangState(l);
        try {
          window.localStorage.setItem("ndauka-lang", l);
        } catch {
          /* ignore */
        }
      },
      setCurrency: (c) => {
        setCurrencyState(c);
        try {
          window.localStorage.setItem("ndauka-currency", c);
        } catch {
          /* ignore */
        }
      },
      t: (key) => STRINGS[key][lang],
      formatMoney: (tzs) => {
        const rate = CURRENCIES.find((c) => c.code === currency)?.rate ?? 1;
        const raw = tzs * rate;
        const amount = currency === "USD" ? Math.round(raw * 100) / 100 : Math.round(raw);
        return `${currency} ${amount.toLocaleString("en-US")}`;
      },
    }),
    [lang, currency],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}