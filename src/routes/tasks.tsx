import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MapPin, Clock, ShieldAlert, CheckCircle2, Truck, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  component: VolunteerTasks,
  head: () => ({ meta: [{ title: "My Tasks — Sahyog Volunteer" }] }),
});

interface Task {
  id: string;
  user_id: string;
  category: string;
  priority: string;
  description: string;
  location: string;
  status: string;
  selected_ngo_name: string | null;
  eta_minutes: number | null;
  created_at: string | null;
  requester_name?: string;
}

const STATUS_FLOW = ["accepted", "on_the_way", "delivered"] as const;

function VolunteerTasks() {
  const { user, loading, role, profile } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (!loading && user && role && role !== "volunteer") {
      toast.error("This page is for volunteers");
      navigate({ to: "/feed" });
    }
  }, [user, loading, role, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    const { data: rows } = await supabase
      .from("help_requests")
      .select("id, user_id, category, priority, description, location, status, selected_ngo_name, eta_minutes, created_at")
      .eq("assigned_volunteer_id", user.id)
      .order("created_at", { ascending: false });

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const nameMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      (profs ?? []).forEach((p) => { nameMap[p.id] = p.full_name; });
    }
    setTasks((rows ?? []).map((r) => ({ ...r, requester_name: nameMap[r.user_id] ?? "Community member" })));
    setLoadingData(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("vol-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "help_requests" }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const updateStatus = async (taskId: string, next: string, eta?: number) => {
    const patch: { status: string; eta_minutes?: number } = { status: next };
    if (typeof eta === "number") patch.eta_minutes = eta;
    const { error } = await supabase.from("help_requests").update(patch).eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status: ${next.replace("_", " ")}`);
    load();
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (role !== "volunteer") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-3 font-display text-xl font-bold">Volunteers Only</h1>
          <p className="mt-2 text-sm text-muted-foreground">This page is for registered volunteers.</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  const active = tasks.filter((t) => t.status !== "delivered");
  const done = tasks.filter((t) => t.status === "delivered");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <header className="gradient-hero text-white shadow-elevated">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <h1 className="font-display text-xl font-bold">🤝 Volunteer Dashboard</h1>
          <p className="text-sm text-white/80">Welcome, {profile?.full_name} • {profile?.skills?.join(", ") || "Helper"}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat k="Active" v={active.length} />
            <Stat k="Completed" v={done.length} />
            <Stat k="Rating" v={(profile?.rating ?? 5).toFixed(1)} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-3 py-4">
        <h2 className="px-1 font-display text-lg font-bold">📋 Active Assignments</h2>
        {loadingData ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No active assignments. NGO supervisors will notify you here when they assign you a request.
          </div>
        ) : (
          active.map((t) => <TaskCard key={t.id} task={t} onUpdate={updateStatus} />)
        )}

        {done.length > 0 && (
          <>
            <h2 className="px-1 pt-3 font-display text-lg font-bold">✅ Completed</h2>
            {done.map((t) => <TaskCard key={t.id} task={t} onUpdate={updateStatus} />)}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number | string }) {
  return (
    <div className="rounded-lg bg-white/10 backdrop-blur p-2">
      <div className="text-lg font-bold">{v}</div>
      <div className="text-[10px] uppercase opacity-80">{k}</div>
    </div>
  );
}

function TaskCard({ task, onUpdate }: { task: Task; onUpdate: (id: string, next: string, eta?: number) => void }) {
  const [eta, setEta] = useState(task.eta_minutes ?? 15);
  const idx = STATUS_FLOW.indexOf(task.status as typeof STATUS_FLOW[number]);
  const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;

  const priorityChip =
    task.priority === "critical" ? "bg-destructive text-destructive-foreground" :
    task.priority === "high" ? "bg-accent text-accent-foreground" :
    task.priority === "medium" ? "bg-warning text-warning-foreground" :
    "bg-success text-success-foreground";

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", priorityChip)}>{task.priority} • {task.category}</span>
          <div className="mt-2 font-bold text-foreground">{task.requester_name}</div>
          <p className="mt-1 text-sm text-foreground">"{task.description}"</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {task.location}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.selected_ngo_name}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 font-semibold capitalize">{task.status.replace("_", " ")}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold",
              i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>{i + 1}</div>
            <span className={cn("mt-1 capitalize", i <= idx ? "text-foreground" : "text-muted-foreground")}>{s.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {task.status === "on_the_way" && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">ETA</label>
          <input type="number" value={eta} min={0} onChange={(e) => setEta(parseInt(e.target.value) || 0)} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm" />
          <span className="text-xs text-muted-foreground">min</span>
          <Button size="sm" variant="outline" onClick={() => onUpdate(task.id, "on_the_way", eta)}>Update ETA</Button>
        </div>
      )}

      {next ? (
        <div className="flex gap-2">
          {next === "on_the_way" && (
            <Button onClick={() => onUpdate(task.id, "on_the_way", eta)} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
              <Truck className="mr-2 h-4 w-4" /> Start — On The Way
            </Button>
          )}
          {next === "delivered" && (
            <Button onClick={() => onUpdate(task.id, "delivered")} className="flex-1 bg-success text-success-foreground hover:bg-success/90 rounded-full">
              <PackageCheck className="mr-2 h-4 w-4" /> Mark Delivered
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-success/10 p-2 text-sm font-semibold text-success">
          <CheckCircle2 className="h-4 w-4" /> Completed — thank you!
        </div>
      )}
    </article>
  );
}
