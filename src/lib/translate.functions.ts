import { createServerFn } from "@tanstack/react-start";

type Lang = "en" | "hi" | "mr" | "te";
const LANG_NAME: Record<Lang, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  te: "Telugu",
};

interface Input {
  texts: string[];
  targetLang: Lang;
}

export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((data: Input) => {
    if (!data || !Array.isArray(data.texts)) throw new Error("Invalid input");
    const lang = (["en", "hi", "mr", "te"] as const).includes(data.targetLang as Lang)
      ? (data.targetLang as Lang)
      : "en";
    return {
      texts: data.texts.slice(0, 80).map((t) => String(t ?? "").slice(0, 800)),
      targetLang: lang,
    };
  })
  .handler(async ({ data }): Promise<{ translations: string[] }> => {
    if (data.targetLang === "en" || data.texts.length === 0) {
      return { translations: data.texts };
    }
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { translations: data.texts };

    const target = LANG_NAME[data.targetLang];
    const sys = `You are a translator. Translate every input string into ${target}.
Rules:
- Translate proper nouns, NGO names, and brand names phonetically into ${target} script (e.g. "Akshaya Patra" -> Marathi: "अक्षय पात्र").
- Keep emojis, numbers, dates, URLs unchanged.
- Output ONLY the tool call with the translations array, same length & order as input.`;

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: JSON.stringify(data.texts) },
          ],
          tools: [{
            type: "function",
            function: {
              name: "translations",
              description: `Return all strings translated into ${target}.`,
              parameters: {
                type: "object",
                properties: {
                  translations: { type: "array", items: { type: "string" } },
                },
                required: ["translations"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "translations" } },
        }),
      });
      if (!resp.ok) return { translations: data.texts };
      const json = await resp.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return { translations: data.texts };
      const parsed = JSON.parse(args) as { translations: string[] };
      const out = parsed.translations;
      if (!Array.isArray(out) || out.length !== data.texts.length) {
        return { translations: data.texts };
      }
      return { translations: out.map((s, i) => (typeof s === "string" && s.length > 0 ? s : data.texts[i])) };
    } catch {
      return { translations: data.texts };
    }
  });
