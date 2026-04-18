import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SahyogLogo } from "@/components/SahyogLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Handshake, Building2, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [step, setStep] = useState<"form" | "otp">("form");
  const [busy, setBusy] = useState(false);

  // shared
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [otp, setOtp] = useState("");

  // volunteer
  const [skills, setSkills] = useState<string[]>([]);

  // NGO
  const [ngoName, setNgoName] = useState(NGO_OPTIONS[0]);
  const [ngoReg, setNgoReg] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/feed" });
  }, [user, loading, navigate]);

  const tabRole: Record<AuthMode, Role> = {
    user: "user",
    volunteer: "volunteer",
    ngo: "ngo_supervisor",
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error("Please fill in name and email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/feed`,
        shouldCreateUser: true,
        data: {
          full_name: fullName,
          phone,
          city,
          ngo_name: tab === "ngo" ? ngoName : undefined,
          skills: tab === "volunteer" ? skills.join(",") : undefined,
          role: tabRole[tab],
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`OTP sent to ${email}`);
    setStep("otp");
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to Sahyog! 🎉");
    navigate({ to: "/feed" });
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
          <div className="rounded-full bg-white/10"><ThemeToggle /></div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        {step === "otp" ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-2xl font-bold text-foreground">Verify your email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
            </p>
            <form onSubmit={verifyOtp} className="mt-6 space-y-4">
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl font-bold tracking-[0.5em]"
              />
              <Button type="submit" disabled={busy} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify & Continue
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")} className="w-full">
                Change email
              </Button>
            </form>
          </div>
        ) : (
          <>
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

            <form onSubmit={sendOtp} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  {tab === "user" && "Register / Login"}
                  {tab === "volunteer" && "Become a Volunteer"}
                  {tab === "ngo" && "Register your NGO"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  We'll email you a 6-digit code to verify your account.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder={tab === "ngo" ? "Priya Sharma" : tab === "volunteer" ? "Suresh Patil" : "Ramesh Kumar"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

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
                <Label>Phone (+91)</Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>City / District</Label>
                <Input
                  placeholder="Nagpur, Maharashtra"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              {tab === "volunteer" && (
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

              <Button type="submit" disabled={busy} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Email OTP
                {tab === "user" && <User className="ml-2 h-4 w-4" />}
                {tab === "volunteer" && <Handshake className="ml-2 h-4 w-4" />}
                {tab === "ngo" && <Building2 className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
