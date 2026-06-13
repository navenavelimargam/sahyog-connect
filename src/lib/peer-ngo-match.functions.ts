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

// AI-driven peer-NGO matcher for B2B SOS requests.
// Uses Lovable AI (Gemini Flash) to pick the best capable peer NGO.
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
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey || data.candidates.length === 0) return null;

    const listing = data.candidates.map((c, i) => `${i + 1}. ${c.name} — tags: ${c.tags}`).join("\n");
    const system = `You are a peer-NGO matcher for Sahyog. An NGO has posted a B2B SOS shortage request. Pick the SINGLE most capable peer NGO from the candidate list that can fulfill it based on its tags. Respond ONLY via the tool call.`;

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: system },
            { role: "user", content: `Category: ${data.category}\nDescription: ${data.description}\n\nCandidates:\n${listing}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "match",
              description: "Return the chosen peer NGO.",
              parameters: {
                type: "object",
                properties: {
                  ngoName: { type: "string", description: "Exact name of the chosen NGO from the candidates." },
                  reason: { type: "string", description: "One short sentence on why this NGO matches." },
                },
                required: ["ngoName", "reason"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "match" } },
        }),
      });
      if (!resp.ok) return null;
      const json = await resp.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return null;
      const parsed = JSON.parse(args) as MatchResult;
      if (!data.candidates.some((c) => c.name === parsed.ngoName)) return null;
      return parsed;
    } catch {
      return null;
    }
  });
