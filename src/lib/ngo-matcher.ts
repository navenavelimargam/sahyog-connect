// Lightweight keyword-based NGO recommender.
// Maps emergency description + category to the best NGO in NGO_OPTIONS.

export interface NgoOption {
  name: string;
  emoji: string;
  tags: string;
}

const KEYWORD_WEIGHTS: Record<string, Record<string, number>> = {
  "Akshaya Patra Foundation": { food: 10, starving: 8, hungry: 8, meal: 6, ration: 6, kids: 3, children: 3, school: 4 },
  "Goonj": { clothes: 10, clothing: 9, blanket: 7, disaster: 8, flood: 9, relief: 6, essentials: 5, sanitary: 6 },
  "Smile India Trust": { food: 6, medical: 6, child: 6, kids: 6, hunger: 5 },
  "Médecins Sans Frontières India": { medical: 10, injury: 10, injured: 10, doctor: 8, hospital: 7, blood: 4, accident: 9, wound: 8, fever: 6, sick: 6, emergency: 5 },
  "HelpAge India": { elderly: 10, old: 6, senior: 9, age: 4, grandfather: 7, grandmother: 7, pension: 5 },
  "Green Yatra": { tree: 8, environment: 9, plant: 6, pollution: 6 },
  "Indian Red Cross Society": { blood: 10, emergency: 8, accident: 8, disaster: 8, injury: 7, ambulance: 9 },
  "CRY — Child Rights and You": { child: 10, children: 10, kids: 8, education: 8, school: 7, orphan: 9 },
};

const CATEGORY_BOOST: Record<string, Record<string, number>> = {
  food: { "Akshaya Patra Foundation": 15, "Smile India Trust": 8 },
  medical: { "Médecins Sans Frontières India": 15, "Indian Red Cross Society": 10 },
  shelter: { "Goonj": 12, "Indian Red Cross Society": 8 },
  clothes: { "Goonj": 15 },
};

export function recommendNgo(
  description: string,
  category: string | null,
  options: NgoOption[],
): { ngo: NgoOption; score: number; matchedKeywords: string[] } | null {
  if (options.length === 0) return null;
  const text = description.toLowerCase();
  let best: { ngo: NgoOption; score: number; matchedKeywords: string[] } | null = null;

  for (const ngo of options) {
    const weights = KEYWORD_WEIGHTS[ngo.name] ?? {};
    let score = 0;
    const matched: string[] = [];
    for (const [kw, w] of Object.entries(weights)) {
      if (text.includes(kw)) { score += w; matched.push(kw); }
    }
    if (category) {
      score += CATEGORY_BOOST[category]?.[ngo.name] ?? 0;
    }
    if (!best || score > best.score) best = { ngo, score, matchedKeywords: matched };
  }
  return best && best.score > 0 ? best : null;
}
