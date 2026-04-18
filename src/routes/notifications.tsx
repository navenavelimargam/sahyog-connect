import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — Sahyog" }] }),
});

interface N { id: string; icon: string; title: string; time: string; unread: boolean; }

const SEED: N[] = [
  { id: "n1", icon: "🔴", title: "New help request near you", time: "3 min ago", unread: true },
  { id: "n2", icon: "✅", title: "Suresh Patil accepted your request", time: "12 min ago", unread: true },
  { id: "n3", icon: "🚗", title: "Volunteer is 500m away — ETA 4 min", time: "18 min ago", unread: true },
  { id: "n4", icon: "🩸", title: "Blood Donation Camp tomorrow — Register now", time: "2 hrs ago", unread: false },
  { id: "n5", icon: "🎉", title: "Task complete! Rate Suresh Patil", time: "Yesterday", unread: false },
];

function NotificationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<N[]>(SEED);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="mx-auto max-w-2xl px-3 py-4">
        <h1 className="px-1 font-display text-2xl font-bold">🔔 Notifications</h1>
        <div className="mt-3 space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition hover:bg-muted/40",
                n.unread && "border-l-4 border-l-accent"
              )}
            >
              <div className="text-2xl">{n.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm", n.unread ? "font-bold text-foreground" : "text-muted-foreground")}>{n.title}</span>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-destructive" />}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{n.time}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
