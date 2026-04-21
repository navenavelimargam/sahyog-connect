import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SignedImage } from "@/components/SignedImage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Bell, Settings, LogOut, ChevronRight, Building2, Calendar } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "My Profile — Sahyog" }] }),
});

interface MyPost {
  id: string;
  title: string;
  description: string;
  category: string | null;
  location: string | null;
  image_urls: string[] | null;
  created_at: string | null;
}

interface MyEvent {
  id: string;
  event_id: string;
  event_title: string;
  event_ngo: string | null;
  event_date: string | null;
  event_location: string | null;
  num_people: number;
  created_at: string | null;
}

function ProfilePage() {
  const { user, loading, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [helpCount, setHelpCount] = useState(0);
  const [tab, setTab] = useState<"posts" | "events">("posts");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "user" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("posts").select("id, title, description, category, location, image_urls, created_at")
      .eq("author_id", user.id).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setPosts((data ?? []) as MyPost[]));
    supabase.from("event_registrations").select("id, event_id, event_title, event_ngo, event_date, event_location, num_people, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setEvents((data ?? []) as MyEvent[]));
    supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setHelpCount(count ?? 0));
  }, [user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const initials = profile?.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
  const badgeKind = role === "ngo_supervisor" ? "ngo" : role === "volunteer" ? "volunteer" : "user";

  const items = [
    { icon: FileText, label: "My Help Requests", to: "/tracker" as const },
    { icon: Bell, label: "Notifications", to: "/notifications" as const },
    { icon: Settings, label: "Settings & Privacy", to: "/profile" as const },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <header className="gradient-hero text-white shadow-elevated">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-white">
              <AvatarFallback className="bg-white/20 text-2xl font-bold text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">{profile?.full_name || "Sahyog Member"}</h1>
              <p className="text-sm text-white/80">📍 {profile?.city || "India"}{profile?.ngo_name ? ` • ${profile.ngo_name}` : ""}</p>
              <div className="mt-1"><VerifiedBadge kind={badgeKind} className="bg-white/20 text-white" /></div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              { k: "Requests", v: helpCount },
              { k: "Posts", v: posts.length },
              { k: "Events", v: events.length },
              { k: "Rating", v: profile?.rating || "5.0" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg bg-white/10 backdrop-blur p-2">
                <div className="text-lg font-bold">{s.v}</div>
                <div className="text-[10px] uppercase opacity-80">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-3 py-4">
        {/* Tabs for posts vs events */}
        <div className="grid grid-cols-2 gap-2 rounded-full border border-border bg-card p-1">
          <button onClick={() => setTab("posts")} className={`rounded-full py-2 text-sm font-semibold ${tab === "posts" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            📢 My Posts ({posts.length})
          </button>
          <button onClick={() => setTab("events")} className={`rounded-full py-2 text-sm font-semibold ${tab === "events" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            📅 Registered Events ({events.length})
          </button>
        </div>

        {tab === "posts" && (
          <div className="space-y-2">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                You haven't posted anything yet.{" "}
                <Link to="/post" className="font-semibold text-primary hover:underline">Create your first post →</Link>
              </div>
            ) : (
              posts.map((p) => (
                <article key={p.id} className="rounded-2xl border border-border bg-card p-3 shadow-card">
                  <h3 className="font-display text-base font-bold">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p.location} • {timeAgo(p.created_at)}</p>
                  <p className="mt-1 text-sm text-foreground line-clamp-3">{p.description}</p>
                  {p.image_urls && p.image_urls.length > 0 && (
                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {p.image_urls.slice(0, 4).map((path, i) => (
                        <SignedImage key={i} path={path} alt={`${p.title} ${i}`} className="aspect-square w-full rounded-md object-cover" />
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {tab === "events" && (
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                You haven't registered for any events yet.{" "}
                <Link to="/feed" className="font-semibold text-primary hover:underline">Browse events →</Link>
              </div>
            ) : (
              events.map((e) => (
                <article key={e.id} className="rounded-2xl border border-border bg-card p-3 shadow-card">
                  <div className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-display text-base font-bold">{e.event_title}</h3>
                      <p className="text-xs text-muted-foreground">{e.event_ngo} • {e.event_date}</p>
                      <p className="text-xs text-muted-foreground">📍 {e.event_location}</p>
                      <p className="mt-1 text-xs"><span className="rounded-full bg-success/10 px-2 py-0.5 font-semibold text-success">✓ Registered</span> for {e.num_people} {e.num_people === 1 ? "person" : "people"}</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        <div className="space-y-2 pt-2">
          {items.map((it) => (
            <Link key={it.label} to={it.to} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card hover:bg-muted/40">
              <it.icon className="h-5 w-5 text-primary" />
              <span className="flex-1 font-semibold">{it.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}

          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <span className="flex-1 font-semibold">🌙 Theme</span>
            <ThemeToggle />
          </div>

          {role === "ngo_supervisor" && (
            <Link to="/dashboard" className="flex items-center gap-3 rounded-xl border border-primary bg-primary/10 p-4 shadow-card hover:bg-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="flex-1 font-semibold text-primary">Switch to NGO Supervisor View</span>
              <ChevronRight className="h-4 w-4 text-primary" />
            </Link>
          )}

          <Button onClick={async () => { await signOut(); navigate({ to: "/" }); }} variant="outline" className="mt-4 w-full text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}
