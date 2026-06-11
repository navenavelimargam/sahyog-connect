import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, MapPin, Clock, ShieldAlert, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusTimeline } from "@/components/StatusTimeline";
import { SignedImage } from "@/components/SignedImage";
import { HelpHeatmap } from "@/components/HelpHeatmap";
import { rankVolunteers, type MatchVolunteer } from "@/lib/matchmaker";
import { useDynamic } from "@/lib/dynamic-translate";

export const Route = createFileRoute("/dashboard")({
  component: NGODashboard,
  head: () => ({ meta: [{ title: "NGO Dashboard — Sahyog" }] }),
});

interface HelpRow {
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
}

interface VolunteerRow extends MatchVolunteer {
  city: string | null;
  tasks_completed: number | null;
  ngo_name?: string | null;
  last_seen_at?: string | null;
}

const PRIORITY_STYLE: Record<string, { border: string; bg: string; chip: string; key: string }> = {
  critical: { border: "border-l-destructive", bg: "bg-destructive/5", chip: "bg-destructive text-destructive-foreground", key: "critical" },
  high: { border: "border-l-accent", bg: "bg-accent/5", chip: "bg-accent text-accent-foreground", key: "high" },
  medium: { border: "border-l-warning", bg: "bg-warning/5", chip: "bg-warning text-warning-foreground", key: "medium" },
  low: { border: "border-l-success", bg: "bg-success/5", chip: "bg-success text-success-foreground", key: "low" },
};

function NGODashboard() {
  const { t } = useTranslation();
  const { user, loading, profile, role } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HelpRow[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [assignFor, setAssignFor] = useState<HelpRow | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "user" } });
    if (!loading && user && role && role !== "ngo_supervisor") {
      toast.error("Only NGO supervisors can access this dashboard");
      navigate({ to: "/feed" });
    }
  }, [user, loading, role, navigate]);

  const loadData = useCallback(async () => {
    if (!profile?.ngo_name) { setLoadingData(false); return; }
    setLoadingData(true);
    const [{ data: requestRows, error: requestError }, { data: volunteerRows, error: volunteerError }] = await Promise.all([
      supabase.rpc("get_supervisor_help_requests"),
      supabase.rpc("get_supervisor_volunteers"),
    ]);
    if (requestError) toast.error(requestError.message);
    if (volunteerError) toast.error(volunteerError.message);
    setRequests(((requestRows as HelpRow[] | null) ?? []).slice(0, 50));
    setVolunteers((volunteerRows as VolunteerRow[] | null) ?? []);
    setLoadingData(false);
  }, [profile?.ngo_name]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!profile?.ngo_name) return;
    const ch = supabase
      .channel("ngo-help-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "help_requests" }, () => { loadData(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.ngo_name, loadData]);

  const assignVolunteer = async (req: HelpRow, volunteerId: string) => {
    const { error } = await supabase
      .from("help_requests")
      .update({ assigned_volunteer_id: volunteerId, ngo_id: user!.id, status: "accepted" })
      .eq("id", req.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Volunteer assigned ✅");
    setAssignFor(null);
    loadData();
  };

  // Heatmap points
  const heatPoints = useMemo(() =>
    requests
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        lat: r.latitude as number,
        lng: r.longitude as number,
        priority: r.priority,
        label: `${r.category} • ${r.requester_name ?? ""}`,
      })),
  [requests]);

  const volunteerPoints = useMemo(() =>
    volunteers
      .filter((v) => v.latitude != null && v.longitude != null)
      .map((v) => ({ lat: v.latitude as number, lng: v.longitude as number, name: v.full_name })),
  [volunteers]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (role !== "ngo_supervisor") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-3 font-display text-xl font-bold">NGO Supervisors Only</h1>
          <Button onClick={() => navigate({ to: "/feed" })} className="mt-4 rounded-full bg-primary text-primary-foreground">Back</Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending").length;
  const active = requests.filter((r) => ["accepted", "on_the_way"].includes(r.status)).length;
  const completed = requests.filter((r) => r.status === "delivered").length;
  const successPct = requests.length ? Math.round((completed / requests.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <header className="gradient-hero text-white shadow-elevated">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold"><DynNgo name={profile?.ngo_name || "Your NGO"} /></h1>
            <VerifiedBadge kind="ngo" className="bg-white/20 text-white" />
          </div>
          <p className="text-sm text-white/80">{t("dashboard.ngoTitle")}: {profile?.full_name} • {profile?.city || "India"}</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              { k: t("dashboard.pending"), v: pending },
              { k: t("dashboard.active"), v: active },
              { k: t("dashboard.volunteers"), v: volunteers.length },
              { k: t("dashboard.success"), v: `${successPct}%` },
            ].map((s) => (
              <div key={s.k} className="rounded-lg bg-white/10 backdrop-blur p-2">
                <div className="text-lg font-bold">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wide opacity-80">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-3 py-4">
        <div className="rounded-2xl border-2 border-success/30 bg-success/10 p-4 shadow-card">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-success p-1.5"><Sparkles className="h-4 w-4 text-success-foreground" /></div>
            <div className="flex-1">
              <div className="font-bold text-success">🤖 {t("dashboard.aiRecommendation")}</div>
              <p className="mt-1 text-sm text-foreground">
                {pending === 0 ? t("dashboard.noPending") : `${pending} ${t("dashboard.pending").toLowerCase()}`}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => navigate({ to: "/help", search: { mode: "b2b" } })}
          className="w-full rounded-2xl bg-gradient-to-r from-destructive to-accent text-white shadow-elevated py-6 text-base font-bold animate-pulse"
        >
          🚨 B2B Emergency SOS — Request from Peer NGO
        </Button>
        <Button onClick={() => navigate({ to: "/b2b" })} variant="outline" className="w-full rounded-full">
          🤝 {t("dashboard.openB2B")} (Shortage Marketplace)
        </Button>

        {/* Live heatmap */}
        <section className="rounded-2xl border border-border bg-card p-3 shadow-card">
          <h2 className="mb-2 px-1 font-display text-base font-bold">🗺️ {t("dashboard.liveHeatmap")}</h2>
          {heatPoints.length === 0 && volunteerPoints.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No GPS data yet.
            </div>
          ) : (
            <HelpHeatmap requests={heatPoints} volunteers={volunteerPoints} height={280} />
          )}
        </section>

        {/* My Volunteers */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">🙋 {t("dashboard.myVolunteers")} ({volunteers.length})</h2>
          </div>
          {volunteers.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("dashboard.noVolunteers")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {volunteers.map((v) => {
                const initials = v.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div key={v.id} className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold"><DynNgo name={v.full_name} /> <span className="text-[10px] text-accent">⭐ {v.rating ?? 5}</span></div>
                      <div className="truncate text-[11px] text-muted-foreground">{v.city ?? "—"} • {v.skills?.join(", ") || "General"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <h2 className="px-1 font-display text-lg font-bold">📥 {t("dashboard.riskQueue")}</h2>

        {loadingData ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("dashboard.noRequests")}
          </div>
        ) : (
          requests.map((q) => {
            const ps = PRIORITY_STYLE[q.priority] ?? PRIORITY_STYLE.medium;
            // Matchmaker: top candidate if pending & has GPS
            let topMatch: ReturnType<typeof rankVolunteers>[number] | null = null;
            if (q.status === "pending" && volunteers.length > 0) {
              const ranks = rankVolunteers(
                { category: q.category, priority: q.priority, latitude: q.latitude, longitude: q.longitude },
                volunteers,
              );
              topMatch = ranks[0] ?? null;
            }
            return (
              <article key={q.id} className={cn("rounded-2xl border border-l-4 border-border bg-card p-4 shadow-card", ps.border, ps.bg)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", ps.chip)}>{t(`priority.${ps.key}`)} • <DynText text={q.category} /></span>
                    <div className="mt-2 font-bold text-foreground"><DynText text={q.requester_name ?? ""} /> • <span className="text-sm font-normal text-muted-foreground"><DynText text={q.location} /></span></div>
                    <p className="mt-1 text-sm text-foreground">"<DynText text={q.description} />"</p>
                    {q.ai_reason && (
                      <p className="mt-1 text-[11px] italic text-primary">🤖 AI: <DynText text={q.ai_reason} /></p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> <DynText text={q.location} /></span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(q.created_at)}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{q.status}</span>
                    </div>
                  </div>
                </div>

                {q.image_urls && q.image_urls.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">📸 Documentation</div>
                    <div className="grid grid-cols-4 gap-1">
                      {q.image_urls.slice(0, 4).map((path, i) => (
                        <SignedImage key={i} path={path} alt={`evidence-${i}`} className="aspect-square w-full rounded-md border border-border object-cover" />
                      ))}
                    </div>
                  </div>
                )}

                {q.assigned_volunteer_id && (
                  <div className="mt-3 rounded-xl border border-border bg-background/60 p-3">
                    <StatusTimeline status={q.status} hasVolunteer={!!q.assigned_volunteer_id} updatedAt={q.created_at} compact />
                  </div>
                )}

                {topMatch && (
                  <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-primary">🤖 {t("dashboard.matchTitle")}</div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{topMatch.volunteer.full_name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {topMatch.score}% • {topMatch.skillMatch}% {t("dashboard.matchSkill")}
                          {topMatch.distanceKm != null && ` • ${topMatch.distanceKm.toFixed(1)} ${t("dashboard.matchAway")}`}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => assignVolunteer(q, topMatch!.volunteer.id)} className="bg-primary text-primary-foreground">{t("dashboard.matchAssign")}</Button>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {q.status === "pending" ? (
                    <Button size="sm" onClick={() => setAssignFor(q)} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">{t("dashboard.assignVolunteer")}</Button>
                  ) : q.status === "delivered" ? (
                    <Button size="sm" onClick={() => navigate({ to: "/post" })} className="flex-1 bg-success text-success-foreground hover:bg-success/90">
                      <Megaphone className="mr-1 h-4 w-4" /> {t("dashboard.shareStory")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => navigate({ to: "/tracker" })} className="flex-1">{t("dashboard.viewTracker")}</Button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </main>

      {assignFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setAssignFor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-4 shadow-elevated max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">{t("dashboard.assignVolunteer")}</h3>
            <p className="text-xs text-muted-foreground">For: {assignFor.requester_name} • {assignFor.category}</p>
            <div className="mt-3 space-y-2">
              {rankVolunteers(
                { category: assignFor.category, priority: assignFor.priority, latitude: assignFor.latitude, longitude: assignFor.longitude },
                volunteers,
              ).map((m) => {
                const v = m.volunteer;
                const initials = v.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{v.full_name} <span className="text-xs text-accent">⭐ {v.rating ?? 5}</span></div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.score}% match • {m.skillMatch}% skills
                        {m.distanceKm != null && ` • ${m.distanceKm.toFixed(1)} km`}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => assignVolunteer(assignFor, v.id)} className="bg-primary text-primary-foreground">{t("dashboard.matchAssign")}</Button>
                  </div>
                );
              })}
              {volunteers.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{t("dashboard.noVolunteers")}</div>
              )}
            </div>
            <Button variant="ghost" className="mt-3 w-full" onClick={() => setAssignFor(null)}>{t("common.cancel")}</Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function DynNgo({ name }: { name: string }) {
  const v = useDynamic(name);
  return <>{v}</>;
}
function DynText({ text }: { text: string }) {
  const v = useDynamic(text);
  return <>{v}</>;
}

function timeAgo(iso: string | null) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}
