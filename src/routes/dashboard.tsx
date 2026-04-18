import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Loader2, Sparkles, MapPin, Clock, Phone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: NGODashboard,
  head: () => ({ meta: [{ title: "NGO Dashboard — Sahyog" }] }),
});

const QUEUE = [
  { id: 1, level: "CRITICAL", color: "border-l-destructive bg-destructive/5", chip: "bg-destructive text-destructive-foreground", category: "Medical", name: "Priya Sharma", area: "Dharampeth, Nagpur", desc: "Elderly mother needs insulin urgently", distance: "1.2 km", time: "3 min ago" },
  { id: 2, level: "HIGH", color: "border-l-accent bg-accent/5", chip: "bg-accent text-accent-foreground", category: "Food", name: "Raju Verma", area: "Gandhibagh, Nagpur", desc: "Family of 6 without food for 2 days", distance: "2.8 km", time: "8 min ago" },
  { id: 3, level: "MEDIUM", color: "border-l-warning bg-warning/5", chip: "bg-warning text-warning-foreground", category: "Shelter", name: "Meena Devi", area: "Kalamna, Nagpur", desc: "Family displaced due to house damage", distance: "4.1 km", time: "22 min ago" },
  { id: 4, level: "LOW", color: "border-l-success bg-success/5", chip: "bg-success text-success-foreground", category: "Clothes", name: "Anita Bai", area: "Hingna, Nagpur", desc: "Need winter clothes for 4 children", distance: "6.2 km", time: "1 hr ago" },
];

const VOLUNTEERS = [
  { name: "Suresh Patil", rating: 4.9, distance: "0.8 km", skills: "Food, First Aid", initials: "SP" },
  { name: "Anjali Deshmukh", rating: 4.7, distance: "1.5 km", skills: "Medical, Rescue", initials: "AD" },
  { name: "Vikram Singh", rating: 4.8, distance: "2.1 km", skills: "Transport, Shelter", initials: "VS" },
];

function NGODashboard() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const [assignFor, setAssignFor] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      {/* NGO header */}
      <header className="gradient-hero text-white shadow-elevated">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">{profile?.ngo_name || "Goonj NGO"}</h1>
            <VerifiedBadge kind="ngo" className="bg-white/20 text-white" />
          </div>
          <p className="text-sm text-white/80">Zone: Nagpur East • Supervisor</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              { k: "Pending", v: 4 },
              { k: "Active", v: 12 },
              { k: "Volunteers", v: 23 },
              { k: "Success", v: "94%" },
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
        {/* AI Panel */}
        <div className="rounded-2xl border-2 border-success/30 bg-success/10 p-4 shadow-card">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-success p-1.5"><Sparkles className="h-4 w-4 text-success-foreground" /></div>
            <div className="flex-1">
              <div className="font-bold text-success">🤖 Gemini AI Risk Score</div>
              <p className="mt-1 text-sm text-foreground"><span className="font-semibold">Priority:</span> Medical (Critical) → Food (High) → Shelter (Medium)</p>
              <p className="mt-1 text-sm text-foreground"><span className="font-semibold">Nearest match:</span> Suresh Patil (0.8 km, Food + First Aid)</p>
              <p className="mt-1 text-sm font-semibold text-success">Recommendation: Dispatch Suresh Patil → Priya Sharma immediately.</p>
            </div>
          </div>
        </div>

        {/* Queue */}
        <h2 className="px-1 font-display text-lg font-bold">📥 Risk Priority Queue</h2>
        {QUEUE.map((q) => (
          <article key={q.id} className={cn("rounded-2xl border border-l-4 border-border bg-card p-4 shadow-card", q.color)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", q.chip)}>{q.level} • {q.category}</span>
                <div className="mt-2 font-bold text-foreground">{q.name} • <span className="text-sm font-normal text-muted-foreground">{q.area}</span></div>
                <p className="mt-1 text-sm text-foreground">"{q.desc}"</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {q.distance}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {q.time}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => setAssignFor(q.id)} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Assign Volunteer</Button>
              <Button size="sm" variant="outline" className="flex-1">View Details</Button>
            </div>
          </article>
        ))}

        {/* Live map mockup */}
        <h2 className="px-1 font-display text-lg font-bold">🗺 Live Map</h2>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-success/20 via-primary/10 to-accent/20 shadow-card">
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full opacity-30">
            <path d="M0,150 Q100,100 200,150 T400,150" stroke="currentColor" strokeWidth="1" fill="none" className="text-primary" />
            <path d="M0,200 Q100,250 200,200 T400,200" stroke="currentColor" strokeWidth="1" fill="none" className="text-primary" />
          </svg>
          <div className="absolute left-[20%] top-[40%] flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-elevated">🏛</div>
          <div className="absolute left-[60%] top-[30%] flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-orange">📍</div>
          <div className="absolute left-[40%] top-[55%] flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-orange">📍</div>
          <div className="absolute left-[70%] top-[60%] flex h-6 w-6 items-center justify-center rounded-full bg-success text-white shadow-elevated animate-pulse">🟢</div>
          <div className="absolute bottom-3 left-3 rounded-full bg-card/90 backdrop-blur px-3 py-1.5 text-xs font-semibold shadow-card">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />LIVE Map (Google Maps placeholder)</span>
          </div>
        </div>
      </main>

      {/* Assign modal */}
      {assignFor !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setAssignFor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-4 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">Assign a volunteer</h3>
            <p className="text-xs text-muted-foreground">Sorted by AI relevance</p>
            <div className="mt-3 space-y-2">
              {VOLUNTEERS.map((v) => (
                <div key={v.name} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{v.initials}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{v.name} <span className="text-xs text-accent">⭐ {v.rating}</span></div>
                    <div className="text-xs text-muted-foreground">{v.distance} • {v.skills}</div>
                  </div>
                  <Button size="sm" onClick={() => { setAssignFor(null); navigate({ to: "/tracker" }); }} className="bg-primary text-primary-foreground">Assign</Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="mt-3 w-full" onClick={() => setAssignFor(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// silence unused import warnings
void Phone; void MessageCircle;
