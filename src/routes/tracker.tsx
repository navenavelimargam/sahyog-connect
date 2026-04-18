import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Phone, MessageCircle, Star, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/tracker")({
  component: TrackerPage,
  head: () => ({ meta: [{ title: "Track Volunteer — Sahyog" }] }),
});

const STEPS = ["Request Sent", "NGO Accepted", "Assigned", "On The Way", "Delivered"];

function TrackerPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(3); // "On The Way"
  const [eta, setEta] = useState(12);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const t = setInterval(() => setEta((e) => Math.max(0, e - 1)), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (eta === 0) setActive(4);
  }, [eta]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="mx-auto max-w-2xl space-y-4 px-3 py-4">
        <h1 className="px-1 font-display text-2xl font-bold">🚗 Live Volunteer Tracker</h1>

        {/* Progress */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between gap-1">
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
                {i < STEPS.length - 1 && <div className={cn("absolute h-0.5 w-full", i < active ? "bg-primary" : "bg-muted")} style={{ marginLeft: "50%", marginTop: 16, zIndex: -1 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Map mockup */}
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

        {/* ETA bar */}
        <div className="flex items-center justify-between rounded-2xl bg-accent p-4 text-accent-foreground shadow-orange">
          <div>
            <div className="text-xs uppercase opacity-80">Estimated Arrival</div>
            <div className="font-display text-2xl font-bold">{eta > 0 ? `${eta} min` : "Arrived!"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase opacity-80">Distance</div>
            <div className="font-display text-2xl font-bold">1.8 km</div>
          </div>
        </div>

        {/* Volunteer card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">SP</div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="font-bold">Suresh Patil</span><VerifiedBadge kind="volunteer" /></div>
              <div className="text-xs text-muted-foreground">Goonj NGO • ⭐ 4.9 (89 tasks)</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Skills: Food Distribution, First Aid</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => toast.success("Calling Suresh...")} className="flex-1 bg-success text-success-foreground hover:bg-success/90"><Phone className="mr-1 h-4 w-4" /> Call</Button>
            <Button onClick={() => toast.info("Chat coming soon")} variant="outline" className="flex-1"><MessageCircle className="mr-1 h-4 w-4" /> Message</Button>
          </div>
        </div>

        {/* Rating */}
        {active >= 4 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <h3 className="font-display text-lg font-bold">⭐ Rate Your Experience</h3>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star className={cn("h-7 w-7", n <= rating ? "fill-accent text-accent" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
            <Textarea rows={3} className="mt-3" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us about your experience…" />
            <Button onClick={() => { toast.success("Thanks for your feedback! 🙏"); navigate({ to: "/feed" }); }} className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90">Submit Rating</Button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
