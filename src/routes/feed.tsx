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
];

interface Comment { id: string; author: string; text: string; }

function FeedPage() {
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

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
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
                    {c.label}
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
          <h2 className="mb-3 px-1 font-display text-lg font-bold text-foreground">📅 Upcoming Events</h2>
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
                    <div className="text-[11px] font-semibold text-primary">{e.ngo}</div>
                    <h3 className="mt-1 font-display text-base font-bold leading-tight text-foreground">{e.title}</h3>
                    <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date}</div>
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</div>
                    </div>
                    <Button size="sm" className={cn("mt-3 w-full rounded-full text-white", e.btn)} onClick={() => alert(`Registered for ${e.title}!`)}>
                      Register Free
                    </Button>
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
                      <span className="text-sm font-bold text-foreground">{p.ngo}</span>
                      <VerifiedBadge kind={p.badge} />
                    </div>
                    <div className="text-[11px] text-muted-foreground">📍 {p.location} • {p.time}</div>
                  </div>
                  {cat && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: cat.bg, color: cat.ring }}>
                      {cat.emoji} {cat.label}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="px-4 pt-3">
                  <h3 className="font-display text-base font-bold text-foreground">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
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

      <BottomNav />
    </div>
  );
}
