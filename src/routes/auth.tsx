import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SahyogLogo } from "@/components/SahyogLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Handshake, Building2, Loader2, ArrowLeft, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentPosition, type Coords } from "@/lib/geolocation";
import { reverseGeocode } from "@/lib/reverse-geocode";
import { LocationMicroMap } from "@/components/LocationMicroMap";

type Role = "user" | "volunteer" | "ngo_supervisor";
type AuthMode = "user" | "volunteer" | "ngo";

const SKILLS = ["Medical", "Food Distribution", "Rescue", "Teaching", "Transportation", "Environment", "Shelter"];
const NGO_OPTIONS = [
  "Akshaya Patra Foundation", "Goonj", "Smile India Trust", "Green Yatra", "HealthReach India",
  "CRY — Child Rights and You", "Nanhi Kali (Mahindra Foundation)", "HelpAge India", "Pratham",
  "SEWA (Self Employed Women's Association)", "iCall (TISS)", "Médecins Sans Frontières India",
];

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode as AuthMode) || "user",
  }),
  head: () => ({ meta: [{ title: "Sign In — Sahyog" }] }),
});

function AuthPage() {
  const search = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthMode>(search.mode);
  const [authAction, setAuthAction] = useState<"login" | "signup">("signup");
  const [busy, setBusy] = useState(false);

  // shared
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // volunteer
  const [skills, setSkills] = useState<string[]>([]);
  const [volunteerNgo, setVolunteerNgo] = useState(NGO_OPTIONS[0]);

  // NGO
  const [ngoName, setNgoName] = useState(NGO_OPTIONS[0]);
  const [ngoReg, setNgoReg] = useState("");

  // Auto-capture base GPS + reverse-geocoded city (ZERO manual location input).
  const [coords, setCoords] = useState<Coords | null>(null);
  const [cityLabel, setCityLabel] = useState<string>("");
  const [geoStatus, setGeoStatus] = useState<"idle" | "detecting" | "ok" | "denied">("idle");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/feed" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (authAction !== "signup" || geoStatus !== "idle") return;
    setGeoStatus("detecting");
    getCurrentPosition()
      .then(async (c) => {
        setCoords(c);
        setGeoStatus("ok");
        const place = await reverseGeocode(c.lat, c.lng);
        setCityLabel(place.label);
      })
      .catch(() => setGeoStatus("denied"));
  }, [authAction, geoStatus]);

  const tabRole: Record<AuthMode, Role> = {
    user: "user",
    volunteer: "volunteer",
    ngo: "ngo_supervisor",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setBusy(true);

    if (authAction === "signup") {
      if (!fullName) {
        setBusy(false);
        toast.error("Please enter your full name");
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/feed`,
          data: {
            full_name: fullName,
            phone,
            city: cityLabel,
            ngo_name:
              tab === "ngo" ? ngoName : tab === "volunteer" ? volunteerNgo : undefined,
            ngo_reg_number: tab === "ngo" ? ngoReg : undefined,
            skills: tab === "volunteer" ? skills.join(",") : undefined,
            role: tabRole[tab],
          },
        },
      });
      if (error) {
        setBusy(false);
        toast.error(error.message);
        return;
      }
      // Persist captured GPS to the freshly created profile (trigger created the row).
      if (coords) {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;
        if (uid) {
          await supabase.from("profiles").update({
            latitude: coords.lat,
            longitude: coords.lng,
            last_seen_at: new Date().toISOString(),
          }).eq("id", uid);
        }
      }
      setBusy(false);
      toast.success("Welcome to Sahyog! 🎉");
      navigate({ to: "/feed" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Welcome back! 👋");
      navigate({ to: "/feed" });
    }
  };

  const toggleSkill = (s: string) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="gradient-hero shadow-elevated">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-white">
            <ArrowLeft className="h-5 w-5" />
            <SahyogLogo size={36} />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="rounded-full bg-white/10"><ThemeToggle /></div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        {/* Login/Signup toggle */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-full border border-border bg-card p-1">
          {(["signup", "login"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAuthAction(a)}
              className={cn(
                "rounded-full py-2 text-sm font-semibold transition",
                authAction === a
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {a === "signup" ? "Register" : "Login"}
            </button>
          ))}
        </div>

        {authAction === "signup" && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(["user", "volunteer", "ngo"] as AuthMode[]).map((t) => {
              const labels = { user: ["👤", "Community"], volunteer: ["🤝", "Volunteer"], ngo: ["🏛", "NGO"] };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-xl border-2 px-2 py-3 text-center text-xs font-semibold transition",
                    tab === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <div className="text-xl">{labels[t][0]}</div>
                  <div className="mt-1">{labels[t][1]}</div>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {authAction === "login"
                ? "Welcome back"
                : tab === "user"
                ? "Create your account"
                : tab === "volunteer"
                ? "Become a Volunteer"
                : "Register your NGO"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {authAction === "login"
                ? "Sign in with your email and password."
                : "Use your email and a password to create an account."}
            </p>
          </div>

          {authAction === "signup" && (
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder={tab === "ngo" ? "Priya Sharma" : tab === "volunteer" ? "Suresh Patil" : "Ramesh Kumar"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Password <span className="text-destructive">*</span></Label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {authAction === "signup" && (
            <>
              <div className={cn(
                "flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-xs",
                geoStatus === "ok" ? "border-success/40 bg-success/10" :
                geoStatus === "denied" ? "border-destructive/40 bg-destructive/10" :
                "border-primary/40 bg-primary/10",
              )}>
                <MapPin className={cn("mt-0.5 h-3.5 w-3.5 shrink-0",
                  geoStatus === "ok" ? "text-success" : geoStatus === "denied" ? "text-destructive" : "text-primary animate-pulse")} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {geoStatus === "detecting" && "Detecting your location…"}
                    {geoStatus === "ok" && (cityLabel ? `📍 ${cityLabel}` : "Location captured")}
                    {geoStatus === "denied" && "Location permission denied — please enable to continue"}
                  </div>
                </div>
              </div>
              {coords && (
                <LocationMicroMap lat={coords.lat} lng={coords.lng} height={140} label={cityLabel || undefined} />
              )}
              <div className="space-y-2">
                <Label>Phone (+91)</Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>



              {tab === "volunteer" && (
                <>
                  <div className="space-y-2">
                    <Label>Which NGO are you volunteering for? <span className="text-destructive">*</span></Label>
                    <select
                      value={volunteerNgo}
                      onChange={(e) => setVolunteerNgo(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      {NGO_OPTIONS.map((n) => <option key={n}>{n}</option>)}
                    </select>
                    <p className="text-[11px] text-muted-foreground">The supervisor of this NGO will be notified when you sign up and can assign you to help requests.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Your Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSkill(s)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold transition",
                            skills.includes(s)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {tab === "ngo" && (
                <>
                  <div className="space-y-2">
                    <Label>NGO Name</Label>
                    <select
                      value={ngoName}
                      onChange={(e) => setNgoName(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {NGO_OPTIONS.map((n) => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>NGO Registration Number</Label>
                    <Input placeholder="e.g. NGO/12345/2020" value={ngoReg} onChange={(e) => setNgoReg(e.target.value)} />
                  </div>
                </>
              )}
            </>
          )}

          <Button type="submit" disabled={busy} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {authAction === "login" ? "Sign In" : "Create Account"}
            {authAction === "signup" && tab === "user" && <User className="ml-2 h-4 w-4" />}
            {authAction === "signup" && tab === "volunteer" && <Handshake className="ml-2 h-4 w-4" />}
            {authAction === "signup" && tab === "ngo" && <Building2 className="ml-2 h-4 w-4" />}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {authAction === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setAuthAction(authAction === "login" ? "signup" : "login")}
              className="font-semibold text-primary hover:underline"
            >
              {authAction === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
