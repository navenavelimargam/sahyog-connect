import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Camera, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({
  component: HelpRequestPage,
  head: () => ({ meta: [{ title: "Get Help — Sahyog" }] }),
});

const TYPES = [
  { key: "food", emoji: "🍱", label: "Food Emergency", priority: "HIGH PRIORITY", color: "bg-accent text-accent-foreground", border: "border-accent" },
  { key: "medical", emoji: "🏥", label: "Medical Emergency", priority: "CRITICAL", color: "bg-destructive text-destructive-foreground", border: "border-destructive" },
  { key: "shelter", emoji: "🏠", label: "Shelter Needed", priority: "MEDIUM", color: "bg-warning text-warning-foreground", border: "border-warning" },
  { key: "clothes", emoji: "👗", label: "Clothes / Essentials", priority: "LOW", color: "bg-success text-success-foreground", border: "border-success" },
];

const NGO_MATCHES = [
  { emoji: "🍱", name: "Akshaya Patra Foundation", distance: "1.2 km away", rating: 4.9, helped: 312, tags: "Food, Shelter" },
  { emoji: "🌿", name: "Goonj", distance: "2.8 km away", rating: 4.6, helped: 198, tags: "Clothes, Food" },
  { emoji: "😊", name: "Smile India Trust", distance: "4.1 km away", rating: 4.4, helped: 145, tags: "Food, Medical" },
];

function HelpRequestPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
      () => toast.error("Could not get location")
    );
  };

  const submit = async () => {
    if (!user || !type) return;
    setSubmitting(true);
    const priority = TYPES.find((t) => t.key === type)?.priority.toLowerCase() ?? "medium";
    const { error } = await supabase.from("help_requests").insert({
      user_id: user.id,
      category: type,
      priority: priority.includes("critical") ? "critical" : priority.includes("high") ? "high" : priority.includes("medium") ? "medium" : "low",
      description: desc,
      location,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Help request sent! 🆘");
    setSearching(true);
    setTimeout(() => { setSearching(false); setShowMatches(true); }, 1800);
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const selectedType = TYPES.find((t) => t.key === type);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="font-display text-2xl font-bold text-foreground">🆘 Get Help Now</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fast, verified help from nearby NGOs.</p>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {s}
              </div>
              {s < 3 && <div className={cn("h-1 flex-1 rounded-full", step > s ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {showMatches ? (
          <section className="mt-6 space-y-3">
            <h2 className="font-display text-lg font-bold">✨ Matched NGOs near you</h2>
            {NGO_MATCHES.map((n) => (
              <div key={n.name} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">{n.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground">{n.name}</div>
                  <div className="text-xs text-muted-foreground">📍 {n.distance}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-0.5 font-semibold text-accent"><Star className="h-3 w-3 fill-accent" /> {n.rating}</span>
                    <span className="text-muted-foreground">({n.helped} helped)</span>
                    <span className="text-muted-foreground">| {n.tags}</span>
                  </div>
                </div>
                <Button size="sm" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate({ to: "/tracker" })}>
                  Request <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ))}
          </section>
        ) : searching ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 py-16">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/20 animate-pulse-ring" />
              <Loader2 className="absolute inset-0 m-auto h-10 w-10 animate-spin text-primary" />
            </div>
            <p className="font-display text-lg font-bold">🔍 Finding nearby NGOs...</p>
            <p className="text-sm text-muted-foreground">AI matching by distance + rating + skills</p>
          </div>
        ) : (
          <>
            {step === 1 && (
              <section className="mt-6 space-y-3">
                <h2 className="font-display text-lg font-bold">What kind of help?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => { setType(t.key); setStep(2); }}
                      className={cn("rounded-2xl border-2 bg-card p-4 text-left transition hover:scale-[1.02] shadow-card", type === t.key ? t.border : "border-border")}
                    >
                      <div className="text-3xl">{t.emoji}</div>
                      <div className="mt-2 font-bold text-foreground">{t.label}</div>
                      <span className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", t.color)}>{t.priority}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="mt-6 space-y-4">
                <div className="rounded-xl border border-border bg-card p-3 text-sm">
                  <span className="font-semibold">Selected:</span> <span className="text-2xl mr-1">{selectedType?.emoji}</span> {selectedType?.label}
                </div>
                <div className="space-y-2">
                  <Label>Describe your situation</Label>
                  <Textarea rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Be specific so volunteers can help fast..." />
                </div>
                <div className="space-y-2">
                  <Label>Photos / documents (optional)</Label>
                  <button className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-6 text-sm text-muted-foreground hover:border-primary">
                    <Camera className="mb-2 h-6 w-6" /> Tap to upload (JPG, PNG, PDF, MP4)
                  </button>
                </div>
                <div className="space-y-2">
                  <Label>Your location</Label>
                  <div className="flex gap-2">
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter address or use GPS" />
                    <Button type="button" variant="outline" onClick={detectLocation}><MapPin className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={() => setStep(3)} disabled={!desc || !location} className="flex-1 bg-primary text-primary-foreground">
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="mt-6 space-y-4">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
                  <h2 className="font-display text-lg font-bold">Review & Submit</h2>
                  <div><span className="text-xs uppercase text-muted-foreground">Category</span><div className="font-semibold">{selectedType?.emoji} {selectedType?.label}</div></div>
                  <div><span className="text-xs uppercase text-muted-foreground">Description</span><div className="text-sm">{desc}</div></div>
                  <div><span className="text-xs uppercase text-muted-foreground">Location</span><div className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" /> {location}</div></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={submit} disabled={submitting} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Help Request 🆘
                  </Button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
