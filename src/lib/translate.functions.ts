// import { createServerFn } from "@tanstack/react-start";
// import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// type Lang = "en" | "hi" | "mr" | "te";
// const LANG_NAME: Record<Lang, string> = {
//   en: "English",
//   hi: "Hindi",
//   mr: "Marathi",
//   te: "Telugu",
// };

// interface Input {
//   texts: string[];
//   targetLang: Lang;
// }

// export const translateBatch = createServerFn({ method: "POST" })
//   .middleware([requireSupabaseAuth])
//   .inputValidator((data: Input) => {
//     if (!data || !Array.isArray(data.texts)) throw new Error("Invalid input");
//     const lang = (["en", "hi", "mr", "te"] as const).includes(data.targetLang as Lang)
//       ? (data.targetLang as Lang)
//       : "en";
//     return {
//       texts: data.texts.slice(0, 80).map((t) => String(t ?? "").slice(0, 800)),
//       targetLang: lang,
//     };
//   })
//   .handler(async ({ data }): Promise<{ translations: string[] }> => {
//     if (data.targetLang === "en" || data.texts.length === 0) {
//       return { translations: data.texts };
//     }
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) return { translations: data.texts };

//     const target = LANG_NAME[data.targetLang];
//     const sys = `You are a translator. Translate every input string into ${target}.
// Rules:
// - Translate proper nouns, NGO names, and brand names phonetically into ${target} script (e.g. "Akshaya Patra" -> Marathi: "अक्षय पात्र").
// - Keep emojis, numbers, dates, URLs unchanged.
// - Output ONLY by calling the translations function with an array of the same length and order as the input.`;

//     try {
//       const resp = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             systemInstruction: { parts: [{ text: sys }] },
//             contents: [
//               { role: "user", parts: [{ text: JSON.stringify(data.texts) }] },
//             ],
//             tools: [
//               {
//                 functionDeclarations: [
//                   {
//                     name: "translations",
//                     description: `Return all strings translated into ${target}.`,
//                     parameters: {
//                       type: "object",
//                       properties: {
//                         translations: { type: "array", items: { type: "string" } },
//                       },
//                       required: ["translations"],
//                     },
//                   },
//                 ],
//               },
//             ],
//             toolConfig: {
//               functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["translations"] },
//             },
//           }),
//         }
//       );
//       if (!resp.ok) return { translations: data.texts };
//       const json = await resp.json();
//       const call = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
//       const out = call?.args?.translations;
//       if (!Array.isArray(out) || out.length !== data.texts.length) {
//         return { translations: data.texts };
//       }
//       return {
//         translations: out.map((s: unknown, i: number) =>
//           typeof s === "string" && s.length > 0 ? s : data.texts[i]
//         ),
//       };
//     } catch {
//       return { translations: data.texts };
//     }
//   });
// Client-side batch translation using Gemini API directly.
// Replaces the old createServerFn version that required SSR/TanStack Start server.

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

export async function translateBatch(input: Input): Promise<{ translations: string[] }> {
  const targetLang = (["en", "hi", "mr", "te"] as const).includes(input.targetLang as Lang)
    ? (input.targetLang as Lang)
    : ("en" as Lang);

  if (targetLang === "en" || input.texts.length === 0) {
    return { translations: input.texts };
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return { translations: input.texts };

  const target = LANG_NAME[targetLang];
  const sys = `You are a translator. Translate every input string into ${target}.
Rules:
- Translate proper nouns, NGO names, and brand names phonetically into ${target} script (e.g. "Akshaya Patra" -> Marathi: "अक्षय पात्र").
- Keep emojis, numbers, dates, URLs unchanged.
- Output ONLY by calling the translations function with an array of the same length and order as the input.`;

  const allTranslations: string[] = new Array(input.texts.length).fill("");
  const CHUNK_SIZE = 20;

  for (let i = 0; i < input.texts.length; i += CHUNK_SIZE) {
    const chunk = input.texts.slice(i, i + CHUNK_SIZE).map((t) => String(t ?? "").slice(0, 800));
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(chunk) }] }],
        tools: [{
          functionDeclarations: [{
            name: "translations",
            description: `Return all strings translated into ${target}.`,
            parameters: {
              type: "object",
              properties: { translations: { type: "array", items: { type: "string" } } },
              required: ["translations"],
            },
          }],
        }],
        toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["translations"] } },
      });

      let resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });

      if (resp.status === 429) {
        console.warn(`Gemini API: 429 Too Many Requests for chunk ${i/CHUNK_SIZE + 1}. Retrying in 5000ms...`);
        await new Promise(r => setTimeout(r, 5000));
        resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      }

      if (!resp.ok) {
        chunk.forEach((txt, idx) => { allTranslations[i + idx] = txt; });
      } else {
        const json = await resp.json();
        const call = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
        const out = call?.args?.translations;

        if (Array.isArray(out) && out.length === chunk.length) {
          out.forEach((s: unknown, idx: number) => {
            allTranslations[i + idx] = typeof s === "string" && s.length > 0 ? s : chunk[idx];
          });
        } else {
          chunk.forEach((txt, idx) => { allTranslations[i + idx] = txt; });
        }
      }
    } catch {
      chunk.forEach((txt, idx) => { allTranslations[i + idx] = txt; });
    }

    if (i + CHUNK_SIZE < input.texts.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return { translations: allTranslations };
}
