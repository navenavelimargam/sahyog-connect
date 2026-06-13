import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  ngo_name: string | null;
  latitude: number | null;
  longitude: number | null;
  last_seen_at: string | null;
};

const normalizeNgo = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export const getSupervisorDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ requests: HelpRow[]; volunteers: VolunteerRow[] }> => {
    const { data: roleRow, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "ngo_supervisor")
      .maybeSingle();

    if (roleError || !roleRow) throw new Response("Forbidden", { status: 403 });

    const { data: supervisorProfile, error: profileError } = await context.supabase
      .from("profiles")
      .select("ngo_name")
      .eq("id", context.userId)
      .maybeSingle();

    if (profileError) throw new Error("Could not load supervisor profile");
    const supervisorNgo = supervisorProfile?.ngo_name ?? null;
    const normalizedSupervisorNgo = normalizeNgo(supervisorNgo);
    if (!normalizedSupervisorNgo) return { requests: [], volunteers: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: helpRows, error: helpError }, { data: volunteerRoles, error: rolesError }] = await Promise.all([
      supabaseAdmin
        .from("help_requests")
        .select("id, user_id, category, priority, description, location, status, selected_ngo_name, assigned_volunteer_id, created_at, image_urls, latitude, longitude, ai_reason, request_type, sender_ngo_id")
        .not("selected_ngo_name", "is", null)
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "volunteer"),
    ]);

    if (helpError) throw new Error("Could not load help requests");
    if (rolesError) throw new Error("Could not load volunteer roles");

    const scopedRequests = (helpRows ?? [])
      .filter((row) => normalizeNgo(row.selected_ngo_name) === normalizedSupervisorNgo)
      .slice(0, 100);

    const relatedProfileIds = Array.from(new Set(
      scopedRequests.flatMap((row) => [row.user_id, row.sender_ngo_id].filter(Boolean) as string[]),
    ));

    let relatedProfiles: { id: string; full_name: string; ngo_name: string | null }[] = [];
    if (relatedProfileIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, ngo_name")
        .in("id", relatedProfileIds);
      if (error) throw new Error("Could not load requester names");
      relatedProfiles = data ?? [];
    }

    const profileMap = new Map(relatedProfiles.map((p) => [p.id, p]));
    const requests = scopedRequests.map((row) => ({
      ...row,
      requester_name: profileMap.get(row.user_id)?.full_name ?? "Community member",
      sender_ngo_name: row.sender_ngo_id ? (profileMap.get(row.sender_ngo_id)?.ngo_name ?? null) : null,
    }));

    const volunteerIds = Array.from(new Set((volunteerRoles ?? []).map((row) => row.user_id)));
    let volunteers: VolunteerRow[] = [];
    if (volunteerIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, city, skills, rating, tasks_completed, ngo_name, latitude, longitude, last_seen_at")
        .in("id", volunteerIds);
      if (error) throw new Error("Could not load volunteers");
      volunteers = ((data ?? []) as VolunteerRow[])
        .filter((volunteer) => normalizeNgo(volunteer.ngo_name) === normalizedSupervisorNgo)
        .sort((a, b) => (b.tasks_completed ?? 0) - (a.tasks_completed ?? 0) || a.full_name.localeCompare(b.full_name));
    }

    return { requests, volunteers };
  });