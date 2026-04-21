import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Handshake, Heart } from "lucide-react";
import { SahyogLogo } from "@/components/SahyogLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Sahyog — One Step Can Change Someone's Life" },
      { name: "description", content: "Join India's most powerful volunteer coordination network. Connect with verified NGOs and volunteers." },
      { property: "og:title", content: "Sahyog — सहयोग" },
      { property: "og:description", content: "एक कदम बदल सकता है किसी की ज़िंदगी" },
    ],
  }),
});

const NGO_NAMES = ["Akshaya Patra", "Goonj", "Smile India Trust", "CRY India", "Green Yatra", "Pratham", "HelpAge India"];
const STATS = [
  { value: "12,400+", label: "Lives Helped" },
  { value: "340+", label: "Volunteers" },
  { value: "28", label: "NGOs" },
  { value: "15", label: "Districts" },
];

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/feed" });
  }, [user, loading, navigate]);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-between px-6 py-6 text-center text-white">
          <div className="flex w-full justify-between">
            <div className="rounded-full bg-white/10 p-1 backdrop-blur"><SahyogLogo size={44} /></div>
            <Link to="/auth" search={{ mode: "user" }} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20">
              Sign In
            </Link>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10">
            <Heart className="h-12 w-12 text-accent" fill="currentColor" />
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              एक कदम बदल सकता है<br />किसी की ज़िंदगी
            </h1>
            <p className="font-display text-2xl italic text-white/90 md:text-3xl">
              "One Step Can Change Someone's Life"
            </p>
            <p className="max-w-xl text-base text-white/80 md:text-lg">
              Join India's most powerful volunteer coordination network. Real NGOs. Real impact. Right in your community.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate({ to: "/auth", search: { mode: "user" } })}
                className="rounded-full bg-accent px-8 text-base font-bold text-accent-foreground shadow-orange hover:bg-accent/90"
              >
                <LifeBuoy className="mr-2 h-5 w-5" /> Get Help Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate({ to: "/auth", search: { mode: "volunteer" } })}
                className="rounded-full border-2 border-white bg-transparent px-8 text-base font-bold text-white hover:bg-white hover:text-foreground"
              >
                <Handshake className="mr-2 h-5 w-5" /> Volunteer / NGO Login
              </Button>
            </div>
          </div>

          <div className="w-full">
            <p className="mb-2 text-xs uppercase tracking-widest text-white/70">Trusted by India's leading NGOs</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold text-white/90">
              {NGO_NAMES.map((n, i) => (
                <span key={n} className="flex items-center gap-3">
                  {n}
                  {i < NGO_NAMES.length - 1 && <span className="text-white/40">|</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2 px-4 py-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-primary md:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">A Network of Compassion</h2>
          <p className="mt-4 text-base text-muted-foreground">
            Sahyog connects communities in need with verified NGOs and dedicated volunteers across India. Whether it's
            food, medical care, shelter, or education — help is one tap away.
          </p>
          <Link to="/auth" search={{ mode: "user" }}>
            <Button className="mt-8 rounded-full bg-primary px-8 py-6 text-base font-semibold text-primary-foreground hover:bg-primary/90">
              Join Sahyog Today →
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
