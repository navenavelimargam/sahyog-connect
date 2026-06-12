// Public NGO directory. Used by the public /ngo/$ngoId page and the
// "Our NGO Partners" section on the landing page.

export interface NgoPartner {
  id: string; // slug
  name: string;
  tagline: string;
  description: string;
  categories: string[];
  districts: string[];
  stats: {
    requestsHandled: number;
    volunteers: number;
    successRate: number; // percentage
  };
  logoEmoji: string;
  color: string; // tailwind bg color class for logo tile
  recentEvents: { title: string; date: string; location: string }[];
  recentPosts: { title: string; excerpt: string; time: string }[];
}

export const NGO_PARTNERS: NgoPartner[] = [
  {
    id: "akshaya-patra",
    name: "Akshaya Patra",
    tagline: "Mid-day meals for India's school children",
    description:
      "Akshaya Patra is the world's largest NGO-run school lunch program, serving freshly cooked meals to over 2 million children across India every school day.",
    categories: ["Food", "Education", "Child Welfare"],
    districts: ["Bengaluru", "Hyderabad", "Jaipur", "Lucknow", "Bhilai", "Vrindavan"],
    stats: { requestsHandled: 1245, volunteers: 380, successRate: 97 },
    logoEmoji: "🍱",
    color: "bg-orange-100",
    recentEvents: [
      { title: "Annapurna Drive — Nagpur Schools", date: "12 June 2026", location: "Nagpur, MH" },
      { title: "Mega Kitchen Open Day", date: "20 June 2026", location: "Hyderabad, TG" },
    ],
    recentPosts: [
      { title: "1.2 million meals served this month", excerpt: "A milestone made possible by every donor and volunteer.", time: "1 day ago" },
      { title: "New kitchen opens in Patna", excerpt: "Serving 50,000 more children every school day.", time: "5 days ago" },
    ],
  },
  {
    id: "goonj",
    name: "Goonj",
    tagline: "Cloth, dignity and disaster relief",
    description:
      "Goonj turns urban surplus into a powerful tool for rural development — clothing, sanitary pads, school kits and disaster relief, all earned through community work.",
    categories: ["Clothes", "Emergency", "Shelter"],
    districts: ["Delhi NCR", "Mumbai", "Kolkata", "Hyderabad", "Bengaluru"],
    stats: { requestsHandled: 980, volunteers: 290, successRate: 95 },
    logoEmoji: "👕",
    color: "bg-amber-100",
    recentEvents: [
      { title: "Vastra Samman Collection Drive", date: "15 June 2026", location: "Delhi NCR" },
      { title: "Flood Relief Convoy — Assam", date: "22 June 2026", location: "Guwahati, AS" },
    ],
    recentPosts: [
      { title: "Winter clothes reached 400 families", excerpt: "Our winter drive concluded across 12 districts.", time: "10 hours ago" },
    ],
  },
  {
    id: "smile-india-trust",
    name: "Smile India Trust",
    tagline: "Food, education and women empowerment",
    description:
      "Smile India Trust works across Uttar Pradesh and Delhi NCR to feed the hungry, educate underprivileged children and uplift women through skill development.",
    categories: ["Food", "Education", "Women Empowerment"],
    districts: ["Meerut", "Lucknow", "Delhi NCR", "Varanasi"],
    stats: { requestsHandled: 612, volunteers: 145, successRate: 93 },
    logoEmoji: "🙂",
    color: "bg-yellow-100",
    recentEvents: [
      { title: "Hot Meal Drive — Jawahar Nagar", date: "16 June 2026", location: "Meerut, UP" },
    ],
    recentPosts: [
      { title: "120 children fed today", excerpt: "Every smile makes it worth it.", time: "2 hours ago" },
    ],
  },
  {
    id: "cry-india",
    name: "CRY India",
    tagline: "Child Rights and You",
    description:
      "CRY restores childhoods by ensuring every child has the right to live, learn, grow and play — working with 100+ grassroots partners across India.",
    categories: ["Education", "Child Welfare", "Health"],
    districts: ["Mumbai", "Delhi NCR", "Kolkata", "Chennai", "Bengaluru"],
    stats: { requestsHandled: 845, volunteers: 220, successRate: 94 },
    logoEmoji: "🧒",
    color: "bg-pink-100",
    recentEvents: [
      { title: "Right to Education Camp", date: "18 June 2026", location: "Mumbai, MH" },
    ],
    recentPosts: [
      { title: "3,200 children back in school", excerpt: "Our annual enrollment drive crossed every target.", time: "3 days ago" },
    ],
  },
  {
    id: "green-yatra",
    name: "Green Yatra",
    tagline: "Plant trees. Restore forests.",
    description:
      "Green Yatra mobilises volunteers across India for native tree plantation, mangrove restoration and urban afforestation drives every weekend.",
    categories: ["Tree Plantation", "Environment"],
    districts: ["Mumbai", "Pune", "Bengaluru", "Hyderabad"],
    stats: { requestsHandled: 530, volunteers: 410, successRate: 96 },
    logoEmoji: "🌳",
    color: "bg-green-100",
    recentEvents: [
      { title: "Green Drive Sunday", date: "5 May 2025", location: "Futala Lake, Nagpur" },
      { title: "Mangrove Restoration Drive", date: "29 June 2026", location: "Mumbai, MH" },
    ],
    recentPosts: [
      { title: "1,000 saplings planted along coast", excerpt: "Coastal protection starts with mangroves.", time: "5 days ago" },
    ],
  },
  {
    id: "pratham",
    name: "Pratham",
    tagline: "Every child in school and learning well",
    description:
      "Pratham is one of India's largest education-focused NGOs, running learning camps, libraries and digital classrooms in 22 states.",
    categories: ["Education"],
    districts: ["Pan-India — 22 states"],
    stats: { requestsHandled: 1530, volunteers: 510, successRate: 98 },
    logoEmoji: "📚",
    color: "bg-blue-100",
    recentEvents: [
      { title: "Read India Learning Camp", date: "10 July 2026", location: "Patna, BR" },
    ],
    recentPosts: [
      { title: "200 sponsorships renewed", excerpt: "Every educated girl uplifts her family.", time: "Yesterday" },
    ],
  },
  {
    id: "helpage-india",
    name: "HelpAge India",
    tagline: "Care, dignity and rights for elders",
    description:
      "HelpAge India works with disadvantaged elders across the country — providing healthcare, livelihood support and elder rights advocacy.",
    categories: ["Shelter", "Medical Aid", "Elder Care"],
    districts: ["Lucknow", "Delhi NCR", "Chennai", "Kolkata"],
    stats: { requestsHandled: 470, volunteers: 180, successRate: 92 },
    logoEmoji: "👵",
    color: "bg-purple-100",
    recentEvents: [
      { title: "Mobile Healthcare Unit", date: "12 July 2026", location: "Lucknow, UP" },
    ],
    recentPosts: [
      { title: "Diwali with our elders", excerpt: "Loneliness is the worst illness — your visits are the best medicine.", time: "Yesterday" },
    ],
  },
];

export function getNgoById(id: string): NgoPartner | undefined {
  return NGO_PARTNERS.find((n) => n.id === id);
}

/** Best-effort lookup by display name (used by feed posts that store the NGO label). */
export function slugifyNgoName(name: string): string {
  const direct = NGO_PARTNERS.find(
    (n) => n.name.toLowerCase() === name.toLowerCase()
  );
  if (direct) return direct.id;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
