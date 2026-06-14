// import { createServerFn } from "@tanstack/react-start";
// import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// type RatingInput = {
//   requestId: string;
//   rating: number;
//   feedback: string;
// };

// export const rateAssignedVolunteer = createServerFn({ method: "POST" })
//   .middleware([requireSupabaseAuth])
//   .inputValidator((data: RatingInput) => {
//     if (!data || typeof data.requestId !== "string") throw new Error("Invalid input");
//     const rating = Number(data.rating);
//     if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
//     return {
//       requestId: data.requestId,
//       rating,
//       feedback: String(data.feedback ?? "").slice(0, 500),
//     };
//   })
//   .handler(async ({ data, context }) => {
//     const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

//     const { data: request, error: requestError } = await supabaseAdmin
//       .from("help_requests")
//       .select("user_id, assigned_volunteer_id")
//       .eq("id", data.requestId)
//       .maybeSingle();

//     if (requestError) throw new Error("Could not load request");
//     if (!request || request.user_id !== context.userId || !request.assigned_volunteer_id) {
//       throw new Response("Forbidden", { status: 403 });
//     }

//     const { data: volunteer, error: volunteerError } = await supabaseAdmin
//       .from("profiles")
//       .select("rating, tasks_completed")
//       .eq("id", request.assigned_volunteer_id)
//       .maybeSingle();

//     if (volunteerError || !volunteer) throw new Error("Could not load volunteer");

//     const previousRating = Number(volunteer.rating ?? 5);
//     const tasksCompleted = (volunteer.tasks_completed ?? 0) + 1;
//     const nextRating = Math.round((((previousRating * (tasksCompleted - 1)) + data.rating) / tasksCompleted) * 100) / 100;

//     const { error: updateError } = await supabaseAdmin
//       .from("profiles")
//       .update({ rating: nextRating, tasks_completed: tasksCompleted })
//       .eq("id", request.assigned_volunteer_id);

//     if (updateError) throw new Error("Could not update volunteer rating");

//     const message = data.feedback.length > 0
//       ? `"${data.feedback}" — Your new average rating is ${nextRating} ⭐`
//       : `A community member rated your help ${data.rating}/5. Your new average is ${nextRating} ⭐. Keep up the great work!`;

//     await supabaseAdmin.from("notifications").insert({
//       user_id: request.assigned_volunteer_id,
//       title: `⭐ You received a ${data.rating}-star rating!`,
//       message,
//       icon: "⭐",
//     });

//     return { ok: true, rating: nextRating };
//   });
// Client-side rating submission using Supabase directly.
import { supabase } from "@/integrations/supabase/client";

type RatingInput = {
  requestId: string;
  rating: number;
  feedback: string;
};

export async function rateAssignedVolunteer(input: { data: RatingInput }): Promise<{ ok: boolean; rating: number }> {
  const data = input.data;
  const rating = Number(data.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

  const { data: request, error: requestError } = await supabase
    .from("help_requests")
    .select("user_id, assigned_volunteer_id")
    .eq("id", data.requestId)
    .maybeSingle();

  if (requestError || !request?.assigned_volunteer_id) throw new Error("Could not load request");

  const { data: volunteer, error: volunteerError } = await supabase
    .from("profiles")
    .select("rating, tasks_completed")
    .eq("id", request.assigned_volunteer_id)
    .maybeSingle();

  if (volunteerError || !volunteer) throw new Error("Could not load volunteer");

  const previousRating = Number(volunteer.rating ?? 5);
  const tasksCompleted = (volunteer.tasks_completed ?? 0) + 1;
  const nextRating = Math.round((((previousRating * (tasksCompleted - 1)) + rating) / tasksCompleted) * 100) / 100;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ rating: nextRating, tasks_completed: tasksCompleted })
    .eq("id", request.assigned_volunteer_id);

  if (updateError) throw new Error("Could not update volunteer rating");

  const message = data.feedback.length > 0
    ? `"${data.feedback}" — Your new average rating is ${nextRating} ⭐`
    : `A community member rated your help ${rating}/5. Your new average is ${nextRating} ⭐. Keep up the great work!`;

  await supabase.from("notifications").insert({
    user_id: request.assigned_volunteer_id,
    title: `⭐ You received a ${rating}-star rating!`,
    message,
    icon: "⭐",
  });

  return { ok: true, rating: nextRating };
}
