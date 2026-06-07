// AI Matchmaker: rank volunteers for a help request by distance + skill semantic match.

const SKILL_KEYWORDS: Record<string, string[]> = {
  medical: ["medical", "nurse", "doctor", "first aid", "paramedic", "health", "ambulance"],
  food: ["food", "cook", "kitchen", "meal", "ration"],
  shelter: ["shelter", "construction", "carpentry", "housing"],
  emergency: ["rescue", "disaster", "emergency", "firefighter", "swimmer"],
  blood: ["blood", "donor", "medical"],
  water: ["water", "plumber", "sanitation"],
  education: ["teacher", "education", "tutor"],
  tree: ["environment", "planting", "gardening"],
  clothes: ["distribution", "logistics", "general"],
  animal: ["animal", "vet", "rescue"],
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface MatchVolunteer {
  id: string;
  full_name: string;
  skills: string[] | null;
  rating: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MatchRequest {
  category: string;
  priority: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MatchResult {
  volunteer: MatchVolunteer;
  score: number; // 0-100
  distanceKm: number | null;
  skillMatch: number; // 0-100
}

export function rankVolunteers(req: MatchRequest, volunteers: MatchVolunteer[]): MatchResult[] {
  const keywords = SKILL_KEYWORDS[req.category.toLowerCase()] ?? [];

  return volunteers
    .map<MatchResult>((v) => {
      // Skill match score
      const vSkills = (v.skills ?? []).map((s) => s.toLowerCase());
      let hits = 0;
      keywords.forEach((kw) => {
        if (vSkills.some((s) => s.includes(kw))) hits++;
      });
      const skillMatch = keywords.length === 0 ? 50 : Math.round((hits / keywords.length) * 100);

      // Distance score
      let distanceKm: number | null = null;
      let distScore = 50;
      if (
        req.latitude != null && req.longitude != null &&
        v.latitude != null && v.longitude != null
      ) {
        distanceKm = haversineKm(req.latitude, req.longitude, v.latitude, v.longitude);
        // 0 km => 100, 50+ km => 0
        distScore = Math.max(0, Math.round(100 - (distanceKm / 50) * 100));
      }

      const rating = v.rating ?? 4.5;
      const ratingScore = Math.round((rating / 5) * 100);

      // Weight by priority: critical/high prioritise skill > distance; otherwise balanced
      const heavySkill = req.priority === "critical" || req.priority === "high";
      const score = heavySkill
        ? Math.round(skillMatch * 0.55 + distScore * 0.3 + ratingScore * 0.15)
        : Math.round(skillMatch * 0.35 + distScore * 0.45 + ratingScore * 0.2);

      return { volunteer: v, score, distanceKm, skillMatch };
    })
    .sort((a, b) => b.score - a.score);
}
