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
// import { useDynamic } from "@/lib/dynamic-translate";

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
  { key: "tree", emoji: "🌳", bg: "#E8F5E9", ring: "#2E7D32" },
  { key: "blood", emoji: "🩸", bg: "#FFEBEE", ring: "#C62828" },
  { key: "food", emoji: "🍱", bg: "#FFF3E0", ring: "#E65100" },
  { key: "shelter", emoji: "🏠", bg: "#E3F2FD", ring: "#1565C0" },
  { key: "medical", emoji: "💊", bg: "#F3E5F5", ring: "#6A1B9A" },
  { key: "education", emoji: "📚", bg: "#E0F2F1", ring: "#00695C" },
  { key: "emergency", emoji: "🚨", bg: "#FFEBEE", ring: "#B71C1C" },
  { key: "clothes", emoji: "👗", bg: "#FFF8E1", ring: "#F57F17" },
  { key: "water", emoji: "💧", bg: "#E1F5FE", ring: "#0277BD" },
  { key: "animal", emoji: "🐾", bg: "#EFEBE9", ring: "#4E342E" },
];

interface EventCard {
  id: string;
  banner: string;
  tag: string;
  tag_hi?: string; tag_mr?: string; tag_te?: string;
  tagColor: string;
  ngo: string;
  ngo_hi?: string; ngo_mr?: string; ngo_te?: string;
  title: string;
  title_hi?: string; title_mr?: string; title_te?: string;
  location: string;
  location_hi?: string; location_mr?: string; location_te?: string;
  date: string;
  btn: string;
}

const EVENTS: EventCard[] = [
  { 
    id: "e1", banner: bloodPoster, tag: "🩸 Blood Donation", tag_hi: "🩸 रक्तदान", tag_mr: "🩸 रक्तदान", tag_te: "🩸 రక్తదానము", 
    tagColor: "bg-destructive text-destructive-foreground", ngo: "Indian Red Cross Society", ngo_hi: "इंडियन रेड क्रॉस सोसाइटी", ngo_mr: "इंडियन रेड क्रॉस सोसायटी", ngo_te: "ఇండియన్ రెడ్ క్రాస్ సొసైటీ",
    title: "Blood Donation Camp", title_hi: "रक्तदान शिविर", title_mr: "रक्तदान शिबिर", title_te: "రక్తదాన శిబిరం",
    date: "14 May 2025 • 9:00 AM", location: "Community Centre, Nagpur", location_hi: "सामुदायिक केंद्र, नागपुर", location_mr: "सामुदायिक केंद्र, नागपूर", location_te: "కమ్యూనిటీ సెంటర్, నాగపూర్",
    btn: "bg-destructive hover:bg-destructive/90" 
  },
  { 
    id: "e2", banner: treeGroup, tag: "🌳 Environment", tag_hi: "🌳 पर्यावरण", tag_mr: "🌳 पर्यावरण", tag_te: "🌳 పర్యావరణం",
    tagColor: "bg-success text-success-foreground", ngo: "Green Yatra", ngo_hi: "ग्रीन यात्रा", ngo_mr: "ग्रीन यात्रा", ngo_te: "గ్రీన్ యాత్ర",
    title: "Green Drive Sunday", title_hi: "ग्रीन ड्राइव संडे", title_mr: "ग्रीन ड्राइव संडे", title_te: "గ్రీన్ డ్రైవ్ సండే",
    date: "5 May 2025 • 7:00 AM", location: "Futala Lake, Nagpur", location_hi: "फुटाला झील, नागपुर", location_mr: "फुटाळा तलाव, नागपूर", location_te: "ఫుటాల చెరువు, నాగపూర్",
    btn: "bg-success hover:bg-success/90" 
  },
  { 
    id: "e3", banner: medical, tag: "💊 Medical", tag_hi: "💊 मेडिकल", tag_mr: "💊 मेडिकल", tag_te: "💊 వైద్య",
    tagColor: "bg-chart-4 text-white", ngo: "Médecins Sans Frontières India", ngo_hi: "मेडेसिन्स सैन्स फ्रंटियर्स इंडिया", ngo_mr: "मेडेसिन्स सैन्स फ्रंटियर्स इंडिया", ngo_te: "మెడెసిన్స్ సాన్స్ ఫ్రాంటియర్స్ ఇండియా",
    title: "Free Health & Dental Camp", title_hi: "मुफ्त स्वास्थ्य और दंत शिविर", title_mr: "मोफत आरोग्य आणि दंत शिबिर", title_te: "ఉచిత ఆరోగ్య & దంత శిబిరం",
    date: "1 May 2025 • 10:00 AM", location: "Kalamna Ground, Nagpur", location_hi: "कलमना मैदान, नागपुर", location_mr: "कळमना मैदान, नागपूर", location_te: "కలంన గ్రౌండ్, నాగపూర్",
    btn: "bg-chart-4 hover:bg-chart-4/90" 
  },
  { 
    id: "e4", banner: yogaPoster, tag: "🧘 Wellness", tag_hi: "🧘 वेलनेस", tag_mr: "🧘 वेलनेस", tag_te: "🧘 వెల్నెస్",
    tagColor: "bg-accent text-accent-foreground", ngo: "Art of Living India", ngo_hi: "आर्ट ऑफ लिविंग इंडिया", ngo_mr: "आर्ट ऑफ लिविंग इंडिया", ngo_te: "ఆర్ట్ ఆఫ్ లివింగ్ ఇండియా",
    title: "International Yoga Day", title_hi: "अंतर्राष्ट्रीय योग दिवस", title_mr: "आंतरराष्ट्रीय योग दिन", title_te: "అంతర్జాతీయ యోగా దినోత్సవం",
    date: "21 June 2025 • 6:00 AM", location: "Seminary Hills, Nagpur", location_hi: "सेमिनरी हिल्स, नागपुर", location_mr: "सेमिनरी हिल्स, नागपूर", location_te: "సెమినరీ హిల్స్, నాగపూర్",
    btn: "bg-accent hover:bg-accent/90" 
  },
];

interface SeedPost {
  id: string;
  ngo: string;
  ngo_hi?: string; ngo_mr?: string; ngo_te?: string;
  badge: "ngo" | "user" | "volunteer";
  location: string;
  location_hi?: string; location_mr?: string; location_te?: string;
  time: string;
  title: string;
  title_hi?: string; title_mr?: string; title_te?: string;
  description: string;
  description_hi?: string; description_mr?: string; description_te?: string;
  images: string[];
  category: string;
  categoryEmoji: string;
  initialLikes: number;
}

const SEED_POSTS: SeedPost[] = [
  {
    id: "p1",
    ngo: "Smile India Trust",
    ngo_hi: "स्माइल इंडिया ट्रस्ट", ngo_mr: "स्माइल इंडिया ट्रस्ट", ngo_te: "స్మైల్ ఇండియా ట్రస్ట్",
    badge: "ngo",
    location: "Meerut, Uttar Pradesh",
    location_hi: "मेरठ, उत्तर प्रदेश", location_mr: "मेरठ, उत्तर प्रदेश", location_te: "మీరట్, ఉత్తర ప్రదేశ్",
    time: "2 hours ago",
    title: "Food Distribution Drive — Jawahar Nagar",
    title_hi: "खाद्य वितरण अभियान — जवाहर नगर", title_mr: "अन्न वाटप मोहीम — जवाहर नगर", title_te: "ఆహార పంపిణీ కార్యక్రమం — జవహర్ నగర్",
    description: "Our volunteers distributed hot meals to 120+ children and families in Jawahar Nagar today. Your support makes this possible. Every smile makes it worth it! 🙏",
    description_hi: "हमारे स्वयंसेवकों ने आज जवाहर नगर में 120+ बच्चों और परिवारों को गर्म भोजन वितरित किया। आपका सहयोग इसे संभव बनाता है। हर मुस्कान इसे सार्थक बनाती है! 🙏",
    description_mr: "आमच्या स्वयंसेवकांनी आज जवाहर नगरमध्ये 120+ मुले आणि कुटुंबांना गरम जेवण वाटप केले. तुमच्या पाठिंब्यामुळे हे शक्य झाले आहे. प्रत्येक स्मितहास्य ते सार्थ करते! 🙏",
    description_te: "మా వాలంటీర్లు ఈరోజు జవహర్ నగర్‌లో 120+ పిల్లలు మరియు కుటుంబాలకు వేడి భోజనాన్ని పంపిణీ చేశారు. మీ మద్దతు దీనిని సాధ్యం చేస్తుంది. ప్రతి చిరునవ్వు దీనిని సార్థకం చేస్తుంది! 🙏",
    images: [smileFood, flood],
    category: "food",
    categoryEmoji: "🍱",
    initialLikes: 48,
  },
  {
    id: "p2",
    ngo: "Green Yatra",
    ngo_hi: "ग्रीन यात्रा", ngo_mr: "ग्रीन यात्रा", ngo_te: "గ్రీన్ యాత్ర",
    badge: "ngo",
    location: "Pune, Maharashtra",
    location_hi: "पुणे, महाराष्ट्र", location_mr: "पुणे, महाराष्ट्र", location_te: "పూణే, మహారాష్ట్ర",
    time: "5 hours ago",
    title: "Weekend Tree Plantation — 200 Saplings Planted!",
    title_hi: "वीकेंड वृक्षारोपण — 200 पौधे लगाए गए!", title_mr: "वीकेंड वृक्षारोपण — 200 रोपे लावली!", title_te: "వారాంతపు వృక్షారోపణ — 200 మొక్కలు నాటారు!",
    description: "Join us every Sunday morning! Today 8 volunteers planted 200 native saplings near the riverbank. Be the change you want to see. 🌱",
    description_hi: "हर रविवार सुबह हमसे जुड़ें! आज 8 स्वयंसेवकों ने नदी के किनारे 200 देशी पौधे लगाए। वह बदलाव बनें जो आप देखना चाहते हैं। 🌱",
    description_mr: "दर रविवारी सकाळी आमच्याशी जोडा! आज 8 स्वयंसेवकांनी नदीकाठी 200 स्थानिक रोपे लावली. तुम्हाला हवा असलेला बदल स्वतः बना. 🌱",
    description_te: "ప్రతి ఆదివారం ఉదయం మాతో చేరండి! ఈరోజు 8 మంది వాలంటీర్లు నదీతీరంలో 200 స్థానిక మొక్కలను నాటారు. మీరు చూడాలనుకుంటున్న మార్పు మీరే అవ్వండి. 🌱",
    images: [treePlant, treeGroup],
    category: "tree",
    categoryEmoji: "🌳",
    initialLikes: 92,
  },
  {
    id: "p3",
    ngo: "Nanhi Kali (Mahindra Foundation)",
    ngo_hi: "नन्ही कली (महिंद्रा फाउंडेशन)", ngo_mr: "नन्ही कली (महिंद्रा फाउंडेशन)", ngo_te: "నన్హి కలి (మహీంద్రా ఫౌండేషన్)",
    badge: "ngo",
    location: "Bihar",
    location_hi: "बिहार", location_mr: "बिहार", location_te: "బీహార్",
    time: "Yesterday",
    title: "Open-Air Classroom — Education Has No Walls",
    title_hi: "ओपन-एयर क्लासरूम — शिक्षा की कोई दीवार नहीं होती", title_mr: "ओपन-एयर क्लासरूम — शिक्षणाला भिंती नसतात", title_te: "బహిరంగ తరగతి గది — విద్యకు గోడలు లేవు",
    description: "35 children attended our outdoor education session. Knowledge is the greatest gift. No building, no limits — just learning and joy! 📖",
    description_hi: "35 बच्चों ने हमारे आउटडोर शिक्षा सत्र में भाग लिया। ज्ञान सबसे बड़ा उपहार है। कोई इमारत नहीं, कोई सीमा नहीं — बस सीखना और आनंद! 📖",
    description_mr: "35 मुलांनी आमच्या आउटडोर शिक्षण सत्रात हजेरी लावली. ज्ञान ही सर्वात मोठी भेट आहे. कोणतीही इमारत नाही, कोणतीही मर्यादा नाही — फक्त शिकणे आणि आनंद! 📖",
    description_te: "35 మంది పిల్లలు మా బహిరంగ విద్యా సెషన్‌లో పాల్గొన్నారు. జ్ఞానమే గొప్ప బహుమతి. భవనం లేదు, పరిమితులు లేవు — కేవలం అభ్యాసం మరియు ఆనందం! 📖",
    images: [classroom, classroom2],
    category: "education",
    categoryEmoji: "📚",
    initialLikes: 156,
  },
  {
    id: "p4",
    ngo: "Médecins Sans Frontières India",
    ngo_hi: "मेडेसिन्स सैन्स फ्रंटियर्स इंडिया", ngo_mr: "मेडेसिन्स सैन्स फ्रंटियर्स इंडिया", ngo_te: "మెడెసిన్స్ సాన్స్ ఫ్రాంటియర్స్ ఇండియా",
    badge: "ngo",
    location: "Nagpur, Maharashtra",
    location_hi: "नागपुर, महाराष्ट्र", location_mr: "नागपूर, महाराष्ट्र", location_te: "నాగపూర్, మహారాష్ట్ర",
    time: "2 days ago",
    title: "Free Medical Camp — 500+ Patients Treated",
    title_hi: "मुफ्त चिकित्सा शिविर — 500+ मरीजों का इलाज किया गया", title_mr: "मोफत आरोग्य शिबिर — 500+ रुग्णांवर उपचार", title_te: "ఉచిత వైద్య శిబిరం — 500+ మంది రోగులకు చికిత్స",
    description: "Our doctors and nurses served 500+ patients from rural communities. Free checkup, medicines & dental care provided in a single day. 🩺❤️",
    description_hi: "हमारे डॉक्टरों और नर्सों ने ग्रामीण समुदायों के 500+ मरीजों की सेवा की। एक ही दिन में मुफ्त जांच, दवाएं और दंत चिकित्सा प्रदान की गई। 🩺❤️",
    description_mr: "आमच्या डॉक्टरांनी आणि परिचारिकांनी ग्रामीण समुदायातील 500+ रुग्णांची सेवा केली. एकाच दिवसात मोफत तपासणी, औषधे आणि दंत चिकित्सा पुरवण्यात आली. 🩺❤️",
    description_te: "మా వైద్యులు మరియు నర్సులు గ్రామీణ వర్గాలకు చెందిన 500+ రోగులకు సేవలు అందించారు. ఒకే రోజులో ఉచిత తనిఖీ, మందులు & దంత సంరక్షణ అందించబడ్డాయి. 🩺❤️",
    images: [medical, medicalEye],
    category: "medical",
    categoryEmoji: "💊",
    initialLikes: 211,
  },
  {
    id: "p5",
    ngo: "Goonj",
    ngo_hi: "गूंज", ngo_mr: "गुंज", ngo_te: "గూంజ్",
    badge: "ngo",
    location: "Delhi NCR",
    location_hi: "दिल्ली एनसीआर", location_mr: "दिल्ली एनसीआर", location_te: "ఢిల్లీ ఎన్.సి.ఆర్",
    time: "3 days ago",
    title: "Flood Relief — Essentials Distributed",
    title_hi: "बाढ़ राहत — आवश्यक सामग्री वितरित", title_mr: "पूर मदत — जीवनावश्यक वस्तूंचे वाटप", title_te: "వరద సహాయం — నిత్యావసరాల పంపిణీ",
    description: "Our team distributed dry rations, blankets, and clothing to 80+ families affected by recent floods. Stand with them in this difficult time.",
    description_hi: "हमारी टीम ने हाल की बाढ़ से प्रभावित 80+ परिवारों को सूखा राशन, कंबल और कपड़े वितरित किए। इस कठिन समय में उनके साथ खड़े हों।",
    description_mr: "आमच्या टीमने अलीकडील पुरामुळे बाधित झालेल्या 80+ कुटुंबांना कोरडा रेशन, ब्लँकेट आणि कपडे वाटप केले. या कठीण काळात त्यांच्या पाठीशी उभे राहा.",
    description_te: "ఇటీవలి వరదల వల్ల ప్రభావితమైన 80+ కుటుంబాలకు మా బృందం పొడి రేషన్, దుప్పట్లు మరియు దుస్తులను పంపిణీ చేసింది. ఈ క్లిష్ట సమయంలో వారికి తోడుగా ఉండండి.",
    images: [flood, shelterTent],
    category: "emergency",
    categoryEmoji: "🚨",
    initialLikes: 78,
  },
  {
    id: "p6",
    ngo: "Indian Red Cross Society",
    ngo_hi: "इंडियन रेड क्रॉस सोसाइटी", ngo_mr: "इंडियन रेड क्रॉस सोसायटी", ngo_te: "ఇండియన్ రెడ్ క్రాస్ సొసైటీ",
    badge: "ngo",
    location: "Nagpur, Maharashtra",
    location_hi: "नागपुर, महाराष्ट्र", location_mr: "नागपूर, महाराष्ट्र", location_te: "నాगपुर, మహారాష్ట్ర",
    time: "4 days ago",
    title: "Blood Donation Camp — 142 Units Collected",
    title_hi: "रक्तदान शिविर — 142 यूनिट एकत्रित", title_mr: "रक्तदान शिबिर — 142 युनिट्स जमा", title_te: "రక్తదాన శిబిరం — 142 యూనిట్లు సేకరించబడ్డాయి",
    description: "Heartfelt thanks to every donor. 142 units of blood collected today will save countless lives across hospitals in our region. ❤️🩸",
    description_hi: "हर दाता को तहे दिल से धन्यवाद। आज एकत्रित 142 यूनिट रक्त हमारे क्षेत्र के अस्पतालों में अनगिनत लोगों की जान बचाएगा। ❤️🩸",
    description_mr: "प्रत्येक रक्तदात्याचे मनापासून आभार. आज जमा झालेल्या रक्ताच्या 142 युनिट्समुळे आपल्या भागातील रुग्णालयांमध्ये असंख्य लोकांचे प्राण वाचतील. ❤️🩸",
    description_te: "ప్రతి దాతకు హృదయపూర్వక ధన్యవాదాలు. ఈరోజు సేకరించిన 142 యూనిట్ల రక్తం మా ప్రాంతంలోని ఆసుపత్రులలో లెక్కలేనన్ని ప్రాణాలను కాపాడుతుంది. ❤️🩸",
    images: [bloodCamp, bloodPoster],
    category: "blood",
    categoryEmoji: "🩸",
    initialLikes: 188,
  },
  {
    id: "p7",
    ngo: "SEWA — Self Employed Women's Association",
    ngo_hi: "सेवा — स्वरोजगार महिला संघ", ngo_mr: "सेवा — स्वयंरोजगार महिला संघटना", ngo_te: "సేవా — స్వయం ఉపాధి మహిళల సంఘం",
    badge: "ngo",
    location: "Ahmedabad, Gujarat",
    location_hi: "अहमदाबाद, गुजरात", location_mr: "अहमदाबाद, गुजरात", location_te: "అహ్మదాబాద్, గుజరాత్",
    time: "5 hours ago",
    title: "Women Empowerment — Tailoring Workshop Graduates 40 Sisters 👩‍🏭",
    title_hi: "महिला सशक्तिकरण — सिलाई कार्यशाला में 40 बहनें स्नातक हुईं 👩‍🏭", title_mr: "महिला सक्षमीकरण — शिलाई कार्यशाळेतून 40 भगिनी पदवीधर झाल्या 👩‍🏭", title_te: "మహిళా సాధికారత — టైలరింగ్ వర్క్‌షాప్ నుండి 40 మంది సోదరీమణులు పట్టభద్రులయ్యారు 👩‍🏭",
    description: "40 women from underprivileged communities completed our 6-month tailoring & financial literacy program today. They now have skills to earn a sustainable income for their families. Stand for women, stand for change. ✨",
    description_hi: "वंचित समुदायों की 40 महिलाओं ने आज हमारा 6 महीने का सिलाई और वित्तीय साक्षरता कार्यक्रम पूरा किया। अब उनके पास अपने परिवारों के लिए स्थायी आय अर्जित करने का कौशल है। महिलाओं के लिए खड़े हों, बदलाव के लिए खड़े हों। ✨",
    description_mr: "वंचित समाजातील 40 महिलांनी आज आमचा 6 महिन्यांचा शिलाई आणि आर्थिक साक्षरता कार्यक्रम पूर्ण केला. आता त्यांच्याकडे त्यांच्या कुटुंबासाठी शाश्वत उत्पन्न मिळवण्याचे कौशल्य आहे. महिलांसाठी उभे राहा, बदलासाठी उभे राहा. ✨",
    description_te: "పేద వర్గాలకు చెందిన 40 మంది మహిళలు ఈరోజు మా 6 నెలల టైలరింగ్ & ఆర్థిక అక్షరాస్యత కార్యక్రమాన్ని పూర్తి చేశారు. వారు ఇప్పుడు తమ కుటుంబాల కోసం స్థిరమైన ఆదాయాన్ని పొందే నైపుణ్యాలను కలిగి ఉన్నారు. మహిళల కోసం నిలబడండి, మార్పు కోసం నిలబడండి. ✨",
    images: [womenSewing, smileFood],
    category: "education",
    categoryEmoji: "👩",
    initialLikes: 234,
  },
  {
    id: "p8",
    ngo: "People for Animals (PFA)",
    ngo_hi: "पीपल फॉर एनिमल्स (पीएफए)", ngo_mr: "पीपल फॉर एनिमल्स (पीएफए)", ngo_te: "పీపుల్ ఫర్ యానిమల్స్ (పి.ఎఫ్.ఎ)",
    badge: "ngo",
    location: "Delhi NCR",
    location_hi: "दिल्ली एनसीआर", location_mr: "दिल्ली एनसीआर", location_te: "ఢిల్లీ ఎన్.సి.ఆర్",
    time: "8 hours ago",
    title: "Stray Animal Shelter — 28 Dogs Rescued This Week 🐕",
    title_hi: "आवारा पशु आश्रय — इस सप्ताह 28 कुत्तों को बचाया गया 🐕", title_mr: "भटके प्राणी निवारा — या आठवड्यात 28 कुत्र्यांची सुटका 🐕", title_te: "వీధి జంతువుల ఆశ్రయం — ఈ వారం 28 కుక్కలను రక్షించారు 🐕",
    description: "Our team rescued 28 injured stray dogs this week. They're now safe at our shelter, getting medical care, vaccinations, food and love. Adopt, don't shop! Visit us this weekend.",
    description_hi: "हमारी टीम ने इस हफ्ते 28 घायल आवारा कुत्तों को बचाया। वे अब हमारे आश्रय में सुरक्षित हैं, उन्हें चिकित्सा देखभाल, टीकाकरण, भोजन और प्यार मिल रहा है। गोद लें, खरीदें नहीं! इस सप्ताहांत हमसे मिलें।",
    description_mr: "आमच्या टीमने या आठवड्यात 28 जखमी भटक्या कुत्र्यांना वाचवले. ते आता आमच्या निवारा केंद्रात सुरक्षित आहेत, त्यांना वैद्यकीय सेवा, लसीकरण, अन्न आणि प्रेम मिळत आहे. दत्तक घ्या, खरेदी करू नका! या आठवड्यात आम्हाला भेट द्या.",
    description_te: "మా బృందం ఈ వారం 28 గాయపడిన వీధి కుక్కలను రక్షించింది. అవి ఇప్పుడు మా షెల్టర్‌లో సురక్షితంగా ఉన్నాయి, వైద్య సంరక్షణ, టీకాలు, ఆహారం మరియు ప్రేమను పొందుతున్నాయి. దత్తత తీసుకోండి, కొనకండి! ఈ వారాంతంలో మమ్మల్ని సందర్శించండి.",
    images: [animal1, animal3],
    category: "animal",
    categoryEmoji: "🐾",
    initialLikes: 312,
  },
  {
    id: "p9",
    ngo: "HelpAge India",
    ngo_hi: "हेल्पएज इंडिया", ngo_mr: "हेल्पएज इंडिया", ngo_te: "హెల్ప్ ఏజ్ ఇండియా",
    badge: "ngo",
    location: "Lucknow, Uttar Pradesh",
    location_hi: "लखनऊ, उत्तर प्रदेश", location_mr: "लखनऊ, उत्तर प्रदेश", location_te: "లక్నో, ఉత్తర ప్రదేశ్",
    time: "Yesterday",
    title: "Old Age Home — Diwali Celebration with Our Elders 🪔",
    title_hi: "वृद्धाश्रम — हमारे बुजुर्गों के साथ दिवाली का जश्न 🪔", title_mr: "वृद्धाश्रम — आमच्या वृद्धांसोबत दिवाळी साजरी 🪔", title_te: "వృద్ధాశ్రమం — మా పెద్దలతో దీపావళి వేడుకలు 🪔",
    description: "Spent the day with 60 senior citizens at our home. Sweets, songs, and so many stories. Loneliness is the worst illness — your visits are the best medicine. ❤️",
    description_hi: "हमारे घर में 60 वरिष्ठ नागरिकों के साथ दिन बिताया। मिठाइयाँ, गीत और बहुत सारी कहानियाँ। अकेलापन सबसे बड़ी बीमारी है — आपकी मुलाकातें सबसे अच्छी दवा हैं। ❤️",
    description_mr: "आमच्या घरी 60 ज्येष्ठ नागरिकांसोबत दिवस घालवला. मिठाई, गाणी आणि खूप साऱ्या गोष्टी. एकटेपणा हा सर्वात वाईट आजार आहे — तुमची भेट हे सर्वोत्तम औषध आहे. ❤️",
    description_te: "మా హోమ్‌లో 60 మంది సీనియర్ సిటిజన్లతో రోజంతా గడిపాము. స్వీట్లు, పాటలు మరియు ఎన్నో కథలు. ఒంటరితనం అనేది అత్యంత దారుణమైన అనారోగ్యం — మీ సందర్శనలే ఉత్తమ ఔషధం. ❤️",
    images: [oldAge, childrenCourtyard],
    category: "shelter",
    categoryEmoji: "🏠",
    initialLikes: 167,
  },
  {
    id: "p10",
    ngo: "Nanhi Kali (Mahindra Foundation)",
    ngo_hi: "नन्ही कली (महिंद्रा फाउंडेशन)", ngo_mr: "नन्ही कली (महिंद्रा फाउंडेशन)", ngo_te: "నన్హి కలి (మహీంద్రా ఫౌండేషన్)",
    badge: "ngo",
    location: "Pune, Maharashtra",
    location_hi: "पुणे, महाराष्ट्र", location_mr: "पुणे, महाराष्ट्र", location_te: "పూణే, మహారాష్ట్ర",
    time: "Yesterday",
    title: "Girl Child Education — 200 Sponsorships Renewed 📚",
    title_hi: "बालिका शिक्षा — 200 प्रायोजन नवीनीकृत 📚", title_mr: "मुलींचे शिक्षण — 200 प्रायोजकत्वाचे नूतनीकरण 📚", title_te: "బాలికా విద్య — 200 స్పాన్సర్‌షిప్‌లు పునరుద్ధరించబడ్డాయి 📚",
    description: "Every educated girl uplifts her entire family. 200 of our Nanhi Kalis received their annual scholarship today. Sponsor a girl's education for ₹3,000/year — change a life forever.",
    description_hi: "हर शिक्षित लड़की अपने पूरे परिवार का उत्थान करती है। हमारी 200 नन्ही कलियों को आज उनकी वार्षिक छात्रवृत्ति मिली। ₹3,000/वर्ष में एक लड़की की शिक्षा को प्रायोजित करें — हमेशा के लिए एक जीवन बदलें।",
    description_mr: "प्रत्येक शिक्षित मुलगी तिच्या संपूर्ण कुटुंबाचा उद्धार करते. आमच्या 200 नन्ही कलियांना आज त्यांची वार्षिक शिष्यवृत्ती मिळाली. वर्षाला ₹3,000 देऊन एका मुलीच्या शिक्षणाचे प्रायोजक व्हा — कायमचे आयुष्य बदला.",
    description_te: "ప్రతి విద్యావంతురాలైన అమ్మాయి తన కుటుంబాన్ని ఉద్ధరిస్తుంది. మా నన్హి కలిలలో 200 మంది ఈరోజు తమ వార్షిక స్కాలర్‌షిప్‌ను అందుకున్నారు. ఏడాదికి ₹3,000తో ఒక అమ్మాయి చదువును స్పాన్సర్ చేయండి — ఒక జీవితాన్ని శాశ్వతంగా మార్చండి.",
    images: [classroom2, womenSewing],
    category: "education",
    categoryEmoji: "📚",
    initialLikes: 421,
  },
  {
    id: "p11",
    ngo: "Wildlife SOS India",
    ngo_hi: "वाइल्डलाइफ एसओएस इंडिया", ngo_mr: "वाइल्डलाइफ एसओएस इंडिया", ngo_te: "వైల్డ్ లైఫ్ ఎస్.ఓ.ఎస్ ఇండియా",
    badge: "ngo",
    location: "Agra, Uttar Pradesh",
    location_hi: "आगरा, उत्तर प्रदेश", location_mr: "आग्रा, उत्तर प्रदेश", location_te: "ఆగ్రా, ఉత్తర ప్రదేశ్",
    time: "2 days ago",
    title: "Animal Welfare Drive — 60 Strays Fed Daily 🐾",
    title_hi: "पशु कल्याण अभियान — प्रतिदिन 60 आवारा पशुओं को भोजन 🐾", title_mr: "प्राणी कल्याण मोहीम — दररोज 60 भटक्या प्राण्यांना अन्न 🐾", title_te: "జంతు సంక్షేమ కార్యక్రమం — రోజూ 60 వీధి జంతువులకు ఆహారం 🐾",
    description: "Our daily feeding rounds reached 60+ strays this week across 4 neighbourhoods. Volunteers also provided basic medical aid to 12 injured dogs. Every life matters.",
    description_hi: "हमारे दैनिक फीडिंग राउंड इस सप्ताह 4 मोहल्लों में 60+ आवारा पशुओं तक पहुँचे। स्वयंसेवकों ने 12 घायल कुत्तों को बुनियादी चिकित्सा सहायता भी प्रदान की। हर जीवन मायने रखता है।",
    description_mr: "आमच्या दैनंदिन फीडिंग फेऱ्यांनी या आठवड्यात 4 परिसरातील 60+ भटक्या प्राण्यांपर्यंत मजल मारली. स्वयंसेवकांनी 12 जखमी कुत्र्यांना प्राथमिक वैद्यकीय मदतही दिली. प्रत्येक जीव महत्त्वाचा असतो.",
    description_te: "మా రోజువారీ ఆహార పంపిణీ ఈ వారం 4 పరిసరాల్లో 60+ వీధి జంతువులకు చేరుకుంది. వాలంటీర్లు 12 గాయపడిన కుక్కలకు ప్రాథమిక వైద్య సహాయం కూడా అందించారు. ప్రతి ప్రాణం విలువైనదే.",
    images: [animal3, animal2],
    category: "animal",
    categoryEmoji: "🐾",
    initialLikes: 198,
  },
  {
    id: "p12",
    ngo: "Art of Living India",
    ngo_hi: "आर्ट ऑफ लिविंग इंडिया", ngo_mr: "आर्ट ऑफ लिविंग इंडिया", ngo_te: "ఆర్ట్ ఆఫ్ లివింగ్ ఇండియా",
    badge: "ngo",
    location: "Bangalore, Karnataka",
    location_hi: "बैंगलोर, कर्नाटक", location_mr: "बेंगळुरू, कर्नाटक", location_te: "బెంగళూరు, కర్ణాటక",
    time: "3 days ago",
    title: "Free Yoga Camp — 500 Participants 🧘‍♀️",
    title_hi: "निःशुल्क योग शिविर — 500 प्रतिभागी 🧘‍♀️", title_mr: "मोफत योग शिबिर — 500 सहभागी 🧘‍♀️", title_te: "ఉచిత యోగా శిబిరం — 500 మంది పాల్గొనేవారు 🧘‍♀️",
    description: "Sunrise yoga session by the lake. 500 community members joined us for free guided meditation and pranayama. Mental wellness is community wellness.",
    description_hi: "झील के किनारे सूर्योदय योग सत्र। 500 समुदाय के सदस्य मुफ्त निर्देशित ध्यान और प्राणायाम के लिए हमारे साथ जुड़े। मानसिक कल्याण ही सामुदायिक कल्याण है।",
    description_mr: "तलावाकाठी सूर्योदय योग सत्र. मोफत मार्गदर्शित ध्यान आणि प्राणायामासाठी 500 समुदाय सदस्य आमच्याशी जोडले गेले. मानसिक आरोग्य म्हणजे सामुदायिक आरोग्य.",
    description_te: "సరస్సు ఒడ్డున సూర్యోదయ యోగా సెషన్. 500 మంది కమ్యూనిటీ సభ్యులు ఉచిత గైడెడ్ మెడిటేషన్ మరియు ప్రాణాయామం కోసం మాతో చేరారు. మానసిక క్షేమమే సమాజ క్షేమం.",
    images: [yogaGroup, yogaPoster],
    category: "medical",
    categoryEmoji: "🧘",
    initialLikes: 145,
  },
  {
    id: "p13",
    ngo: "Indian Red Cross Society",
    ngo_hi: "इंडियन रेड क्रॉस सोसाइटी", ngo_mr: "इंडियन रेड क्रॉस सोसायटी", ngo_te: "ఇండియన్ రెడ్ క్రాస్ సొసైటీ",
    badge: "ngo",
    location: "Mumbai, Maharashtra",
    location_hi: "मुंबई, महाराष्ट्र", location_mr: "मुंबई, महाराष्ट्र", location_te: "ముంబై, మహారాష్ట్ర",
    time: "4 days ago",
    title: "Blood Donation Drive — Corporate Partnership 🩸",
    title_hi: "रक्तदान अभियान — कॉर्पोरेट साझेदारी 🩸", title_mr: "रक्तदान मोहीम — कॉर्पोरेट भागीदारी 🩸", title_te: "రక్తదాన కార్యక్రమం — కార్పొరేట్ భాగస్వామ్యం 🩸",
    description: "Partnered with 12 corporate offices for a city-wide blood drive. 580 units collected — enough to save 1,700+ lives. Thank you, Mumbai!",
    description_hi: "शहरव्यापी रक्तदान अभियान के लिए 12 कॉर्पोरेट कार्यालयों के साथ भागीदारी की। 580 यूनिट एकत्रित — 1,700+ जान बचाने के लिए पर्याप्त। धन्यवाद, मुंबई!",
    description_mr: "शहरभर रक्तदान मोहिमेसाठी 12 कॉर्पोरेट कार्यालयांसोबत भागीदारी केली. 580 युनिट्स जमा — 1,700+ जीव वाचवण्यासाठी पुरेसे. धन्यवाद, मुंबई!",
    description_te: "నగరం అంతటా రక్తదాన కార్యక్రమం కోసం 12 కార్పొరేట్ కార్యాలయాలతో భాగస్వామ్యం కుదుర్చుకున్నాము. 580 యూనిట్లు సేకరించబడ్డాయి — 1,700+ ప్రాణాలను కాపాడటానికి సరిపోతాయి. ధన్యవాదాలు, ముంబై!",
    images: [bloodGroup, bloodCamp],
    category: "blood",
    categoryEmoji: "🩸",
    initialLikes: 289,
  },
  {
    id: "p14",
    ngo: "Green Yatra",
    ngo_hi: "ग्रीन यात्रा", ngo_mr: "ग्रीन यात्रा", ngo_te: "గ్రీన్ యాత్ర",
    badge: "ngo",
    location: "Mumbai, Maharashtra",
    location_hi: "मुंबई, महाराष्ट्र", location_mr: "मुंबई, महाराष्ट्र", location_te: "ముంబై, మహారాష్ట్ర",
    time: "5 days ago",
    title: "Mangrove Restoration — 1,000 Saplings Planted 🌱",
    title_hi: "मैंग्रोव बहाली — 1,000 पौधे लगाए गए 🌱", title_mr: "कांदळवन पुनरुज्जीवन — 1,000 रोपे लावली 🌱", title_te: "మడ అడవుల పునరుద్ధరణ — 1,000 మొక్కలు నాటారు 🌱",
    description: "Coastal protection starts with mangroves. 50 volunteers, 1,000 saplings, 1 beautiful coastline restored. Join our next Sunday plantation drive.",
    description_hi: "तटीय सुरक्षा मैंग्रोव से शुरू होती है। 50 स्वयंसेवक, 1,000 पौधे, 1 सुंदर तट बहाल। हमारे अगले रविवार के वृक्षारोपण अभियान में शामिल हों।",
    description_mr: "किनारपट्टीचे संरक्षण कांदळवनापासून सुरू होते. 50 स्वयंसेवक, 1,000 रोपे, 1 सुंदर किनारपट्टी पुनर्संचयित. आमच्या पुढच्या रविवारी होणाऱ्या वृक्षारोपण मोहिमेत सामील व्हा.",
    description_te: "తీరప్రాంత రక్షణ మడ అడవులతో ప్రారంభమవుతుంది. 50 మంది వాలంటీర్లు, 1,000 మొక్కలు, 1 అందమైన తీరప్రాంతం పునరుద్ధరించబడింది. మా తదుపరి ఆదివారం మొక్కలు నాటే కార్యక్రమంలో చేరండి.",
    images: [greenYatra, treePlant],
    category: "tree",
    categoryEmoji: "🌳",
    initialLikes: 176,
  },
  {
    id: "p15",
    ngo: "WaterAid India",
    ngo_hi: "वाटरएड इंडिया", ngo_mr: "वॉटरएड इंडिया", ngo_te: "వాటర్ ఎయిడ్ ఇండియా",
    badge: "ngo",
    location: "Telangana",
    location_hi: "तेलंगाना", location_mr: "तेलंगणा", location_te: "తెలంగాణ",
    time: "6 hours ago",
    title: "Clean Water Project — Tanks Installed in 3 Villages 💧",
    title_hi: "स्वच्छ जल परियोजना — 3 गाँवों में टैंक स्थापित 💧", title_mr: "स्वच्छ पाणी प्रकल्प — 3 गावांमध्ये टाक्या बसवल्या 💧", title_te: "స్వచ్ఛమైన నీటి ప్రాజెక్ట్ — 3 గ్రామాలలో ట్యాంకుల ఏర్పాటు 💧",
    description: "Three new community water tanks installed this week, serving 1,200+ households. Clean water is dignity. Schools nearby finally have safe drinking taps for the kids.",
    description_hi: "इस सप्ताह तीन नए सामुदायिक जल टैंक स्थापित किए गए, जो 1,200+ घरों की सेवा कर रहे हैं। स्वच्छ पानी गरिमा है। पास के स्कूलों में आखिरकार बच्चों के लिए सुरक्षित पेयजल नल हैं।",
    description_mr: "या आठवड्यात तीन नवीन सामुदायिक पाण्याच्या टाक्या बसवण्यात आल्या असून, 1,200+ कुटुंबांना सेवा दिली जात आहे. स्वच्छ पाणी ही प्रतिष्ठा आहे. जवळच्या शाळांमध्ये अखेर मुलांसाठी पिण्याच्या पाण्याची सुरक्षित सोय झाली आहे.",
    description_te: "ఈ వారం మూడు కొత్త కమ్యూనిటీ వాటర్ ట్యాంకులు ఏర్పాటు చేయబడ్డాయి, ఇవి 1,200+ కుటుంబాలకు సేవలు అందిస్తున్నాయి. స్వచ్ఛమైన నీరు గౌరవప్రదం. సమీపంలోని పాఠశాలల్లో పిల్లల కోసం ఎట్టకేలకు సురక్షితమైన తాగునీటి కుళాయిలు అందుబాటులోకి వచ్చాయి.",
    images: [water1, water2],
    category: "water",
    categoryEmoji: "💧",
    initialLikes: 267,
  },
  {
    id: "p16",
    ngo: "Spandan Trust",
    ngo_hi: "स्पंदन ट्रस्ट", ngo_mr: "स्पंदन ट्रस्ट", ngo_te: "స్పందన ట్రస్ట్",
    badge: "ngo",
    location: "North 24 Parganas, West Bengal",
    location_hi: "उत्तर 24 परगना, पश्चिम बंगाल", location_mr: "उत्तर 24 परगणा, पश्चिम बंगाल", location_te: "నార్త్ 24 పరగణస్, పశ్చిమ బెంగాల్",
    time: "10 hours ago",
    title: "Winter Clothes Distribution — 400 Families Reached 🧥",
    title_hi: "सर्दियों के कपड़ों का वितरण — 400 परिवार पहुँचे 🧥", title_mr: "हिवाळी कपड्यांचे वाटप — 400 कुटुंबांपर्यंत पोहोचलो 🧥", title_te: "చలికాలం దుస్తుల పంపిణీ — 400 కుటుంబాలకు చేరింది 🧥",
    description: "Our winter drive reached 400 families this season. Sweaters, blankets and warm shoes for children, elders and homeless brothers and sisters. Donate this winter — every warm cloth counts.",
    description_hi: "हमारा शीतकालीन अभियान इस सीजन में 400 परिवारों तक पहुँचा। बच्चों, बुजुर्गों और बेघर भाइयों और बहनों के लिए स्वेटर, कंबल और गर्म जूते। इस सर्दी में दान करें — हर गर्म कपड़ा मायने रखता है।",
    description_mr: "आमची हिवाळी मोहीम या हंगामात 400 कुटुंबांपर्यंत पोहोचली. मुले, वृद्ध आणि बेघर बंधू-भगिनींसाठी स्वेटर, ब्लँकेट आणि उबदार शूज. या हिवाळ्यात दान करा — प्रत्येक उबदार कपडा महत्त्वाचा आहे.",
    description_te: "ఈ సీజన్‌లో మా వింటర్ డ్రైవ్ 400 కుటుంబాలకు చేరుకుంది. పిల్లలు, పెద్దలు మరియు నిరాశ్రయులైన సోదర సోదరీమణుల కోసం స్వెటర్లు, దుప్పట్లు మరియు వెచ్చని బూట్లు. ఈ శీతాకాలంలో దానం చేయండి — ప్రతి వెచ్చని వస్త్రం విలువైనదే.",
    images: [clothes3, clothes1, clothes2],
    category: "clothes",
    categoryEmoji: "👗",
    initialLikes: 354,
  },
  {
    id: "p17",
    ngo: "HealthReach India",
    ngo_hi: "हेल्थरीच इंडिया", ngo_mr: "हेल्थरीच इंडिया", ngo_te: "హెల్త్‌రీచ్ ఇండియా",
    badge: "ngo",
    location: "Andhra Pradesh",
    location_hi: "आंध्र प्रदेश", location_mr: "आंध्र प्रदेश", location_te: "ఆంధ్రప్రదేశ్",
    time: "Yesterday",
    title: "Health & Sanitation Mega Camp — 2,400 Beneficiaries 🩺",
    title_hi: "स्वास्थ्य और स्वच्छता मेगा शिविर — 2,400 लाभार्थी 🩺", title_mr: "आरोग्य आणि स्वच्छता मेगा शिबिर — 2,400 लाभार्थी 🩺", title_te: "ఆరోగ్యం & పారిశుధ్యం మెగా క్యాంప్ — 2,400 మంది లబ్ధిదారులు 🩺",
    description: "8 veterinary camps, 1,480 cattle vaccinated, 2,400 individuals screened for free. 461,617 households reached through rural sanitation drives. Health for all.",
    description_hi: "8 पशु चिकित्सा शिविर, 1,480 मवेशियों का टीकाकरण, 2,400 व्यक्तियों की मुफ्त जांच। ग्रामीण स्वच्छता अभियान के माध्यम से 461,617 घरों तक पहुँचे। सभी के लिए स्वास्थ्य।",
    description_mr: "8 पशुवैद्यकीय शिबिरे, 1,480 गुरांचे लसीकरण, 2,400 व्यक्तींची मोफत तपासणी. ग्रामीण स्वच्छता मोहिमेद्वारे 461,617 घरांपर्यंत पोहोचलो. सर्वांसाठी आरोग्य.",
    description_te: "8 పశువైద్య శిబిరాలు, 1,480 పశువులకు టీకాలు, 2,400 మంది వ్యక్తులకు ఉచిత స్క్రీనింగ్. గ్రామీణ పారిశుధ్య డ్రైవ్‌ల ద్వారా 461,617 ఇళ్లకు చేరుకున్నాము. అందరికీ ఆరోగ్యం.",
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
                      {t(`feedCategories.${c.key}`)}
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
                      <DT en={e.tag} hi={(e as any).tag_hi} mr={(e as any).tag_mr} te={(e as any).tag_te} />
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] font-semibold text-primary"><DT en={e.ngo} hi={e.ngo_hi} mr={e.ngo_mr} te={e.ngo_te} /></div>
                    <h3 className="mt-1 font-display text-base font-bold leading-tight text-foreground"><DT en={e.title} hi={e.title_hi} mr={e.title_mr} te={e.title_te} /></h3>
                    <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date}</div>
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> <DT en={e.location} hi={e.location_hi} mr={e.location_mr} te={e.location_te} /></div>
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
              {filteredEvents.length === 0 && <div className="px-2 py-8 text-sm text-muted-foreground">{t("feed.noEventsMatch")}</div>}
            </div>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="px-3 pb-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h2 className="px-1 font-display text-lg font-bold text-foreground">📢 {t("feed.communityFeed")}</h2>
          <Link to="/post"><Button size="sm" variant="outline" className="rounded-full"><Plus className="mr-1 h-4 w-4" /> {t("feed.post")}</Button></Link>
        </div>

        <div className="mx-auto mt-3 max-w-2xl space-y-4">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("feed.noPostsMatch")}
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
                      <span className="text-sm font-bold text-foreground"><DT en={p.ngo} hi={p.ngo_hi} mr={p.ngo_mr} te={p.ngo_te} /></span>
                      <VerifiedBadge kind={p.badge} />
                    </div>
                    <div className="text-[11px] text-muted-foreground">📍 <DT en={p.location} hi={p.location_hi} mr={p.location_mr} te={p.location_te} /> • {p.time}</div>
                  </div>
                  {cat && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: cat.bg, color: cat.ring }}>
                      {cat.emoji} {t(`feedCategories.${cat.key}`)}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="px-4 pt-3">
                  <h3 className="font-display text-base font-bold text-foreground"><DT en={p.title} hi={p.title_hi} mr={p.title_mr} te={p.title_te} /></h3>
                  <p className="mt-1 text-sm text-muted-foreground"><DT en={p.description} hi={p.description_hi} mr={p.description_mr} te={p.description_te} /></p>
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
                    <MessageCircle className="h-4 w-4" /> {t("feed.comment")}
                  </button>
                  <button onClick={() => { navigator.clipboard?.writeText(`${p.ngo}: ${p.title}`); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <Share2 className="h-4 w-4" /> {t("feed.share")}
                  </button>
                </div>

                {/* Social share row */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2">
                  <Link
                    to="/ngo/$ngoId"
                    params={{ ngoId: slugifyNgoName(p.ngo) }}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    View NGO →
                  </Link>
                  <ShareButtons
                    title={`${p.title} — ${p.ngo}`}
                    url={`/ngo/${slugifyNgoName(p.ngo)}`}
                    caption={`${p.title}\n\n${p.description}\n\nSeen on Sahyog.`}
                  />
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
                        <div className="text-xs text-muted-foreground">{t("feed.beTheFirst")}</div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={commentDrafts[p.id] ?? ""}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") submitComment(p.id); }}
                        placeholder={t("feed.writeComment")}
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

function TranslatedFeedText({ i18nKey, fallback }: { i18nKey: string; fallback: string }) {
  const { t, i18n } = useTranslation();
  const dynamicFallback = useDynamic(fallback);
  return <>{i18n.exists(i18nKey) ? t(i18nKey) : dynamicFallback}</>;
}
