

// type Priority = "critical" | "high" | "medium" | "low";

// interface ClassifyResult {
//   priority: Priority;
//   reason: string;
// }

// export const classifyPriority = createServerFn({ method: "POST" })
//   .middleware([requireSupabaseAuth])
//   .inputValidator((data: { description: string; category: string }) => {
//     if (!data || typeof data.description !== "string" || typeof data.category !== "string") {
//       throw new Error("Invalid input");
//     }
//     return {
//       description: data.description.slice(0, 2000),
//       category: data.category.slice(0, 80),
//     };
//   })
//   .handler(async ({ data }): Promise<ClassifyResult> => {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) {
//       return { priority: "medium", reason: "AI unavailable — defaulted to medium." };
//     }

//     const systemPrompt = `You are an emergency triage classifier for Sahyog, an Indian community help network.
// Classify each request into exactly one priority:
// - "critical": immediate threat to life (active medical emergency, severe injury, person trapped, fire/flood actively endangering people).
// - "high": urgent, time-sensitive harm risk within hours (no food/water for a child/elderly, blocked medical access, shelter loss in storm).
// - "medium": urgent but not life-threatening (clothes/supplies after disaster, blocked roads, post-event needs).
// - "low": routine community grievances, cleanup, non-urgent requests.
// Respond ONLY by calling the classify function.`;

//     try {
//       const resp = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             systemInstruction: { parts: [{ text: systemPrompt }] },
//             contents: [
//               {
//                 role: "user",
//                 parts: [{ text: `Category: ${data.category}\nDescription: ${data.description}` }],
//               },
//             ],
//             tools: [
//               {
//                 functionDeclarations: [
//                   {
//                     name: "classify",
//                     description: "Return the triage priority.",
//                     parameters: {
//                       type: "object",
//                       properties: {
//                         priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
//                         reason: { type: "string", description: "One short sentence explaining the choice." },
//                       },
//                       required: ["priority", "reason"],
//                     },
//                   },
//                 ],
//               },
//             ],
//             toolConfig: {
//               functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["classify"] },
//             },
//           }),
//         }
//       );

//       if (!resp.ok) {
//         return { priority: "medium", reason: `AI error ${resp.status} — defaulted to medium.` };
//       }
//       const json = await resp.json();
//       const call = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
//       const args = call?.args;
//       if (!args || !["critical", "high", "medium", "low"].includes(args.priority)) {
//         return { priority: "medium", reason: "AI returned no/invalid classification." };
//       }
//       return { priority: args.priority as Priority, reason: String(args.reason ?? "") };
//     } catch (e) {
//       return { priority: "medium", reason: e instanceof Error ? e.message : "AI call failed." };
//     }
//   });
// Client-side AI priority classification using Gemini API directly.
// Replaces the old createServerFn version that required SSR.
type Priority = "critical" | "high" | "medium" | "low";

interface ClassifyResult {
  priority: Priority;
  reason: string;
}

export async function classifyPriority(input: { description: string; category: string }): Promise<ClassifyResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return { priority: "medium", reason: "AI unavailable — defaulted to medium." };
  }

  const systemPrompt = `You are an emergency triage classifier for Sahyog, an Indian community help network.
Classify each request into exactly one priority:
- "critical": immediate threat to life (active medical emergency, severe injury, person trapped, fire/flood actively endangering people).
- "high": urgent, time-sensitive harm risk within hours (no food/water for a child/elderly, blocked medical access, shelter loss in storm).
- "medium": urgent but not life-threatening (clothes/supplies after disaster, blocked roads, post-event needs).
- "low": routine community grievances, cleanup, non-urgent requests.
Respond ONLY by calling the classify function.`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            {
              role: "user",
              parts: [{ text: `Category: ${input.category}\nDescription: ${input.description}` }],
            },
          ],
          tools: [
            {
              functionDeclarations: [
                {
                  name: "classify",
                  description: "Return the triage priority.",
                  parameters: {
                    type: "object",
                    properties: {
                      priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                      reason: { type: "string", description: "One short sentence explaining the choice." },
                    },
                    required: ["priority", "reason"],
                  },
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["classify"] },
          },
        }),
      }
    );

    if (!resp.ok) {
      return { priority: "medium", reason: `AI error ${resp.status} — defaulted to medium.` };
    }
    const json = await resp.json();
    const call = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
    const args = call?.args;
    if (!args || !["critical", "high", "medium", "low"].includes(args.priority)) {
      return { priority: "medium", reason: "AI returned no/invalid classification." };
    }
    return { priority: args.priority as Priority, reason: String(args.reason ?? "") };
  } catch (e) {
    return { priority: "medium", reason: e instanceof Error ? e.message : "AI call failed." };
  }
}
