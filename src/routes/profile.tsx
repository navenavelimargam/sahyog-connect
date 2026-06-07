import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SignedImage } from "@/components/SignedImage";
import { DT } from "@/components/DT";
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
  const { t } = useTranslation();
  const { user, loading, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [helpCount, setHelpCount] = useState(0);
  const [membersHelped, setMembersHelped] = useState(0);
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
    // For volunteers: count unique community members helped (delivered tasks)
    if (role === "volunteer") {
      supabase.from("help_requests").select("user_id").eq("assigned_volunteer_id", user.id).eq("status", "delivered")
        .then(({ data }) => {
          const unique = new Set((data ?? []).map((r) => r.user_id));
          setMembersHelped(unique.size);
        });
    }
  }, [user, role]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const initials = profile?.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
  const badgeKind = role === "ngo_supervisor" ? "ngo" : role === "volunteer" ? "volunteer" : "user";

  const items = [
    { icon: FileText, label: t("profile.myHelpRequests"), to: "/tracker" as const },
    { icon: Bell, label: t("nav.notifications"), to: "/notifications" as const },
    { icon: Settings, label: t("profile.settings"), to: "/profile" as const },
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
              <h1 className="font-display text-2xl font-bold"><DT>{profile?.full_name || "Sahyog Member"}</DT></h1>
              <p className="text-sm text-white/80">📍 <DT>{profile?.city || "India"}</DT>{profile?.ngo_name ? <> • <DT>{profile.ngo_name}</DT></> : null}</p>
              <div className="mt-1"><VerifiedBadge kind={badgeKind} className="bg-white/20 text-white" /></div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {(role === "volunteer"
              ? [
                  { k: t("profile.helped"), v: membersHelped },
                  { k: t("profile.tasks"), v: profile?.tasks_completed ?? 0 },
                  { k: t("profile.posts"), v: posts.length },
                  { k: t("profile.rating"), v: (profile?.rating ?? 5).toFixed(1) },
                ]
              : [
                  { k: t("profile.requests"), v: helpCount },
                  { k: t("profile.posts"), v: posts.length },
                  { k: t("profile.events"), v: events.length },
                  { k: t("profile.rating"), v: profile?.rating || "5.0" },
                ]
            ).map((s) => (
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
            📢 {t("profile.myPosts")} ({posts.length})
          </button>
          <button onClick={() => setTab("events")} className={`rounded-full py-2 text-sm font-semibold ${tab === "events" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            📅 {t("profile.registeredEvents")} ({events.length})
          </button>
        </div>

        {tab === "posts" && (
          <div className="space-y-2">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {t("profile.noPosts")}{" "}
                <Link to="/post" className="font-semibold text-primary hover:underline">{t("profile.createFirst")}</Link>
              </div>
            ) : (
              posts.map((p) => (
                <article key={p.id} className="rounded-2xl border border-border bg-card p-3 shadow-card">
                  <h3 className="font-display text-base font-bold"><DT>{p.title}</DT></h3>
                  <p className="mt-1 text-xs text-muted-foreground"><DT>{p.location ?? ""}</DT> • {timeAgo(p.created_at)}</p>
                  <p className="mt-1 text-sm text-foreground line-clamp-3"><DT>{p.description}</DT></p>
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
                {t("profile.noEvents")}{" "}
                <Link to="/feed" className="font-semibold text-primary hover:underline">{t("profile.browse")}</Link>
              </div>
            ) : (
              events.map((e) => (
                <article key={e.id} className="rounded-2xl border border-border bg-card p-3 shadow-card">
                  <div className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-display text-base font-bold"><DT>{e.event_title}</DT></h3>
                      <p className="text-xs text-muted-foreground"><DT>{e.event_ngo ?? ""}</DT> • {e.event_date}</p>
                      <p className="text-xs text-muted-foreground">📍 <DT>{e.event_location ?? ""}</DT></p>
                      <p className="mt-1 text-xs"><span className="rounded-full bg-success/10 px-2 py-0.5 font-semibold text-success">✓ {t("feed.registered")}</span></p>
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
            <span className="flex-1 font-semibold">🌙 {t("profile.theme")}</span>
            <ThemeToggle />
          </div>

          {role === "ngo_supervisor" && (
            <Link to="/dashboard" className="flex items-center gap-3 rounded-xl border border-primary bg-primary/10 p-4 shadow-card hover:bg-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="flex-1 font-semibold text-primary">{t("profile.switchNgo")}</span>
              <ChevronRight className="h-4 w-4 text-primary" />
            </Link>
          )}

          <Button onClick={async () => { await signOut(); navigate({ to: "/" }); }} variant="outline" className="mt-4 w-full text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" /> {t("profile.logout")}
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
