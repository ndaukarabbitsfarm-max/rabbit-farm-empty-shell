import { createServerFn } from "@tanstack/react-start";
import { answerQuestion } from "@/lib/ai.server";

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: { question: string }) => {
    const question = (input?.question ?? "").trim().slice(0, 500);
    if (!question) throw new Error("Swali linahitajika");
    return { question };
  })
  .handler(async ({ data }) => {
    const { reply, productIds, catalog } = await answerQuestion(data.question);
    const products = productIds
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    return { reply, products };
  });
