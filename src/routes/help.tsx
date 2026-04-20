import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Camera, ChevronRight, Building2, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploads";

export const Route = createFileRoute("/help")({
  component: HelpRequestPage,
  head: () => ({ meta: [{ title: "Get Help — Sahyog" }] }),
});

const TYPES = [
  { key: "food", emoji: "🍱", label: "Food Emergency", priority: "high", priorityLabel: "HIGH PRIORITY", color: "bg-accent text-accent-foreground", border: "border-accent" },
  { key: "medical", emoji: "🏥", label: "Medical Emergency", priority: "critical", priorityLabel: "CRITICAL", color: "bg-destructive text-destructive-foreground", border: "border-destructive" },
  { key: "shelter", emoji: "🏠", label: "Shelter Needed", priority: "medium", priorityLabel: "MEDIUM", color: "bg-warning text-warning-foreground", border: "border-warning" },
  { key: "clothes", emoji: "👗", label: "Clothes / Essentials", priority: "low", priorityLabel: "LOW", color: "bg-success text-success-foreground", border: "border-success" },
];

const NGO_OPTIONS = [
  { name: "Akshaya Patra Foundation", emoji: "🍱", tags: "Food, Education" },
  { name: "Goonj", emoji: "🌿", tags: "Clothes, Disaster Relief" },
  { name: "Smile India Trust", emoji: "😊", tags: "Food, Medical" },
  { name: "Médecins Sans Frontières India", emoji: "🩺", tags: "Medical, Emergency" },
  { name: "HelpAge India", emoji: "👵", tags: "Elderly Care, Health" },
  { name: "Green Yatra", emoji: "🌳", tags: "Environment" },
  { name: "Indian Red Cross Society", emoji: "🩸", tags: "Blood, Emergency" },
  { name: "CRY — Child Rights and You", emoji: "🧒", tags: "Children, Education" },
];

function HelpRequestPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [selectedNgo, setSelectedNgo] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).slice(0, 4 - files.length).filter((f) => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} is over 5MB`); return false; }
      return true;
    });
    setFiles((p) => [...p, ...picked]);
    setPreviews((p) => [...p, ...picked.map((f) => URL.createObjectURL(f))]);
  };
  const removeFile = (i: number) => {
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => { const u = p[i]; if (u) URL.revokeObjectURL(u); return p.filter((_, idx) => idx !== i); });
  };

  const submit = async () => {
    if (!user || !type || !selectedNgo) return;
    setSubmitting(true);
    try {
      const t = TYPES.find((x) => x.key === type)!;
      const paths = files.length > 0 ? await uploadFiles(user.id, files) : [];
      const { error } = await supabase.from("help_requests").insert({
        user_id: user.id,
        category: type,
        priority: t.priority,
        description: desc,
        location,
        selected_ngo_name: selectedNgo,
        image_urls: paths,
        status: "pending",
      });
      if (error) throw error;
      toast.success(`Request sent to ${selectedNgo} 🆘`);
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit request";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const selectedType = TYPES.find((t) => t.key === type);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="font-display text-2xl font-bold text-foreground">🆘 Get Help Now</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a category, tell us what you need, then choose an NGO.</p>

        {!done && (
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {s}
                </div>
                {s < 4 && <div className={cn("h-1 flex-1 rounded-full", step > s ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        )}

        {done ? (
          <section className="mt-8 rounded-2xl border border-success/40 bg-success/10 p-6 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-3 font-display text-xl font-bold">Request sent successfully!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedNgo}</span> supervisors have been notified. They'll choose a volunteer and you'll get an alert here and on the tracker.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => navigate({ to: "/tracker" })} className="flex-1 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">Open Tracker</Button>
              <Button onClick={() => navigate({ to: "/feed" })} variant="outline" className="flex-1 rounded-full">Back to Feed</Button>
            </div>
          </section>
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
                      <span className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", t.color)}>{t.priorityLabel}</span>
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
                  <Label>Photos (optional, up to 4 — max 5MB each)</Label>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={files.length >= 4}
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-6 text-sm text-muted-foreground hover:border-primary disabled:opacity-50"
                  >
                    <Camera className="mb-2 h-6 w-6" /> {files.length === 0 ? "Tap to upload photos" : `Add more (${files.length}/4)`}
                  </button>
                  {previews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {previews.map((url, i) => (
                        <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                          <img src={url} alt={`preview-${i}`} className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeFile(i)} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white" aria-label="Remove">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
              <section className="mt-6 space-y-3">
                <h2 className="font-display text-lg font-bold">Choose an NGO</h2>
                <p className="text-xs text-muted-foreground">The NGO supervisor will receive your request and assign one of their volunteers.</p>
                <div className="space-y-2">
                  {NGO_OPTIONS.map((n) => (
                    <button
                      key={n.name}
                      onClick={() => setSelectedNgo(n.name)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-3 text-left shadow-card transition hover:bg-muted/40",
                        selectedNgo === n.name ? "border-primary" : "border-border"
                      )}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">{n.emoji}</div>
                      <div className="flex-1">
                        <div className="font-bold text-foreground">{n.name}</div>
                        <div className="text-xs text-muted-foreground">{n.tags}</div>
                      </div>
                      {selectedNgo === n.name && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={() => setStep(4)} disabled={!selectedNgo} className="flex-1 bg-primary text-primary-foreground">
                    Review <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="mt-6 space-y-4">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
                  <h2 className="font-display text-lg font-bold">Review & Submit</h2>
                  <div><span className="text-xs uppercase text-muted-foreground">Category</span><div className="font-semibold">{selectedType?.emoji} {selectedType?.label}</div></div>
                  <div><span className="text-xs uppercase text-muted-foreground">Description</span><div className="text-sm">{desc}</div></div>
                  <div><span className="text-xs uppercase text-muted-foreground">Location</span><div className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" /> {location}</div></div>
                  <div><span className="text-xs uppercase text-muted-foreground">NGO</span><div className="text-sm flex items-center gap-1"><Building2 className="h-3 w-3" /> {selectedNgo}</div></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
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
