import { createServerFn } from "@tanstack/react-start";

type Priority = "critical" | "high" | "medium" | "low";

interface ClassifyResult {
  priority: Priority;
  reason: string;
}

export const classifyPriority = createServerFn({ method: "POST" })
  .inputValidator((data: { description: string; category: string }) => {
    if (!data || typeof data.description !== "string" || typeof data.category !== "string") {
      throw new Error("Invalid input");
    }
    return {
      description: data.description.slice(0, 2000),
      category: data.category.slice(0, 80),
    };
  })
  .handler(async ({ data }): Promise<ClassifyResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { priority: "medium", reason: "AI unavailable — defaulted to medium." };
    }

    const systemPrompt = `You are an emergency triage classifier for Sahyog, an Indian community help network.
Classify each request into exactly one priority:
- "critical": immediate threat to life (active medical emergency, severe injury, person trapped, fire/flood actively endangering people).
- "high": urgent, time-sensitive harm risk within hours (no food/water for a child/elderly, blocked medical access, shelter loss in storm).
- "medium": urgent but not life-threatening (clothes/supplies after disaster, blocked roads, post-event needs).
- "low": routine community grievances, cleanup, non-urgent requests.
Respond ONLY with the tool call.`;

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
            { role: "system", content: systemPrompt },
            { role: "user", content: `Category: ${data.category}\nDescription: ${data.description}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "classify",
              description: "Return the triage priority.",
              parameters: {
                type: "object",
                properties: {
                  priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  reason: { type: "string", description: "One short sentence explaining the choice." },
                },
                required: ["priority", "reason"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "classify" } },
        }),
      });

      if (!resp.ok) {
        return { priority: "medium", reason: `AI error ${resp.status} — defaulted to medium.` };
      }
      const json = await resp.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return { priority: "medium", reason: "AI returned no classification." };
      const parsed = JSON.parse(args) as ClassifyResult;
      if (!["critical", "high", "medium", "low"].includes(parsed.priority)) {
        return { priority: "medium", reason: "AI returned invalid label." };
      }
      return parsed;
    } catch (e) {
      return { priority: "medium", reason: e instanceof Error ? e.message : "AI call failed." };
    }
  });
