import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PUBLIC_PRODUCT_COLUMNS } from "@/lib/marketplace";

export const HELP_CONTEXT = `
Ndauka Rabbit Market / Ndauka Farm ni soko la kidijitali la B2B Tanzania kwa mifugo (sungura wa mbegu,
kuku, bata, njiwa), mabanda ya kisasa, vifaa na chakula cha mifugo. Bei zote za msingi ni TZS.

Jinsi app inavyofanya kazi:
- Kuagiza: mnunuzi anaweka bidhaa kwenye Cart kisha "Start Order". Oda hupangwa kwa kila muuzaji.
- Kwa oda kubwa au maalum tumia RFQ (Omba Nukuu ya Bei) kwenye ukurasa /rfq.
- Malipo: hufanyika moja kwa moja kati ya mnunuzi na muuzaji baada ya muuzaji kukubali oda; njia za
  malipo za muuzaji huonekana baada ya oda kukubaliwa. App haipokei pesa kwa niaba yao.
- MOQ: kiwango cha chini cha kuagiza kinachowekwa na muuzaji.
- KYC: wauzaji hupakia NIDA/leseni kwenye Akaunti Yangu; hati huhifadhiwa kwa siri. Baada ya kuthibitishwa
  wanapata alama ya "Verified Seller".
- Kuwa muuzaji: badilisha akaunti kuwa seller kwenye Akaunti Yangu, kisha tumia kitufe cha "Post Item".
- Messenger: mnunuzi anaweza kuongea moja kwa moja na muuzaji kabla ya kuagiza.
- Usalama: tumia "Report" kwa muuzaji wa kutiliwa shaka; reviews huandikwa na wanunuzi waliothibitishwa.
- Vidokezo (Tips): video fupi za ufugaji bora.
`;

export type AssistantProduct = {
  id: string;
  title: string;
  price_tzs: number | null;
  region: string | null;
  city: string | null;
  breed: string | null;
  category_slug: string | null;
  moq: number | null;
  media_urls: string[] | null;
};

export async function loadCatalog(): Promise<AssistantProduct[]> {
  const { data } = await supabaseAdmin
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(80);
  return (data ?? []) as unknown as AssistantProduct[];
}

function catalogLines(items: AssistantProduct[]) {
  if (!items.length) return "(Hakuna bidhaa zilizoidhinishwa kwa sasa.)";
  return items
    .map(
      (p) =>
        `- id=${p.id} | ${p.title} | kundi=${p.category_slug ?? "-"} | aina=${p.breed ?? "-"} | bei=TZS ${
          p.price_tzs ?? "-"
        } | MOQ=${p.moq ?? "-"} | eneo=${[p.city, p.region].filter(Boolean).join(", ") || "-"}`,
    )
    .join("\n");
}

export async function answerQuestion(question: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const catalog = await loadCatalog();
  if (!apiKey) {
    return { reply: "Msaidizi wa AI hauwezi kufikiwa kwa sasa.", productIds: [] as string[], catalog };
  }

  const system = `You are the Ndauka Farm marketplace assistant.
Detect the user's language (Swahili or English) and ALWAYS answer in that same language.
Be short, friendly and conversational (max 3 sentences).
You may ONLY reference products from the catalog below; never invent products, prices or sellers.
If nothing matches, say so honestly and suggest using RFQ.
Answer general how-the-app-works questions using the help context.
You never place orders, never make payments and never take actions — you only answer and recommend.

HELP CONTEXT:
${HELP_CONTEXT}

CATALOG:
${catalogLines(catalog)}

Reply as JSON: {"reply": string, "productIds": string[]} where productIds are catalog ids that match (max 8, may be empty).`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: question },
      ],
    }),
  });

  if (!res.ok) {
    const message =
      res.status === 429
        ? "Maombi ni mengi kwa sasa, jaribu tena baada ya muda mfupi."
        : res.status === 402
          ? "Huduma ya AI imeishiwa na credits."
          : "Msaidizi wa AI ameshindwa kujibu kwa sasa.";
    return { reply: message, productIds: [] as string[], catalog };
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  let parsed: { reply?: string; productIds?: string[] } = {};
  try {
    parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  } catch {
    parsed = { reply: json.choices?.[0]?.message?.content ?? "" };
  }

  const valid = new Set(catalog.map((p) => p.id));
  return {
    reply: parsed.reply?.trim() || "Samahani, sikuelewa swali lako. Tafadhali uliza tena.",
    productIds: (parsed.productIds ?? []).filter((id) => valid.has(id)).slice(0, 8),
    catalog,
  };
}
