import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ShareButtons";
import { SahyogLogo } from "@/components/SahyogLogo";
import { getNgoById, NGO_PARTNERS, type NgoPartner } from "@/lib/ngo-directory";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, MapPin, Users, CheckCircle2, Activity, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ngo/$ngoId")({
  loader: ({ params }) => {
    const ngo = getNgoById(params.ngoId);
    if (!ngo) throw notFound();
    return { ngo };
  },
  head: ({ loaderData }) => {
    const ngo = loaderData?.ngo;
    const title = ngo ? `${ngo.name} on Sahyog` : "NGO on Sahyog";
    const desc = ngo?.tagline ?? "Verified NGO partner on Sahyog.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
    };
  },
  component: NgoProfilePage,
});

function NgoProfilePage() {
  const { ngo } = Route.useLoaderData() as { ngo: NgoPartner };
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ngo/${ngo.id}`
      : `https://connect-sahyog.lovable.app/ngo/${ngo.id}`;

  const handleFollow = () => {
    if (!user) {
      toast("Sign in to follow NGOs");
      navigate({ to: "/auth", search: { mode: "user" } });
      return;
    }
    setFollowing((f) => !f);
    toast.success(following ? `Unfollowed ${ngo.name}` : `Following ${ngo.name} ✨`);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Public header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <SahyogLogo size={28} />
            <span className="font-display text-lg font-bold text-foreground">Sahyog</span>
          </Link>
          {!user && (
            <Link
              to="/auth"
              search={{ mode: "user" }}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Hero */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30" />
          <div className="-mt-12 flex flex-col items-center px-6 pb-6 text-center">
            <div className={`flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-card text-5xl shadow-lg ${ngo.color}`}>
              {ngo.logoEmoji}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-foreground md:text-3xl">
              {ngo.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{ngo.tagline}</p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={handleFollow}
                className={`rounded-full px-6 ${
                  following
                    ? "bg-muted text-foreground hover:bg-muted/80"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Heart className={`mr-2 h-4 w-4 ${following ? "fill-destructive text-destructive" : ""}`} />
                {following ? "Following" : "Follow"}
              </Button>
            </div>

            <div className="mt-4 w-full rounded-xl bg-muted/50 px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Share NGO Profile
              </div>
              <ShareButtons
                title={`Check out ${ngo.name} on Sahyog — India's volunteer coordination network`}
                url={profileUrl}
                caption={`Check out ${ngo.name} on Sahyog — India's volunteer coordination network: ${profileUrl}`}
                compact={false}
                className="justify-center"
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6 grid grid-cols-3 gap-3">
          <StatCard icon={<Activity className="h-5 w-5" />} value={ngo.stats.requestsHandled.toLocaleString()} label="Requests Handled" />
          <StatCard icon={<Users className="h-5 w-5" />} value={ngo.stats.volunteers.toLocaleString()} label="Volunteers" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} value={`${ngo.stats.successRate}%`} label="Success Rate" />
        </section>

        {/* About */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ngo.description}</p>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categories served
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ngo.categories.map((c) => (
                <span key={c} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Districts active in
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ngo.districts.map((d) => (
                <span key={d} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  <MapPin className="h-3 w-3" /> {d}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Recent events */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground">📅 Recent Events</h2>
          <div className="mt-3 space-y-3">
            {ngo.recentEvents.map((e) => (
              <div key={e.title} className="rounded-xl border border-border bg-background p-3">
                <div className="font-semibold text-foreground">{e.title}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent posts */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground">📢 Recent Community Posts</h2>
          <div className="mt-3 space-y-3">
            {ngo.recentPosts.map((p) => (
              <article key={p.title} className="rounded-xl border border-border bg-background p-3">
                <div className="font-semibold text-foreground">{p.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-2 text-[11px] text-muted-foreground">{p.time}</div>
              </article>
            ))}
          </div>
        </section>

        {/* Other partners */}
        <section className="mt-8">
          <h2 className="px-1 font-display text-lg font-bold text-foreground">More NGO Partners</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {NGO_PARTNERS.filter((n) => n.id !== ngo.id).slice(0, 6).map((n) => (
              <Link
                key={n.id}
                to="/ngo/$ngoId"
                params={{ ngoId: n.id }}
                className="rounded-xl border border-border bg-card p-3 text-left transition hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-2xl ${n.color}`}>
                  {n.logoEmoji}
                </div>
                <div className="mt-2 text-sm font-bold text-foreground">{n.name}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-2">{n.tagline}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <div className="mt-2 font-display text-xl font-bold text-foreground">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
