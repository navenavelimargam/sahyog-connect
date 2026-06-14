// import { createServerFn } from "@tanstack/react-start";
// import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// type HelpRow = {
//   id: string;
//   user_id: string;
//   category: string;
//   priority: string;
//   description: string;
//   location: string;
//   status: string;
//   selected_ngo_name: string | null;
//   assigned_volunteer_id: string | null;
//   created_at: string | null;
//   requester_name?: string;
//   image_urls?: string[] | null;
//   latitude?: number | null;
//   longitude?: number | null;
//   ai_reason?: string | null;
//   request_type?: string | null;
//   sender_ngo_id?: string | null;
//   sender_ngo_name?: string | null;
// };

// type VolunteerRow = {
//   id: string;
//   full_name: string;
//   city: string | null;
//   skills: string[] | null;
//   rating: number | null;
//   tasks_completed: number | null;
//   ngo_name: string | null;
//   latitude: number | null;
//   longitude: number | null;
//   last_seen_at: string | null;
// };

// const normalizeNgo = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

// export const getSupervisorDashboardData = createServerFn({ method: "GET" })
//   .middleware([requireSupabaseAuth])
//   .handler(async ({ context }): Promise<{ requests: HelpRow[]; volunteers: VolunteerRow[] }> => {
//     const { data: roleRow, error: roleError } = await context.supabase
//       .from("user_roles")
//       .select("role")
//       .eq("user_id", context.userId)
//       .eq("role", "ngo_supervisor")
//       .maybeSingle();

//     if (roleError || !roleRow) throw new Response("Forbidden", { status: 403 });

//     const { data: supervisorProfile, error: profileError } = await context.supabase
//       .from("profiles")
//       .select("ngo_name")
//       .eq("id", context.userId)
//       .maybeSingle();

//     if (profileError) throw new Error("Could not load supervisor profile");
//     const supervisorNgo = supervisorProfile?.ngo_name ?? null;
//     const normalizedSupervisorNgo = normalizeNgo(supervisorNgo);
//     if (!normalizedSupervisorNgo) return { requests: [], volunteers: [] };

//     const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

//     const [{ data: helpRows, error: helpError }, { data: volunteerRoles, error: rolesError }] = await Promise.all([
//       supabaseAdmin
//         .from("help_requests")
//         .select("id, user_id, category, priority, description, location, status, selected_ngo_name, assigned_volunteer_id, created_at, image_urls, latitude, longitude, ai_reason, request_type, sender_ngo_id")
//         .not("selected_ngo_name", "is", null)
//         .order("created_at", { ascending: false })
//         .limit(500),
//       supabaseAdmin.from("user_roles").select("user_id").eq("role", "volunteer"),
//     ]);

//     if (helpError) throw new Error("Could not load help requests");
//     if (rolesError) throw new Error("Could not load volunteer roles");

//     const scopedRequests = (helpRows ?? [])
//       .filter((row) => normalizeNgo(row.selected_ngo_name) === normalizedSupervisorNgo)
//       .slice(0, 100);

//     const relatedProfileIds = Array.from(new Set(
//       scopedRequests.flatMap((row) => [row.user_id, row.sender_ngo_id].filter(Boolean) as string[]),
//     ));

//     let relatedProfiles: { id: string; full_name: string; ngo_name: string | null }[] = [];
//     if (relatedProfileIds.length > 0) {
//       const { data, error } = await supabaseAdmin
//         .from("profiles")
//         .select("id, full_name, ngo_name")
//         .in("id", relatedProfileIds);
//       if (error) throw new Error("Could not load requester names");
//       relatedProfiles = data ?? [];
//     }

//     const profileMap = new Map(relatedProfiles.map((p) => [p.id, p]));
//     const requests = scopedRequests.map((row) => ({
//       ...row,
//       requester_name: profileMap.get(row.user_id)?.full_name ?? "Community member",
//       sender_ngo_name: row.sender_ngo_id ? (profileMap.get(row.sender_ngo_id)?.ngo_name ?? null) : null,
//     }));

//     const volunteerIds = Array.from(new Set((volunteerRoles ?? []).map((row) => row.user_id)));
//     let volunteers: VolunteerRow[] = [];
//     if (volunteerIds.length > 0) {
//       const { data, error } = await supabaseAdmin
//         .from("profiles")
//         .select("id, full_name, city, skills, rating, tasks_completed, ngo_name, latitude, longitude, last_seen_at")
//         .in("id", volunteerIds);
//       if (error) throw new Error("Could not load volunteers");
//       volunteers = ((data ?? []) as VolunteerRow[])
//         .filter((volunteer) => normalizeNgo(volunteer.ngo_name) === normalizedSupervisorNgo)
//         .sort((a, b) => (b.tasks_completed ?? 0) - (a.tasks_completed ?? 0) || a.full_name.localeCompare(b.full_name));
//     }

//     return { requests, volunteers };
//   });
// import { createServerFn } from "@tanstack/react-start";
// import { supabase } from "./supabase-server"; // Ensure server client configuration is correct

// export const getSupervisorDashboardData = createServerFn("GET", async () => {
//   try {
//     // 1. Fetching Requests safely
//     const { data: requests, error: reqError } = await supabase
//       .from("help_requests")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (reqError) {
//       console.error("Database error fetching requests:", reqError);
//     }

//     // 2. Fetching Volunteers safely
//     const { data: volunteers, error: volError } = await supabase
//       .from("volunteers")
//       .select("*");

//     if (volError) {
//       console.error("Database error fetching volunteers:", volError);
//     }

//     // Always guarantee an object with instantiated arrays back to the client
//     return {
//       requests: Array.isArray(requests) ? requests : [],
//       volunteers: Array.isArray(volunteers) ? volunteers : [],
//     };

//   } catch (globalServerException) {
//     console.error("Critical failure inside getSupervisorDashboardData RPC:", globalServerException);
    
//     // Hard-coded fallback safety net ensures the frontend never sees undefined 
//     return {
//       requests: [],
//       volunteers: [],
//     };
//   }
// });
// / Client-side dashboard data fetcher using Supabase directly.
// // Replaces the old createServerFn/SSR version.
// import { supabase } from "@/integrations/supabase/client";

// type HelpRow = {
//   id: string;
//   user_id: string;
//   category: string;
//   priority: string;
//   description: string;
//   location: string;
//   status: string;
//   selected_ngo_name: string | null;
//   assigned_volunteer_id: string | null;
//   created_at: string | null;
//   requester_name?: string;
//   image_urls?: string[] | null;
//   latitude?: number | null;
//   longitude?: number | null;
//   ai_reason?: string | null;
//   request_type?: string | null;
//   sender_ngo_id?: string | null;
//   sender_ngo_name?: string | null;
// };

// type VolunteerRow = {
//   id: string;
//   full_name: string;
//   city: string | null;
//   skills: string[] | null;
//   rating: number | null;
//   tasks_completed: number | null;
//   ngo_name: string | null;
//   latitude: number | null;
//   longitude: number | null;
//   last_seen_at: string | null;
// };

// const normalizeNgo = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

// export async function getSupervisorDashboardData(): Promise<{ requests: HelpRow[]; volunteers: VolunteerRow[] }> {
//   try {
//     // Get current user profile for ngo_name scoping
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) return { requests: [], volunteers: [] };

//     const { data: supervisorProfile } = await supabase
//       .from("profiles")
//       .select("ngo_name")
//       .eq("id", user.id)
//       .maybeSingle();

//     const supervisorNgo = supervisorProfile?.ngo_name ?? null;
//     const normalizedSupervisorNgo = normalizeNgo(supervisorNgo);
//     if (!normalizedSupervisorNgo) return { requests: [], volunteers: [] };

//     // Fetch help requests for this NGO
//     const { data: helpRows, error: helpError } = await supabase
//       .from("help_requests")
//       .select("id, user_id, category, priority, description, location, status, selected_ngo_name, assigned_volunteer_id, created_at, image_urls, latitude, longitude, ai_reason, request_type, sender_ngo_id")
//       .not("selected_ngo_name", "is", null)
//       .order("created_at", { ascending: false })
//       .limit(200);

//     if (helpError) {
//       console.error("Error fetching help requests:", helpError);
//     }

//     const scopedRequests = (helpRows ?? [])
//       .filter((row) => normalizeNgo(row.selected_ngo_name) === normalizedSupervisorNgo)
//       .slice(0, 100);

//     // Fetch requester profiles
//     const relatedProfileIds = Array.from(new Set(
//       scopedRequests.flatMap((row) => [row.user_id, row.sender_ngo_id].filter(Boolean) as string[])
//     ));

//     let profileMap = new Map<string, { id: string; full_name: string; ngo_name: string | null }>();
//     if (relatedProfileIds.length > 0) {
//       const { data: profiles } = await supabase
//         .from("profiles")
//         .select("id, full_name, ngo_name")
//         .in("id", relatedProfileIds);
//       (profiles ?? []).forEach((p) => profileMap.set(p.id, p));
//     }

//     const requests: HelpRow[] = scopedRequests.map((row) => ({
//       ...row,
//       requester_name: profileMap.get(row.user_id)?.full_name ?? "Community member",
//       sender_ngo_name: row.sender_ngo_id ? (profileMap.get(row.sender_ngo_id)?.ngo_name ?? null) : null,
//     }));

//     // Fetch volunteers that belong to this NGO
//     const { data: volunteerRoles } = await supabase
//       .from("user_roles")
//       .select("user_id")
//       .eq("role", "volunteer");

//     const volunteerIds = Array.from(new Set((volunteerRoles ?? []).map((r) => r.user_id)));
//     let volunteers: VolunteerRow[] = [];

//     if (volunteerIds.length > 0) {
//       const { data: volProfiles } = await supabase
//         .from("profiles")
//         .select("id, full_name, city, skills, rating, tasks_completed, ngo_name, latitude, longitude, last_seen_at")
//         .in("id", volunteerIds);

//       volunteers = ((volProfiles ?? []) as VolunteerRow[])
//         .filter((v) => normalizeNgo(v.ngo_name) === normalizedSupervisorNgo)
//         .sort((a, b) => (b.tasks_completed ?? 0) - (a.tasks_completed ?? 0) || a.full_name.localeCompare(b.full_name));
//     }

//     return { requests, volunteers };
//   } catch (err) {
//     console.error("getSupervisorDashboardData error:", err);
//     return { requests: [], volunteers: [] };
//   }
// }
import { supabase } from "@/integrations/supabase/client";

type HelpRow = {
  id: string;
  user_id: string;
  category: string;
  priority: string;
  description: string;
  location: string;
  status: string;
  selected_ngo_name: string | null;
  assigned_volunteer_id: string | null;
  created_at: string | null;
  requester_name?: string;
  assigned_volunteer_name?: string | null;
  image_urls?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  ai_reason?: string | null;
  request_type?: string | null;
  sender_ngo_id?: string | null;
  sender_ngo_name?: string | null;
};

type VolunteerRow = {
  id: string;
  full_name: string;
  city: string | null;
  skills: string[] | null;
  rating: number | null;
  tasks_completed: number | null;
  ngo_name?: string | null;
  latitude: number | null;
  longitude: number | null;
  last_seen_at?: string | null;
};

export async function getSupervisorDashboardData(): Promise<{ requests: HelpRow[]; volunteers: VolunteerRow[] }> {
  try {
    const { data: requests, error: requestsError } = await supabase.rpc("get_supervisor_help_requests");
    if (requestsError) throw new Error(requestsError.message);

    const { data: volunteers, error: volunteersError } = await supabase.rpc("get_supervisor_volunteers");
    if (volunteersError) throw new Error(volunteersError.message);

    return {
      requests: Array.isArray(requests) ? (requests as HelpRow[]).slice(0, 100) : [],
      volunteers: Array.isArray(volunteers) ? (volunteers as VolunteerRow[]) : [],
    };
  } catch (err) {
    console.error("getSupervisorDashboardData error:", err);
    return { requests: [], volunteers: [] };
  }
}
