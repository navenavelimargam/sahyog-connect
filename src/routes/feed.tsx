import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, MapPin, Calendar, Send, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DT } from "@/components/DT";
import { ShareButtons } from "@/components/ShareButtons";
import { slugifyNgoName } from "@/lib/ngo-directory";

import smileFood from "@/assets/food-distribution-women.jpg";
import treePlant from "@/assets/tree-plantation-watering.jpg";
import treeGroup from "@/assets/tree-plantation-group.jpg";
import classroom from "@/assets/outdoor-classroom.jpg";
import classroom2 from "@/assets/classroom-students.jpg";
import medical from "@/assets/medical-camp-outdoor.jpg";
import medicalEye from "@/assets/medical-eye-checkup.jpg";
import bloodPoster from "@/assets/blood-donation-poster.jpg";
import bloodCamp from "@/assets/blood-donation-camp.jpg";
import yogaPoster from "@/assets/yoga-day-poster.jpg";
import shelterTent from "@/assets/shelter-tent.jpg";
import flood from "@/assets/flood-relief-distribution.jpg";
import womenSewing from "@/assets/women-empowerment-sewing.jpg";
import oldAge from "@/assets/old-age-home.jpg";
import childrenCourtyard from "@/assets/children-courtyard.jpg";
import yogaGroup from "@/assets/yoga-group.jpg";
import bloodGroup from "@/assets/blood-donation-group.jpg";
import floodVol from "@/assets/flood-relief-volunteers.jpg";
import greenYatra from "@/assets/green-yatra-plantation.jpg";
// User-supplied images
import animal1 from "@/assets/feed-animal-1.jpg";
import animal2 from "@/assets/feed-animal-2.jpg";
import animal3 from "@/assets/feed-animal-3.jpg";
import water1 from "@/assets/feed-water-1.jpg";
import water2 from "@/assets/feed-water-2.jpg";
import healthBanner from "@/assets/feed-health.jpg";
import clothes1 from "@/assets/feed-clothes-1.jpg";
import clothes2 from "@/assets/feed-clothes-2.jpg";
import clothes3 from "@/assets/feed-clothes-3.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/feed")({
  component: FeedPage,
  head: () => ({ meta: [{ title: "Home — Sahyog Feed" }] }),
});

const CATEGORIES = [
  { key: "tree", emoji: "🌳", label: "Tree Plantation", bg: "#E8F5E9", ring: "#2E7D32" },
  { key: "blood", emoji: "🩸", label: "Blood Donation", bg: "#FFEBEE", ring: "#C62828" },
  { key: "food", emoji: "🍱", label: "Food", bg: "#FFF3E0", ring: "#E65100" },
  { key: "shelter", emoji: "🏠", label: "Shelter", bg: "#E3F2FD", ring: "#1565C0" },
  { key: "medical", emoji: "💊", label: "Medical Aid", bg: "#F3E5F5", ring: "#6A1B9A" },
  { key: "education", emoji: "📚", label: "Education", bg: "#E0F2F1", ring: "#00695C" },
  { key: "emergency", emoji: "🚨", label: "Emergency", bg: "#FFEBEE", ring: "#B71C1C" },
  { key: "clothes", emoji: "👗", label: "Clothes", bg: "#FFF8E1", ring: "#F57F17" },
  { key: "water", emoji: "💧", label: "Clean Water", bg: "#E1F5FE", ring: "#0277BD" },
  { key: "animal", emoji: "🐾", label: "Animal Care", bg: "#EFEBE9", ring: "#4E342E" },
];

const EVENTS = [
  { id: "e1", banner: bloodPoster, tag: "🩸 Blood Donation", tagColor: "bg-destructive text-destructive-foreground", ngo: "Indian Red Cross Society", title: "Blood Donation Camp", date: "14 May 2025 • 9:00 AM", location: "Community Centre, Nagpur", btn: "bg-destructive hover:bg-destructive/90" },
  { id: "e2", banner: treeGroup, tag: "🌳 Environment", tagColor: "bg-success text-success-foreground", ngo: "Green Yatra", title: "Green Drive Sunday", date: "5 May 2025 • 7:00 AM", location: "Futala Lake, Nagpur", btn: "bg-success hover:bg-success/90" },
  { id: "e3", banner: medical, tag: "💊 Medical", tagColor: "bg-chart-4 text-white", ngo: "Médecins Sans Frontières India", title: "Free Health & Dental Camp", date: "1 May 2025 • 10:00 AM", location: "Kalamna Ground, Nagpur", btn: "bg-chart-4 hover:bg-chart-4/90" },
  { id: "e4", banner: yogaPoster, tag: "🧘 Wellness", tagColor: "bg-accent text-accent-foreground", ngo: "Art of Living India", title: "International Yoga Day", date: "21 June 2025 • 6:00 AM", location: "Seminary Hills, Nagpur", btn: "bg-accent hover:bg-accent/90" },
];

interface SeedPost {
  id: string;
  ngo: string;
  badge: "ngo" | "user" | "volunteer";
  location: string;
  time: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  categoryEmoji: string;
  initialLikes: number;
}

const SEED_POSTS: SeedPost[] = [
  {
    id: "p1",
    ngo: "Smile India Trust",
    badge: "ngo",
    location: "Meerut, Uttar Pradesh",
    time: "2 hours ago",
    title: "Food Distribution Drive — Jawahar Nagar",
    description: "Our volunteers distributed hot meals to 120+ children and families in Jawahar Nagar today. Your support makes this possible. Every smile makes it worth it! 🙏",
    images: [smileFood, flood],
    category: "food",
    categoryEmoji: "🍱",
    initialLikes: 48,
  },
  {
    id: "p2",
    ngo: "Green Yatra",
    badge: "ngo",
    location: "Pune, Maharashtra",
    time: "5 hours ago",
    title: "Weekend Tree Plantation — 200 Saplings Planted!",
    description: "Join us every Sunday morning! Today 8 volunteers planted 200 native saplings near the riverbank. Be the change you want to see. 🌱",
    images: [treePlant, treeGroup],
    category: "tree",
    categoryEmoji: "🌳",
    initialLikes: 92,
  },
  {
    id: "p3",
    ngo: "Nanhi Kali (Mahindra Foundation)",
    badge: "ngo",
    location: "Bihar",
    time: "Yesterday",
    title: "Open-Air Classroom — Education Has No Walls",
    description: "35 children attended our outdoor education session. Knowledge is the greatest gift. No building, no limits — just learning and joy! 📖",
    images: [classroom, classroom2],
    category: "education",
    categoryEmoji: "📚",
    initialLikes: 156,
  },
  {
    id: "p4",
    ngo: "Médecins Sans Frontières India",
    badge: "ngo",
    location: "Nagpur, Maharashtra",
    time: "2 days ago",
    title: "Free Medical Camp — 500+ Patients Treated",
    description: "Our doctors and nurses served 500+ patients from rural communities. Free checkup, medicines & dental care provided in a single day. 🩺❤️",
    images: [medical, medicalEye],
    category: "medical",
    categoryEmoji: "💊",
    initialLikes: 211,
  },
  {
    id: "p5",
    ngo: "Goonj",
    badge: "ngo",
    location: "Delhi NCR",
    time: "3 days ago",
    title: "Flood Relief — Essentials Distributed",
    description: "Our team distributed dry rations, blankets, and clothing to 80+ families affected by recent floods. Stand with them in this difficult time.",
    images: [flood, shelterTent],
    category: "emergency",
    categoryEmoji: "🚨",
    initialLikes: 78,
  },
  {
    id: "p6",
    ngo: "Indian Red Cross Society",
    badge: "ngo",
    location: "Nagpur, Maharashtra",
    time: "4 days ago",
    title: "Blood Donation Camp — 142 Units Collected",
    description: "Heartfelt thanks to every donor. 142 units of blood collected today will save countless lives across hospitals in our region. ❤️🩸",
    images: [bloodCamp, bloodPoster],
    category: "blood",
    categoryEmoji: "🩸",
    initialLikes: 188,
  },
  {
    id: "p7",
    ngo: "SEWA — Self Employed Women's Association",
    badge: "ngo",
    location: "Ahmedabad, Gujarat",
    time: "5 hours ago",
    title: "Women Empowerment — Tailoring Workshop Graduates 40 Sisters 👩‍🏭",
    description: "40 women from underprivileged communities completed our 6-month tailoring & financial literacy program today. They now have skills to earn a sustainable income for their families. Stand for women, stand for change. ✨",
    images: [womenSewing, smileFood],
    category: "education",
    categoryEmoji: "👩",
    initialLikes: 234,
  },
  {
    id: "p8",
    ngo: "People for Animals (PFA)",
    badge: "ngo",
    location: "Delhi NCR",
    time: "8 hours ago",
    title: "Stray Animal Shelter — 28 Dogs Rescued This Week 🐕",
    description: "Our team rescued 28 injured stray dogs this week. They're now safe at our shelter, getting medical care, vaccinations, food and love. Adopt, don't shop! Visit us this weekend.",
    images: [animal1, animal3],
    category: "animal",
    categoryEmoji: "🐾",
    initialLikes: 312,
  },
  {
    id: "p9",
    ngo: "HelpAge India",
    badge: "ngo",
    location: "Lucknow, Uttar Pradesh",
    time: "Yesterday",
    title: "Old Age Home — Diwali Celebration with Our Elders 🪔",
    description: "Spent the day with 60 senior citizens at our home. Sweets, songs, and so many stories. Loneliness is the worst illness — your visits are the best medicine. ❤️",
    images: [oldAge, childrenCourtyard],
    category: "shelter",
    categoryEmoji: "🏠",
    initialLikes: 167,
  },
  {
    id: "p10",
    ngo: "Nanhi Kali (Mahindra Foundation)",
    badge: "ngo",
    location: "Pune, Maharashtra",
    time: "Yesterday",
    title: "Girl Child Education — 200 Sponsorships Renewed 📚",
    description: "Every educated girl uplifts her entire family. 200 of our Nanhi Kalis received their annual scholarship today. Sponsor a girl's education for ₹3,000/year — change a life forever.",
    images: [classroom2, womenSewing],
    category: "education",
    categoryEmoji: "📚",
    initialLikes: 421,
  },
  {
    id: "p11",
    ngo: "Wildlife SOS India",
    badge: "ngo",
    location: "Agra, Uttar Pradesh",
    time: "2 days ago",
    title: "Animal Welfare Drive — 60 Strays Fed Daily 🐾",
    description: "Our daily feeding rounds reached 60+ strays this week across 4 neighbourhoods. Volunteers also provided basic medical aid to 12 injured dogs. Every life matters.",
    images: [animal3, animal2],
    category: "animal",
    categoryEmoji: "🐾",
    initialLikes: 198,
  },
  {
    id: "p12",
    ngo: "Art of Living India",
    badge: "ngo",
    location: "Bangalore, Karnataka",
    time: "3 days ago",
    title: "Free Yoga Camp — 500 Participants 🧘‍♀️",
    description: "Sunrise yoga session by the lake. 500 community members joined us for free guided meditation and pranayama. Mental wellness is community wellness.",
    images: [yogaGroup, yogaPoster],
    category: "medical",
    categoryEmoji: "🧘",
    initialLikes: 145,
  },
  {
    id: "p13",
    ngo: "Indian Red Cross Society",
    badge: "ngo",
    location: "Mumbai, Maharashtra",
    time: "4 days ago",
    title: "Blood Donation Drive — Corporate Partnership 🩸",
    description: "Partnered with 12 corporate offices for a city-wide blood drive. 580 units collected — enough to save 1,700+ lives. Thank you, Mumbai!",
    images: [bloodGroup, bloodCamp],
    category: "blood",
    categoryEmoji: "🩸",
    initialLikes: 289,
  },
  {
    id: "p14",
    ngo: "Green Yatra",
    badge: "ngo",
    location: "Mumbai, Maharashtra",
    time: "5 days ago",
    title: "Mangrove Restoration — 1,000 Saplings Planted 🌱",
    description: "Coastal protection starts with mangroves. 50 volunteers, 1,000 saplings, 1 beautiful coastline restored. Join our next Sunday plantation drive.",
    images: [greenYatra, treePlant],
    category: "tree",
    categoryEmoji: "🌳",
    initialLikes: 176,
  },
  {
    id: "p15",
    ngo: "WaterAid India",
    badge: "ngo",
    location: "Telangana",
    time: "6 hours ago",
    title: "Clean Water Project — Tanks Installed in 3 Villages 💧",
    description: "Three new community water tanks installed this week, serving 1,200+ households. Clean water is dignity. Schools nearby finally have safe drinking taps for the kids.",
    images: [water1, water2],
    category: "water",
    categoryEmoji: "💧",
    initialLikes: 267,
  },
  {
    id: "p16",
    ngo: "Spandan Trust",
    badge: "ngo",
    location: "North 24 Parganas, West Bengal",
    time: "10 hours ago",
    title: "Winter Clothes Distribution — 400 Families Reached 🧥",
    description: "Our winter drive reached 400 families this season. Sweaters, blankets and warm shoes for children, elders and homeless brothers and sisters. Donate this winter — every warm cloth counts.",
    images: [clothes3, clothes1, clothes2],
    category: "clothes",
    categoryEmoji: "👗",
    initialLikes: 354,
  },
  {
    id: "p17",
    ngo: "HealthReach India",
    badge: "ngo",
    location: "Andhra Pradesh",
    time: "Yesterday",
    title: "Health & Sanitation Mega Camp — 2,400 Beneficiaries 🩺",
    description: "8 veterinary camps, 1,480 cattle vaccinated, 2,400 individuals screened for free. 461,617 households reached through rural sanitation drives. Health for all.",
    images: [healthBanner, medicalEye],
    category: "medical",
    categoryEmoji: "💊",
    initialLikes: 412,
  },
];

interface Comment { id: string; author: string; text: string; }

function FeedPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  // local engagement state per post
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>(
    Object.fromEntries(SEED_POSTS.map((p) => [p.id, { count: p.initialLikes, liked: false }]))
  );
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [unread, setUnread] = useState(0);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [regEvent, setRegEvent] = useState<typeof EVENTS[number] | null>(null);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPeople, setRegPeople] = useState(1);
  const [regBusy, setRegBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("event_registrations").select("event_id").eq("user_id", user.id).then(({ data }) => {
      setRegisteredIds(new Set((data ?? []).map((r) => r.event_id)));
    });
  }, [user]);

  const openRegister = (e: typeof EVENTS[number]) => {
    setRegEvent(e);
    const meta = (user?.user_metadata ?? {}) as { full_name?: string; phone?: string };
    setRegName(meta.full_name ?? "");
    setRegPhone(meta.phone ?? "");
    setRegPeople(1);
  };

  const submitRegistration = async () => {
    if (!user || !regEvent) return;
    if (!regName || !regPhone) { toast.error("Name and phone required"); return; }
    setRegBusy(true);
    const { error } = await supabase.from("event_registrations").insert({
      user_id: user.id,
      event_id: regEvent.id,
      event_title: regEvent.title,
      event_ngo: regEvent.ngo,
      event_date: regEvent.date,
      event_location: regEvent.location,
      full_name: regName,
      phone: regPhone,
      num_people: regPeople,
    });
    setRegBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`You're registered for ${regEvent.title} 🎉`);
    setRegisteredIds((s) => new Set([...s, regEvent.id]));
    setRegEvent(null);
  };

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "user" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false).then(({ count }) => setUnread(count ?? 0));
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SEED_POSTS.filter((p) => {
      if (activeCat && p.category !== activeCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.ngo.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    });
  }, [search, activeCat]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return EVENTS;
    return EVENTS.filter((e) => e.title.toLowerCase().includes(q) || e.ngo.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
  }, [search]);

  const toggleLike = (id: string) => {
    setLikes((prev) => {
      const cur = prev[id];
      return { ...prev, [id]: { count: cur.liked ? cur.count - 1 : cur.count + 1, liked: !cur.liked } };
    });
  };

  const submitComment = (id: string) => {
    const text = commentDrafts[id]?.trim();
    if (!text) return;
    const author = (user?.user_metadata as { full_name?: string } | undefined)?.full_name || user?.email?.split("@")[0] || "You";
    setComments((prev) => ({
      ...prev,
      [id]: [...(prev[id] ?? []), { id: `c${Date.now()}`, author, text }],
    }));
    setCommentDrafts((prev) => ({ ...prev, [id]: "" }));
  };

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar search={search} onSearchChange={setSearch} unreadCount={unread} />

      {/* Categories */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl overflow-x-auto px-3 py-3 scrollbar-hide">
          <div className="flex gap-3">
            {CATEGORIES.map((c) => {
              const active = activeCat === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCat(active ? null : c.key)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl transition-transform",
                      active ? "ring-4 ring-primary scale-105" : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c.bg, borderColor: c.ring }}
                  >
                    {c.emoji}
                  </div>
                  <span className="text-[10px] font-semibold text-foreground whitespace-nowrap max-w-[64px] text-center leading-tight">
                    <DT>{c.label}</DT>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="px-3 py-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-3 px-1 font-display text-lg font-bold text-foreground">📅 {t("feed.upcomingEvents")}</h2>
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
            <div className="flex gap-3 pb-2">
              {filteredEvents.map((e) => (
                <article key={e.id} className="w-64 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <div className="relative h-32 w-full overflow-hidden">
                    <img src={e.banner} alt={e.title} className="h-full w-full object-cover" />
                    <span className={cn("absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold", e.tagColor)}>
                      {e.tag}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] font-semibold text-primary"><DT>{e.ngo}</DT></div>
                    <h3 className="mt-1 font-display text-base font-bold leading-tight text-foreground"><DT>{e.title}</DT></h3>
                    <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date}</div>
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> <DT>{e.location}</DT></div>
                    </div>
                    <Button
                      size="sm"
                      disabled={registeredIds.has(e.id)}
                      className={cn("mt-3 w-full rounded-full text-white", e.btn)}
                      onClick={() => openRegister(e)}
                    >
                      {registeredIds.has(e.id) ? `✓ ${t("feed.registered")}` : t("feed.register")}
                    </Button>
                    <div className="mt-3 border-t border-border pt-2">
                      <ShareButtons title={`${e.title} by ${e.ngo}`} url={`/ngo/${slugifyNgoName(e.ngo)}`} />
                    </div>
                  </div>
                </article>
              ))}
              {filteredEvents.length === 0 && <div className="px-2 py-8 text-sm text-muted-foreground">No events match your search.</div>}
            </div>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="px-3 pb-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h2 className="px-1 font-display text-lg font-bold text-foreground">📢 Community Feed</h2>
          <Link to="/post"><Button size="sm" variant="outline" className="rounded-full"><Plus className="mr-1 h-4 w-4" /> Post</Button></Link>
        </div>

        <div className="mx-auto mt-3 max-w-2xl space-y-4">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No posts match. Try a different category or search.
            </div>
          )}
          {filtered.map((p) => {
            const cat = CATEGORIES.find((c) => c.key === p.category);
            return (
              <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 pt-4">
                  <Avatar className="h-10 w-10 border-2 border-primary/30">
                    <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                      {p.ngo.split(" ").slice(0, 2).map((s) => s[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground"><DT>{p.ngo}</DT></span>
                      <VerifiedBadge kind={p.badge} />
                    </div>
                    <div className="text-[11px] text-muted-foreground">📍 <DT>{p.location}</DT> • {p.time}</div>
                  </div>
                  {cat && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: cat.bg, color: cat.ring }}>
                      {cat.emoji} <DT>{cat.label}</DT>
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="px-4 pt-3">
                  <h3 className="font-display text-base font-bold text-foreground"><DT>{p.title}</DT></h3>
                  <p className="mt-1 text-sm text-muted-foreground"><DT>{p.description}</DT></p>
                </div>

                {/* Images */}
                {p.images.length > 0 && (
                  <div className={cn("mt-3 grid gap-1 px-4", p.images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                    {p.images.map((src, i) => (
                      <img key={i} src={src} alt={`${p.title} ${i + 1}`} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between border-t border-border px-2 py-1">
                  <button onClick={() => toggleLike(p.id)} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition", likes[p.id]?.liked ? "text-destructive" : "text-muted-foreground hover:text-foreground")}>
                    <Heart className={cn("h-4 w-4", likes[p.id]?.liked && "fill-destructive")} />
                    Helpful ({likes[p.id]?.count ?? 0})
                  </button>
                  <button onClick={() => setOpenComments((o) => ({ ...o, [p.id]: !o[p.id] }))} className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <MessageCircle className="h-4 w-4" /> Comment
                  </button>
                  <button onClick={() => { navigator.clipboard?.writeText(`${p.ngo}: ${p.title}`); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>

                {/* Comments */}
                {openComments[p.id] && (
                  <div className="border-t border-border bg-muted/40 px-4 py-3">
                    <div className="space-y-2">
                      {(comments[p.id] ?? []).map((c) => (
                        <div key={c.id} className="rounded-lg bg-card p-2 text-sm shadow-card">
                          <div className="font-semibold text-primary">{c.author}</div>
                          <div className="text-foreground">{c.text}</div>
                        </div>
                      ))}
                      {(comments[p.id]?.length ?? 0) === 0 && (
                        <div className="text-xs text-muted-foreground">Be the first to comment ✨</div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={commentDrafts[p.id] ?? ""}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") submitComment(p.id); }}
                        placeholder="Write a comment…"
                        className="flex-1 rounded-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <Button size="icon" onClick={() => submitComment(p.id)} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <Dialog open={!!regEvent} onOpenChange={(o) => !o && setRegEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for {regEvent?.title}</DialogTitle>
            <DialogDescription>
              {regEvent?.ngo} • {regEvent?.date} • {regEvent?.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={regName} onChange={(e) => setRegName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>How many people are coming?</Label>
              <Input type="number" min={1} max={20} value={regPeople} onChange={(e) => setRegPeople(Math.max(1, Number(e.target.value) || 1))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegEvent(null)}>Cancel</Button>
            <Button onClick={submitRegistration} disabled={regBusy} className="bg-primary text-primary-foreground">
              {regBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
