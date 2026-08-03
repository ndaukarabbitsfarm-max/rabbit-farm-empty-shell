import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "sw", label: "Kiswahili", native: "Kiswahili", rtl: false },
  { code: "en", label: "English", native: "English", rtl: false },
  { code: "fr", label: "French", native: "Français", rtl: false },
  { code: "ar", label: "Arabic", native: "العربية", rtl: true },
  { code: "pt", label: "Portuguese", native: "Português", rtl: false },
  { code: "es", label: "Spanish", native: "Español", rtl: false },
  { code: "zh", label: "Chinese", native: "中文", rtl: false },
  { code: "hi", label: "Hindi", native: "हिन्दी", rtl: false },
  { code: "am", label: "Amharic", native: "አማርኛ", rtl: false },
  { code: "rw", label: "Kinyarwanda", native: "Kinyarwanda", rtl: false },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];
export type CurrencyCode = "TZS" | "KES" | "UGX" | "USD";

export const CURRENCIES: { code: CurrencyCode; label: string; rate: number }[] = [
  { code: "TZS", label: "Tanzania Shilling (TZS)", rate: 1 },
  { code: "KES", label: "Kenyan Shilling (KES)", rate: 0.055 },
  { code: "UGX", label: "Ugandan Shilling (UGX)", rate: 1.53 },
  { code: "USD", label: "US Dollar (USD)", rate: 0.00038 },
];

type Entry = Partial<Record<Lang, string>> & { en: string };

const STRINGS = {
  myAccount: {
    en: "My Account", sw: "Akaunti Yangu", fr: "Mon compte", ar: "حسابي",
    pt: "Minha conta", es: "Mi cuenta", zh: "我的账户", hi: "मेरा खाता",
    am: "መለያዬ", rw: "Konti yanjye",
  },
  manageOrders: {
    en: "Manage Orders", sw: "Dhibiti Oda", fr: "Gérer les commandes", ar: "إدارة الطلبات",
    pt: "Gerir pedidos", es: "Gestionar pedidos", zh: "管理订单", hi: "ऑर्डर प्रबंधित करें",
    am: "ትዕዛዞችን አስተዳድር", rw: "Gucunga ibicuruzwa byatumijwe",
  },
  messenger: {
    en: "Messenger", sw: "Messenger", fr: "Messagerie", ar: "المراسلة",
    pt: "Mensagens", es: "Mensajes", zh: "消息", hi: "संदेश", am: "መልእክቶች", rw: "Ubutumwa",
  },
  shoppingCart: {
    en: "Shopping Cart", sw: "Kikapu / Oda Zangu", fr: "Panier", ar: "سلة التسوق",
    pt: "Carrinho", es: "Carrito", zh: "购物车", hi: "कार्ट", am: "የግዢ ጋሪ", rw: "Agatebo",
  },
  favorites: {
    en: "My Favorites", sw: "Vipendwa Vyangu", fr: "Mes favoris", ar: "المفضلة",
    pt: "Favoritos", es: "Favoritos", zh: "我的收藏", hi: "पसंदीदा", am: "ተወዳጆቼ", rw: "Ibyo nkunda",
  },
  coupons: {
    en: "My Coupons", sw: "Kuponi Zangu", fr: "Mes coupons", ar: "قسائمي",
    pt: "Meus cupões", es: "Mis cupones", zh: "我的优惠券", hi: "मेरे कूपन", am: "ኩፖኖቼ", rw: "Za kuponi zanjye",
  },
  howToSell: {
    en: "How to Sell on Ndauka Farm", sw: "Jinsi ya Kuuza Ndauka Farm",
    fr: "Comment vendre sur Ndauka Farm", ar: "كيف تبيع على Ndauka Farm",
    pt: "Como vender na Ndauka Farm", es: "Cómo vender en Ndauka Farm",
    zh: "如何在 Ndauka Farm 销售", hi: "Ndauka Farm पर कैसे बेचें",
    am: "በNdauka Farm እንዴት መሸጥ", rw: "Uko wagurisha kuri Ndauka Farm",
  },
  help: {
    en: "Help Center", sw: "Kituo cha Msaada", fr: "Centre d'aide", ar: "مركز المساعدة",
    pt: "Centro de ajuda", es: "Centro de ayuda", zh: "帮助中心", hi: "सहायता केंद्र",
    am: "የእገዛ ማዕከል", rw: "Ikigo cy'ubufasha",
  },
  regionCurrency: {
    en: "Country/Region, Currency & Language", sw: "Nchi, Sarafu na Lugha",
    fr: "Pays, devise et langue", ar: "الدولة والعملة واللغة",
    pt: "País, moeda e idioma", es: "País, moneda e idioma",
    zh: "国家/地区、货币和语言", hi: "देश, मुद्रा और भाषा",
    am: "ሀገር፣ ገንዘብ እና ቋንቋ", rw: "Igihugu, ifaranga n'ururimi",
  },
  settings: {
    en: "Settings", sw: "Mipangilio", fr: "Paramètres", ar: "الإعدادات",
    pt: "Definições", es: "Ajustes", zh: "设置", hi: "सेटिंग्स", am: "ቅንብሮች", rw: "Igenamiterere",
  },
  about: {
    en: "About Ndauka Farm", sw: "Kuhusu Ndauka Farm", fr: "À propos de Ndauka Farm",
    ar: "حول Ndauka Farm", pt: "Sobre a Ndauka Farm", es: "Sobre Ndauka Farm",
    zh: "关于 Ndauka Farm", hi: "Ndauka Farm के बारे में", am: "ስለ Ndauka Farm", rw: "Ibyerekeye Ndauka Farm",
  },
  language: {
    en: "Language", sw: "Lugha", fr: "Langue", ar: "اللغة", pt: "Idioma", es: "Idioma",
    zh: "语言", hi: "भाषा", am: "ቋንቋ", rw: "Ururimi",
  },
  currency: {
    en: "Currency", sw: "Sarafu", fr: "Devise", ar: "العملة", pt: "Moeda", es: "Moneda",
    zh: "货币", hi: "मुद्रा", am: "ገንዘብ", rw: "Ifaranga",
  },
  safetyTitle: {
    en: "Shop with confidence", sw: "Nunua kwa uhakika", fr: "Achetez en confiance",
    ar: "تسوق بثقة", pt: "Compre com confiança", es: "Compra con confianza",
    zh: "安心购买", hi: "भरोसे से खरीदें", am: "በመተማመን ይግዙ", rw: "Gura wizeye",
  },
  safetyBody: {
    en: "🛡️ Buyer Safety Tips — Inspect livestock or cages in person before paying. Ndauka Farm does not hold your funds.",
    sw: "🛡️ Vidokezo vya Usalama — Kagua mifugo au mabanda ana kwa ana kabla ya kulipa. Ndauka Farm haishikilii fedha zako.",
    fr: "🛡️ Conseils de sécurité — Inspectez les animaux ou les cages en personne avant de payer. Ndauka Farm ne détient pas vos fonds.",
    ar: "🛡️ نصائح الأمان — افحص الحيوانات أو الأقفاص شخصيًا قبل الدفع. لا تحتفظ Ndauka Farm بأموالك.",
    pt: "🛡️ Dicas de segurança — Inspecione os animais ou gaiolas pessoalmente antes de pagar. A Ndauka Farm não retém o seu dinheiro.",
    es: "🛡️ Consejos de seguridad — Inspecciona los animales o jaulas en persona antes de pagar. Ndauka Farm no retiene tu dinero.",
    zh: "🛡️ 安全提示 — 付款前请亲自查看牲畜或笼具。Ndauka Farm 不代管您的资金。",
    hi: "🛡️ सुरक्षा सुझाव — भुगतान से पहले पशु या पिंजरे स्वयं देखें। Ndauka Farm आपका पैसा नहीं रखता।",
    am: "🛡️ የደህንነት ምክሮች — ከመክፈልዎ በፊት እንስሳቱን ወይም ጎጆዎቹን በአካል ይመልከቱ። Ndauka Farm ገንዘብዎን አይይዝም።",
    rw: "🛡️ Inama z'umutekano — Reba amatungo cyangwa ibiraro imbonankubone mbere yo kwishyura. Ndauka Farm ntibika amafaranga yawe.",
  },
  wantToSell: {
    en: "Want to sell? Switch to Seller", sw: "Unataka kuuza? Badilisha uwe Seller",
    fr: "Vous voulez vendre ? Devenez vendeur", ar: "تريد البيع؟ تحوّل إلى بائع",
    pt: "Quer vender? Torne-se vendedor", es: "¿Quieres vender? Cambia a vendedor",
    zh: "想要销售？切换为卖家", hi: "बेचना चाहते हैं? विक्रेता बनें",
    am: "መሸጥ ይፈልጋሉ? ወደ ሻጭ ይቀይሩ", rw: "Urashaka kugurisha? Hinduka umucuruzi",
  },
} satisfies Record<string, Entry>;

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
      if (l && LANGUAGES.some((x) => x.code === l)) setLangState(l);
      if (c && CURRENCIES.some((x) => x.code === c)) setCurrencyState(c);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const meta = LANGUAGES.find((x) => x.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = meta?.rtl ? "rtl" : "ltr";
  }, [lang]);

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
      t: (key) => {
        const entry: Entry = STRINGS[key];
        return entry[lang] ?? entry.en;
      },
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