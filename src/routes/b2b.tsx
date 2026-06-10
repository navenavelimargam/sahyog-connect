import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldAlert, HandHeart, Clock, Plus, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/b2b")({
  component: B2BMarketplace,
  head: () => ({ meta: [{ title: "B2B Marketplace — Sahyog" }] }),
});

type Category = "food_supplies" | "financial_aid" | "medical_appliances";
type Urgency = "low" | "medium" | "high" | "critical";
type Status = "open" | "fulfilling" | "closed";

interface B2BRow {
  id: string;
  ngo_id: string;
  ngo_name: string;
  category: Category;
  urgency: Urgency;
  quantity: string;
  description: string;
  needed_by: string | null;
  status: Status;
  supporter_id: string | null;
  supporter_ngo_name: string | null;
  city: string | null;
  created_at: string;
}

const URGENCY_CHIP: Record<Urgency, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-accent text-accent-foreground",
  medium: "bg-warning text-warning-foreground",
  low: "bg-success text-success-foreground",
};

const CAT_EMOJI: Record<Category, string> = {
  food_supplies: "🍱",
  financial_aid: "💰",
  medical_appliances: "🏥",
};

function B2BMarketplace() {
  const { t } = useTranslation();
  const { user, loading, profile, role } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<B2BRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [category, setCategory] = useState<Category>("food_supplies");
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "ngo" } });
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    if (role !== "ngo_supervisor") { setLoadingData(false); return; }
    setLoadingData(true);
    const { data, error } = await supabase
      .from("b2b_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setRows((data as B2BRow[] | null) ?? []);
    setLoadingData(false);
  }, [role]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (role !== "ngo_supervisor") return;
    const ch = supabase
      .channel("b2b-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "b2b_requests" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role, load]);

  const submit = async () => {
    if (!user || !profile?.ngo_name) { toast.error("NGO profile required"); return; }
    if (!quantity.trim() || !description.trim()) { toast.error("Fill all required fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("b2b_requests").insert({
      ngo_id: user.id,
      ngo_name: profile.ngo_name,
      category,
      urgency,
      quantity: quantity.trim(),
      description: description.trim(),
      needed_by: neededBy || null,
      city: profile.city ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("b2b.posted"));
    setShowForm(false);
    setQuantity(""); setDescription(""); setNeededBy(""); setUrgency("medium"); setCategory("food_supplies");
    load();
  };

  const lendSupport = async (row: B2BRow) => {
    if (!user || !profile?.ngo_name) return;
    const { error } = await supabase
      .from("b2b_requests")
      .update({ supporter_id: user.id, supporter_ngo_name: profile.ngo_name, status: "fulfilling" })
      .eq("id", row.id)
      .eq("status", "open");
    if (error) { toast.error(error.message); return; }
    toast.success(t("b2b.claimedToast"));
    load();
  };

  const markFulfilled = async (row: B2BRow) => {
    const { error } = await supabase.from("b2b_requests").update({ status: "closed" }).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("b2b.fulfilledToast"));
    load();
  };

  const deleteRow = async (row: B2BRow) => {
    const { error } = await supabase.from("b2b_requests").delete().eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (role !== "ngo_supervisor") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-3 font-display text-xl font-bold">{t("b2b.supervisorsOnly")}</h1>
          <Button onClick={() => navigate({ to: "/feed" })} className="mt-4 rounded-full bg-primary text-primary-foreground">{t("common.back")}</Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const peerFeed = rows.filter((r) => r.ngo_id !== user.id);
  const myRequests = rows.filter((r) => r.ngo_id === user.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <header className="gradient-hero text-white shadow-elevated">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <h1 className="font-display text-xl font-bold">{t("b2b.title")}</h1>
          <p className="mt-1 text-sm text-white/80">{t("b2b.subtitle")}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-3 py-4">
        <Button onClick={() => setShowForm((v) => !v)} className="w-full rounded-full bg-primary text-primary-foreground">
          {showForm ? <><X className="mr-1 h-4 w-4" /> {t("common.close")}</> : <><Plus className="mr-1 h-4 w-4" /> {t("b2b.newRequest")}</>}
        </Button>

        {showForm && (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
            <h2 className="font-display text-base font-bold">{t("b2b.newRequest")}</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("b2b.category")}</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food_supplies">🍱 {t("b2b.cat_food_supplies")}</SelectItem>
                    <SelectItem value="financial_aid">💰 {t("b2b.cat_financial_aid")}</SelectItem>
                    <SelectItem value="medical_appliances">🏥 {t("b2b.cat_medical_appliances")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("b2b.urgency")}</Label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("priority.low")}</SelectItem>
                    <SelectItem value="medium">{t("priority.medium")}</SelectItem>
                    <SelectItem value="high">{t("priority.high")}</SelectItem>
                    <SelectItem value="critical">{t("priority.critical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t("b2b.quantity")}</Label>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={t("b2b.quantityPlaceholder")} />
            </div>
            <div>
              <Label>{t("b2b.description")}</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("b2b.descriptionPlaceholder")} />
            </div>
            <div>
              <Label>{t("b2b.neededBy")}</Label>
              <Input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("b2b.post")}
            </Button>
          </section>
        )}

        <h2 className="px-1 font-display text-lg font-bold">🌐 {t("b2b.peerFeed")}</h2>
        {loadingData ? (
          <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : peerFeed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">{t("b2b.noPeerRequests")}</div>
        ) : (
          peerFeed.map((r) => <B2BCard key={r.id} row={r} userId={user.id} onLend={() => lendSupport(r)} onMarkFulfilled={() => markFulfilled(r)} />)
        )}

        <h2 className="px-1 font-display text-lg font-bold pt-2">📤 {t("b2b.myRequests")}</h2>
        {myRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">{t("b2b.noMyRequests")}</div>
        ) : (
          myRequests.map((r) => (
            <div key={r.id} className="relative">
              <B2BCard row={r} userId={user.id} onLend={() => lendSupport(r)} onMarkFulfilled={() => markFulfilled(r)} />
              <Button size="sm" variant="ghost" onClick={() => deleteRow(r)} className="absolute right-2 top-2 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function B2BCard({ row, userId, onLend, onMarkFulfilled }: { row: B2BRow; userId: string; onLend: () => void; onMarkFulfilled: () => void }) {
  const { t } = useTranslation();
  const isMine = row.ngo_id === userId;
  const iAmSupporter = row.supporter_id === userId;
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-2">
        <div className="text-3xl">{CAT_EMOJI[row.category]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", URGENCY_CHIP[row.urgency])}>{t(`priority.${row.urgency}`)}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{t(`b2b.cat_${row.category}`)}</span>
            {row.status === "fulfilling" && <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-bold">{t("b2b.fulfilledBy")} {row.supporter_ngo_name}</span>}
            {row.status === "closed" && <span className="rounded-full bg-success/20 text-success px-2 py-0.5 text-[10px] font-bold">✓ Closed</span>}
          </div>
          <div className="mt-1 font-bold text-foreground truncate">{row.quantity}</div>
          <p className="mt-1 text-sm text-foreground">{row.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span>{t("b2b.postedBy")}: <b>{row.ngo_name}</b>{row.city ? ` • ${row.city}` : ""}</span>
            {row.needed_by && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t("b2b.needsBy")} {row.needed_by}</span>}
          </div>
          {!isMine && row.status === "open" && (
            <Button size="sm" onClick={onLend} className="mt-3 w-full bg-primary text-primary-foreground">
              <HandHeart className="mr-1 h-4 w-4" /> {t("b2b.lendSupport")}
            </Button>
          )}
          {iAmSupporter && row.status === "fulfilling" && (
            <Button size="sm" onClick={onMarkFulfilled} className="mt-3 w-full bg-success text-success-foreground">
              {t("b2b.markFulfilled")}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
