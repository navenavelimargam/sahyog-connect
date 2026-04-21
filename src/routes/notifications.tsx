import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — Sahyog" }] }),
});

interface N {
  id: string;
  icon: string | null;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: string | null;
}

function NotificationsPage() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<N[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "user" } });
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, icon, title, message, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setItems((data ?? []) as N[]);
    setLoadingData(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("user-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, is_read: true } : x));
  };

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
  };

  const handleClick = (n: N) => {
    markRead(n.id);
    if (role === "ngo_supervisor" && n.title.includes("help request")) navigate({ to: "/dashboard" });
    else if (role === "volunteer" && n.title.includes("assignment")) navigate({ to: "/tasks" });
    else if (n.title.includes("status") || n.title.includes("Volunteer assigned")) navigate({ to: "/tracker" });
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="mx-auto max-w-2xl px-3 py-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="font-display text-2xl font-bold">🔔 Notifications</h1>
          {items.some((i) => !i.is_read) && (
            <button onClick={markAll} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>
          )}
        </div>

        {loadingData ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No notifications yet. Help requests, assignments and status updates will appear here in real-time.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition hover:bg-muted/40",
                  !n.is_read && "border-l-4 border-l-accent"
                )}
              >
                <div className="text-2xl">{n.icon ?? "🔔"}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm", !n.is_read ? "font-bold text-foreground" : "text-muted-foreground")}>{n.title}</span>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-destructive" />}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{n.message}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}
