import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface MatchInput {
  description: string;
  category: string;
  candidates: { name: string; tags: string }[];
}

interface MatchResult {
  ngoName: string;
  reason: string;
}

export const matchPeerNgo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: MatchInput) => {
    if (!data || !Array.isArray(data.candidates)) throw new Error("Invalid input");
    return {
      description: String(data.description ?? "").slice(0, 2000),
      category: String(data.category ?? "").slice(0, 80),
      candidates: data.candidates.slice(0, 20).map((c) => ({
        name: String(c.name).slice(0, 120),
        tags: String(c.tags ?? "").slice(0, 200),
      })),
    };
  })
  .handler(async ({ data }): Promise<MatchResult | null> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || data.candidates.length === 0) return null;

    const listing = data.candidates.map((c, i) => `${i + 1}. ${c.name} — tags: ${c.tags}`).join("\n");
    const system = `You are a peer-NGO matcher for Sahyog. An NGO has posted a B2B SOS shortage request. Pick the SINGLE most capable peer NGO from the candidate list that can fulfill it based on its tags. Respond ONLY by calling the match function.`;

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Category: ${data.category}\nDescription: ${data.description}\n\nCandidates:\n${listing}`,
                  },
                ],
              },
            ],
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "match",
                    description: "Return the chosen peer NGO.",
                    parameters: {
                      type: "object",
                      properties: {
                        ngoName: {
                          type: "string",
                          description: "Exact name of the chosen NGO from the candidates.",
                        },
                        reason: {
                          type: "string",
                          description: "One short sentence on why this NGO matches.",
                        },
                      },
                      required: ["ngoName", "reason"],
                    },
                  },
                ],
              },
            ],
            toolConfig: {
              functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["match"] },
            },
          }),
        }
      );
      if (!resp.ok) return null;
      const json = await resp.json();
      const call = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
      const args = call?.args as MatchResult | undefined;
      if (!args?.ngoName || !data.candidates.some((c) => c.name === args.ngoName)) return null;
      return { ngoName: args.ngoName, reason: String(args.reason ?? "") };
    } catch {
      return null;
    }
  });
