import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { DT } from "@/components/DT";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageCircle, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StatusTimeline } from "@/components/StatusTimeline";

export const Route = createFileRoute("/tracker")({
  component: TrackerPage,
  head: () => ({ meta: [{ title: "Track Volunteer — Sahyog" }] }),
});

interface Tracked {
  id: string;
  status: string;
  category: string;
  location: string;
  selected_ngo_name: string | null;
  assigned_volunteer_id: string | null;
  eta_minutes: number | null;
  created_at: string | null;
  user_id: string;
  volunteer_name?: string;
  volunteer_skills?: string[] | null;
  volunteer_rating?: number | null;
  volunteer_initials?: string;
}

function TrackerPage() {
  const { t } = useTranslation();
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Tracked | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "user" } });
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    // Find the most recent active request for this user (or one assigned via NGO)
    const { data } = await supabase
      .from("help_requests")
      .select("id, user_id, status, category, location, selected_ngo_name, assigned_volunteer_id, eta_minutes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = data?.[0];
    if (!row) { setRequest(null); setLoadingData(false); return; }

    let enriched: Tracked = { ...row };
    if (row.assigned_volunteer_id) {
      const { data: vp } = await supabase
        .from("profiles")
        .select("full_name, skills, rating")
        .eq("id", row.assigned_volunteer_id)
        .maybeSingle();
      if (vp) {
        enriched = {
          ...enriched,
          volunteer_name: vp.full_name,
          volunteer_skills: vp.skills,
          volunteer_rating: vp.rating,
          volunteer_initials: vp.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase(),
        };
      }
    }
    setRequest(enriched);
    setLoadingData(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("user-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "help_requests", filter: `user_id=eq.${user.id}` }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const submitRating = async () => {
    if (!request?.assigned_volunteer_id || rating === 0) return;
    const { error } = await supabase.rpc("rate_assigned_volunteer", {
      _request_id: request.id,
      _rating: rating,
      _feedback: feedback || "",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for your feedback! 🙏");
    navigate({ to: "/feed" });
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  // map status to step index
  const statusToStep: Record<string, number> = {
    pending: 0,
    accepted: request?.assigned_volunteer_id ? 2 : 1,
    on_the_way: 3,
    delivered: 4,
  };
  const active = request ? (statusToStep[request.status] ?? 0) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="mx-auto max-w-2xl space-y-4 px-3 py-4">
        <h1 className="px-1 font-display text-2xl font-bold">{t("tracker.title")}</h1>

        {loadingData ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : !request ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("tracker.noActive")}
            <Button onClick={() => navigate({ to: "/help" })} className="mt-4 rounded-full bg-accent text-accent-foreground">{t("tracker.requestHelp")}</Button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="text-xs text-muted-foreground uppercase">{t("tracker.tracking")}</div>
              <div className="mt-1 font-bold"><DT>{request.category}</DT> → <DT>{request.selected_ngo_name ?? ""}</DT></div>
              <div className="text-xs text-muted-foreground">📍 <DT>{request.location}</DT></div>

              <div className="mt-4">
                <StatusTimeline status={request.status} hasVolunteer={!!request.assigned_volunteer_id} updatedAt={request.created_at} />
              </div>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-success/20 via-primary/10 to-accent/20 shadow-card">
              <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full opacity-40">
                <path d="M40,210 C100,180 180,160 220,120 S320,80 360,40" stroke="currentColor" strokeWidth="3" strokeDasharray="6 6" fill="none" className="text-accent" />
              </svg>
              <div className="absolute top-3 right-3 rounded-full bg-destructive/95 px-3 py-1 text-xs font-bold text-destructive-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-white" />LIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-accent p-4 text-accent-foreground shadow-orange">
              <div>
                <div className="text-xs uppercase opacity-80">{t("tracker.eta")}</div>
                <div className="font-display text-2xl font-bold">
                  {request.status === "delivered" ? t("tracker.arrived") :
                   request.eta_minutes != null ? `${request.eta_minutes} min` :
                   request.assigned_volunteer_id ? t("tracker.awaitingEta") : t("tracker.awaitingAssignment")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase opacity-80">{t("tracker.status")}</div>
                <div className="font-display text-2xl font-bold capitalize">{request.status.replace("_", " ")}</div>
              </div>
            </div>

            {request.assigned_volunteer_id && request.volunteer_name && (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{request.volunteer_initials}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="font-bold"><DT>{request.volunteer_name}</DT></span><VerifiedBadge kind="volunteer" /></div>
                    <div className="text-xs text-muted-foreground"><DT>{request.selected_ngo_name ?? ""}</DT> • ⭐ {(request.volunteer_rating ?? 5).toFixed(1)}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{t("tracker.skills")}: <DT>{request.volunteer_skills?.join(", ") || "General"}</DT></div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => toast.success(`Calling ${request.volunteer_name}...`)} className="flex-1 bg-success text-success-foreground hover:bg-success/90"><Phone className="mr-1 h-4 w-4" /> {t("tracker.call")}</Button>
                  <Button onClick={() => toast.info("Chat coming soon")} variant="outline" className="flex-1"><MessageCircle className="mr-1 h-4 w-4" /> {t("tracker.message")}</Button>
                </div>
              </div>
            )}

            {request.status === "delivered" && role !== "volunteer" && request.assigned_volunteer_id && (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <h3 className="font-display text-lg font-bold">⭐ {t("tracker.rateTitle")} — <DT>{request.volunteer_name ?? ""}</DT></h3>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)}>
                      <Star className={cn("h-7 w-7", n <= rating ? "fill-accent text-accent" : "text-muted-foreground")} />
                    </button>
                  ))}
                </div>
                <Textarea rows={3} className="mt-3" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={t("tracker.experiencePlaceholder")} />
                <Button disabled={rating === 0} onClick={submitRating} className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90">{t("tracker.submitRating")}</Button>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
