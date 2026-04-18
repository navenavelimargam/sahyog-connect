import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, FileText, Megaphone, Calendar, Star, Bell, Settings, LogOut, ChevronRight, Building2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "My Profile — Sahyog" }] }),
});

function ProfilePage() {
  const { user, loading, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const initials = profile?.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
  const badgeKind = role === "ngo_supervisor" ? "ngo" : role === "volunteer" ? "volunteer" : "user";

  const items = [
    { icon: FileText, label: "My Help Requests", to: "/help" as const },
    { icon: Megaphone, label: "My Posts", to: "/post" as const },
    { icon: Calendar, label: "Registered Events", to: "/feed" as const },
    { icon: Star, label: "Ratings Given", to: "/feed" as const },
    { icon: Bell, label: "Notification Settings", to: "/notifications" as const },
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
              <p className="text-sm text-white/80">📍 {profile?.city || "India"}</p>
              <div className="mt-1"><VerifiedBadge kind={badgeKind} className="bg-white/20 text-white" /></div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              { k: "Requests", v: 3 },
              { k: "Posts", v: 7 },
              { k: "Events", v: 5 },
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

      <main className="mx-auto max-w-2xl space-y-2 px-3 py-4">
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
      </main>

      <BottomNav />
    </div>
  );
}
