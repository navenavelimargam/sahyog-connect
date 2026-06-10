import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Camera, ChevronRight, Building2, CheckCircle2, X, Sparkles, AlertTriangle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploads";
import { getCurrentPosition, formatCoords, type Coords } from "@/lib/geolocation";
import { classifyPriority } from "@/lib/ai-priority.functions";
import { recommendNgo } from "@/lib/ngo-matcher";

export const Route = createFileRoute("/help")({
  component: HelpRequestPage,
  head: () => ({ meta: [{ title: "Get Help — Sahyog" }] }),
});

const TYPES = [
  { key: "food", emoji: "🍱", color: "bg-accent text-accent-foreground", border: "border-accent" },
  { key: "medical", emoji: "🏥", color: "bg-destructive text-destructive-foreground", border: "border-destructive" },
  { key: "shelter", emoji: "🏠", color: "bg-warning text-warning-foreground", border: "border-warning" },
  { key: "clothes", emoji: "👗", color: "bg-success text-success-foreground", border: "border-success" },
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

const PRIORITY_CHIP: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-accent text-accent-foreground",
  medium: "bg-warning text-warning-foreground",
  low: "bg-success text-success-foreground",
};

function HelpRequestPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const classify = useServerFn(classifyPriority);

  const [step, setStep] = useState(1);
  const [type, setType] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [selectedNgo, setSelectedNgo] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // GPS state — captured automatically on mount, never typed.
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoStatus, setGeoStatus] = useState<"detecting" | "ok" | "denied">("detecting");
  const [geoError, setGeoError] = useState<string>("");

  // AI classification result.
  const [aiPriority, setAiPriority] = useState<{ priority: string; reason: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "user" } });
  }, [user, loading, navigate]);

  // Auto-trigger geolocation on mount — ZERO INPUT.
  const captureLocation = async () => {
    setGeoStatus("detecting");
    setGeoError("");
    try {
      const c = await getCurrentPosition();
      setCoords(c);
      setGeoStatus("ok");
    } catch (e) {
      setGeoStatus("denied");
      setGeoError(e instanceof Error ? e.message : "Unable to detect location");
    }
  };
  useEffect(() => { captureLocation(); }, []);

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

  // Run AI priority classification when leaving the description step.
  const runAiClassification = async () => {
    if (!type || !desc.trim()) return;
    setAiBusy(true);
    try {
      const result = await classify({ data: { description: desc, category: type } });
      setAiPriority(result);
    } catch {
      setAiPriority({ priority: "medium", reason: "AI unavailable — defaulted to medium." });
    } finally {
      setAiBusy(false);
    }
  };

  const submit = async () => {
    if (!user || !type || !selectedNgo || !coords) return;
    setSubmitting(true);
    try {
      const paths = files.length > 0 ? await uploadFiles(user.id, files) : [];
      const finalPriority = aiPriority?.priority ?? "medium";
      const { error } = await supabase.from("help_requests").insert({
        user_id: user.id,
        category: type,
        priority: finalPriority,
        description: desc,
        location: formatCoords(coords),
        latitude: coords.lat,
        longitude: coords.lng,
        ai_reason: aiPriority?.reason ?? null,
        selected_ngo_name: selectedNgo,
        image_urls: paths,
        status: "pending",
      });
      if (error) throw error;
      toast.success(`${t("help.sent")} → ${selectedNgo} 🆘`);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const selectedType = TYPES.find((tp) => tp.key === type);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("help.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("help.subtitle")}</p>

        {/* Live GPS status banner — always visible while wizard is open */}
        <div className={cn(
          "mt-3 flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-sm shadow-card",
          geoStatus === "ok" ? "border-success/40 bg-success/10" :
          geoStatus === "denied" ? "border-destructive/40 bg-destructive/10" :
          "border-primary/40 bg-primary/10",
        )}>
          <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", geoStatus === "ok" ? "text-success" : geoStatus === "denied" ? "text-destructive" : "text-primary animate-pulse")} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">
              {geoStatus === "detecting" && t("help.detecting")}
              {geoStatus === "ok" && t("help.locationCaptured")}
              {geoStatus === "denied" && t("help.locationDenied")}
            </div>
            {coords && <div className="text-[11px] text-muted-foreground">{formatCoords(coords)} (±{Math.round(coords.accuracy ?? 0)}m)</div>}
            {geoStatus === "denied" && geoError && <div className="text-[11px] text-muted-foreground">{geoError}</div>}
          </div>
          {geoStatus === "denied" && (
            <Button size="sm" variant="outline" onClick={captureLocation}>{t("help.retry")}</Button>
          )}
        </div>

        {!done && (
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{s}</div>
                {s < 4 && <div className={cn("h-1 flex-1 rounded-full", step > s ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        )}

        {done ? (
          <section className="mt-8 rounded-2xl border border-success/40 bg-success/10 p-6 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-3 font-display text-xl font-bold">{t("help.sent")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedNgo}</span> supervisors have been notified. Your GPS location was sent automatically.
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
                <h2 className="font-display text-lg font-bold">{t("help.category")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {TYPES.map((tp) => (
                    <button
                      key={tp.key}
                      onClick={() => { setType(tp.key); setStep(2); }}
                      className={cn("rounded-2xl border-2 bg-card p-4 text-left transition hover:scale-[1.02] shadow-card", type === tp.key ? tp.border : "border-border")}
                    >
                      <div className="text-3xl">{tp.emoji}</div>
                      <div className="mt-2 font-bold text-foreground">{t(`categories.${tp.key}`)}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="mt-6 space-y-4">
                <div className="rounded-xl border border-border bg-card p-3 text-sm">
                  <span className="font-semibold">{t("common.selected")}:</span> <span className="text-2xl mr-1">{selectedType?.emoji}</span> {selectedType ? t(`categories.${selectedType.key}`) : ""}
                </div>
                <div className="space-y-2">
                  <Label>{t("help.describe")}</Label>
                  <Textarea rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("help.describePlaceholder")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("help.photos")}</Label>
                  <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }} />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={files.length >= 4}
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-6 text-sm text-muted-foreground hover:border-primary disabled:opacity-50"
                  >
                    <Camera className="mb-2 h-6 w-6" /> {files.length === 0 ? t("help.uploadPhotos") : `${t("help.addMore")} (${files.length}/4)`}
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">{t("common.back")}</Button>
                  <Button
                    onClick={async () => { await runAiClassification(); setStep(3); }}
                    disabled={!desc.trim()}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    {t("common.next")} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="mt-6 space-y-3">
                {/* AI priority badge */}
                <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-3 shadow-card">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-bold text-primary">
                        {aiBusy ? t("help.aiAnalyzing") : t("help.aiClassified")}
                      </div>
                      {aiPriority && !aiBusy && (
                        <>
                          <div className="mt-1">
                            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", PRIORITY_CHIP[aiPriority.priority])}>
                              {t(`priority.${aiPriority.priority}`)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{aiPriority.reason}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <h2 className="font-display text-lg font-bold">{t("help.chooseNgo")}</h2>
                <p className="text-xs text-muted-foreground">{t("help.ngoHint")}</p>
                <div className="space-y-2">
                  {NGO_OPTIONS.map((n) => (
                    <button
                      key={n.name}
                      onClick={() => setSelectedNgo(n.name)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-3 text-left shadow-card transition hover:bg-muted/40",
                        selectedNgo === n.name ? "border-primary" : "border-border",
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
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">{t("common.back")}</Button>
                  <Button onClick={() => setStep(4)} disabled={!selectedNgo} className="flex-1 bg-primary text-primary-foreground">
                    {t("help.review")} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="mt-6 space-y-4">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
                  <h2 className="font-display text-lg font-bold">{t("help.review")}</h2>
                  <div><span className="text-xs uppercase text-muted-foreground">{t("help.category")}</span><div className="font-semibold">{selectedType?.emoji} {selectedType ? t(`categories.${selectedType.key}`) : ""}</div></div>
                  {aiPriority && (
                    <div>
                      <span className="text-xs uppercase text-muted-foreground">AI Priority</span>
                      <div className="mt-0.5">
                        <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", PRIORITY_CHIP[aiPriority.priority])}>
                          {t(`priority.${aiPriority.priority}`)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div><span className="text-xs uppercase text-muted-foreground">Description</span><div className="text-sm">{desc}</div></div>
                  <div>
                    <span className="text-xs uppercase text-muted-foreground">{t("help.yourLocation")}</span>
                    <div className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" /> {coords ? formatCoords(coords) : "—"}</div>
                  </div>
                  <div><span className="text-xs uppercase text-muted-foreground">NGO</span><div className="text-sm flex items-center gap-1"><Building2 className="h-3 w-3" /> {selectedNgo}</div></div>
                </div>
                {!coords && (
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Location is required. Please enable GPS and tap Retry above.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">{t("common.back")}</Button>
                  <Button onClick={submit} disabled={submitting || !coords} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("help.send")}
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
