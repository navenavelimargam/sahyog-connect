import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageCircle, Star, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/tracker")({
  component: TrackerPage,
  head: () => ({ meta: [{ title: "Track Volunteer — Sahyog" }] }),
});

const STEPS = ["Request Sent", "NGO Accepted", "Assigned", "On The Way", "Delivered"];

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
    // simple rating: bump volunteer's rating by averaging towards new value (front-end demo)
    const { data: vol } = await supabase.from("profiles").select("rating, tasks_completed").eq("id", request.assigned_volunteer_id).maybeSingle();
    const prev = vol?.rating ?? 5;
    const tasks = (vol?.tasks_completed ?? 0) + 1;
    const newRating = Number((((prev * (tasks - 1)) + rating) / tasks).toFixed(2));
    await supabase.from("profiles").update({ rating: newRating, tasks_completed: tasks }).eq("id", request.assigned_volunteer_id);
    toast.success("Thanks for your feedback! 🙏");
    if (feedback) {
      await supabase.from("notifications").insert({
        user_id: request.assigned_volunteer_id,
        title: `⭐ ${rating}-star rating from a community member`,
        message: feedback,
        icon: "⭐",
      });
    }
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
        <h1 className="px-1 font-display text-2xl font-bold">🚗 Live Volunteer Tracker</h1>

        {loadingData ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : !request ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No active help request to track. Tap the orange Help button to request help — once an NGO assigns a volunteer, you'll see live updates here.
            <Button onClick={() => navigate({ to: "/help" })} className="mt-4 rounded-full bg-accent text-accent-foreground">Request Help</Button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="text-xs text-muted-foreground uppercase">Tracking</div>
              <div className="mt-1 font-bold">{request.category} request → {request.selected_ngo_name}</div>
              <div className="text-xs text-muted-foreground">📍 {request.location}</div>

              <div className="mt-4 flex items-center justify-between gap-1">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center text-center">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      i < active ? "bg-primary text-primary-foreground" :
                      i === active ? "bg-accent text-accent-foreground animate-pulse" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {i < active ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className={cn("mt-1 text-[10px] font-semibold leading-tight", i <= active ? "text-foreground" : "text-muted-foreground")}>{s}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-success/20 via-primary/10 to-accent/20 shadow-card">
              <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full opacity-40">
                <path d="M40,210 C100,180 180,160 220,120 S320,80 360,40" stroke="currentColor" strokeWidth="3" strokeDasharray="6 6" fill="none" className="text-accent" />
              </svg>
              <div className="absolute bottom-6 left-6 flex flex-col items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-elevated">🟢</div>
                <span className="rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold backdrop-blur">Volunteer</span>
              </div>
              <div className="absolute right-6 top-6 flex flex-col items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-orange">📍</div>
                <span className="rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold backdrop-blur">You</span>
              </div>
              <div className="absolute top-3 right-3 rounded-full bg-destructive/95 px-3 py-1 text-xs font-bold text-destructive-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-white" />LIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-accent p-4 text-accent-foreground shadow-orange">
              <div>
                <div className="text-xs uppercase opacity-80">Estimated Arrival</div>
                <div className="font-display text-2xl font-bold">
                  {request.status === "delivered" ? "Arrived!" :
                   request.eta_minutes != null ? `${request.eta_minutes} min` :
                   request.assigned_volunteer_id ? "Awaiting volunteer ETA…" : "Awaiting assignment…"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase opacity-80">Status</div>
                <div className="font-display text-2xl font-bold capitalize">{request.status.replace("_", " ")}</div>
              </div>
            </div>

            {request.assigned_volunteer_id && request.volunteer_name && (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{request.volunteer_initials}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="font-bold">{request.volunteer_name}</span><VerifiedBadge kind="volunteer" /></div>
                    <div className="text-xs text-muted-foreground">{request.selected_ngo_name} • ⭐ {(request.volunteer_rating ?? 5).toFixed(1)}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">Skills: {request.volunteer_skills?.join(", ") || "General"}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => toast.success(`Calling ${request.volunteer_name}...`)} className="flex-1 bg-success text-success-foreground hover:bg-success/90"><Phone className="mr-1 h-4 w-4" /> Call</Button>
                  <Button onClick={() => toast.info("Chat coming soon")} variant="outline" className="flex-1"><MessageCircle className="mr-1 h-4 w-4" /> Message</Button>
                </div>
              </div>
            )}

            {request.status === "delivered" && role !== "volunteer" && request.assigned_volunteer_id && (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <h3 className="font-display text-lg font-bold">⭐ Rate {request.volunteer_name}</h3>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)}>
                      <Star className={cn("h-7 w-7", n <= rating ? "fill-accent text-accent" : "text-muted-foreground")} />
                    </button>
                  ))}
                </div>
                <Textarea rows={3} className="mt-3" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us about your experience…" />
                <Button disabled={rating === 0} onClick={submitRating} className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90">Submit Rating</Button>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
