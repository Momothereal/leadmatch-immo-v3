// Scoring engine — calcule la compatibilité 0-100 entre un lead et un bien.
// Pondérations alignées sur la vision produit :
//   Budget 40 · Localisation 25 · Type 15 · Surface/Pièces 10 · Critères secondaires 10
//   (les secondaires regroupent timing, financement et DPE)

export interface ScoringProperty {
  id: string;
  title: string;
  city: string | null;
  postal_code: string | null;
  price: number | null;
  surface_m2: number | null;
  rooms: number | null;
  property_type: string;
  transaction_type: string;
  dpe_rating?: string | null;
}

export interface ScoringLead {
  id: string;
  first_name: string;
  last_name: string;
  desired_city: string | null;
  desired_postal_code: string | null;
  budget_min: number | null;
  budget_max: number | null;
  desired_surface_min: number | null;
  desired_rooms_min: number | null;
  desired_property_type: string | null;
  desired_transaction_type: string | null;
  timeline: string | null;
  financing: string | null;
}

export interface ScoreBreakdown {
  budget: number;
  location: number;
  type: number;
  surface: number;
  secondary: number;
}

export interface ScoreResult {
  total: number;
  scores: ScoreBreakdown;
  positives: string[];
  negatives: string[];
}

const WEIGHTS = { budget: 40, location: 25, type: 15, surface: 10, secondary: 10 };

function scoreBudget(price: number | null, min: number | null, max: number | null): number {
  if (!price || (!min && !max)) return 50;
  const lo = min ?? 0;
  const hi = max ?? Number.POSITIVE_INFINITY;
  if (price >= lo && price <= hi) return 100;
  if (price < lo) {
    const gap = (lo - price) / lo;
    return Math.max(40, Math.round(100 - gap * 200));
  }
  // price > hi
  const gap = (price - hi) / hi;
  if (gap < 0.05) return 85;
  if (gap < 0.1) return 65;
  if (gap < 0.2) return 35;
  return 10;
}

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim();
}

function scoreLocation(p: ScoringProperty, l: ScoringLead): number {
  const pCity = norm(p.city), lCity = norm(l.desired_city);
  const pPc = norm(p.postal_code), lPc = norm(l.desired_postal_code);
  if (pPc && lPc && pPc === lPc) return 100;
  if (pCity && lCity && pCity === lCity) return 100;
  if (pCity && lCity && (pCity.includes(lCity.split(" ")[0]) || lCity.includes(pCity.split(" ")[0]))) return 85;
  if (!pCity || !lCity) return 50;
  return 10;
}

function scoreType(p: ScoringProperty, l: ScoringLead): number {
  if (!l.desired_property_type) return 60;
  return p.property_type === l.desired_property_type ? 100 : 20;
}

function scoreSurface(p: ScoringProperty, l: ScoringLead): number {
  // Combine surface (60%) et nombre de pièces (40%) selon ce qui est renseigné.
  let surfaceScore: number | null = null;
  if (p.surface_m2 && l.desired_surface_min) {
    const ratio = p.surface_m2 / l.desired_surface_min;
    if (ratio >= 0.9 && ratio <= 1.3) surfaceScore = 100;
    else if (ratio >= 0.7 && ratio <= 1.6) surfaceScore = 70;
    else surfaceScore = 30;
  }
  let roomsScore: number | null = null;
  if (p.rooms != null && l.desired_rooms_min != null) {
    if (p.rooms >= l.desired_rooms_min) roomsScore = 100;
    else if (p.rooms === l.desired_rooms_min - 1) roomsScore = 60;
    else roomsScore = 25;
  }
  if (surfaceScore == null && roomsScore == null) return 60;
  if (surfaceScore == null) return roomsScore!;
  if (roomsScore == null) return surfaceScore;
  return Math.round(surfaceScore * 0.6 + roomsScore * 0.4);
}

function scoreTiming(l: ScoringLead): number {
  switch (l.timeline) {
    case "immediate": return 100;
    case "1-3months": return 80;
    case "3-6months": return 55;
    case "6-12months": return 30;
    case "exploring": return 20;
    default: return 50;
  }
}

function scoreFinancing(l: ScoringLead): number {
  switch (l.financing) {
    case "cash":
    case "approved": return 100;
    case "in_progress": return 70;
    case "not_started": return 40;
    default: return 50;
  }
}

function scoreDpe(p: ScoringProperty): number {
  if (!p.dpe_rating) return 50;
  const map: Record<string, number> = { A: 100, B: 90, C: 75, D: 60, E: 45, F: 25, G: 10 };
  return map[p.dpe_rating.trim().toUpperCase()] ?? 50;
}

/** Critères secondaires : timing (40%) + financement (40%) + DPE (20%). */
function scoreSecondary(p: ScoringProperty, l: ScoringLead): number {
  const t = scoreTiming(l);
  const f = scoreFinancing(l);
  const d = scoreDpe(p);
  return Math.round(t * 0.4 + f * 0.4 + d * 0.2);
}

export function scoreLeadProperty(lead: ScoringLead, prop: ScoringProperty): ScoreResult {
  const scores: ScoreBreakdown = {
    budget: scoreBudget(prop.price, lead.budget_min, lead.budget_max),
    location: scoreLocation(prop, lead),
    type: scoreType(prop, lead),
    surface: scoreSurface(prop, lead),
    secondary: scoreSecondary(prop, lead),
  };
  const total = Math.round(
    (scores.budget * WEIGHTS.budget
      + scores.location * WEIGHTS.location
      + scores.type * WEIGHTS.type
      + scores.surface * WEIGHTS.surface
      + scores.secondary * WEIGHTS.secondary) / 100
  );

  const positives: string[] = [];
  const negatives: string[] = [];
  if (scores.budget >= 90) positives.push("Budget aligné avec le prix");
  else if (scores.budget < 50) negatives.push("Écart de budget important");
  if (scores.location === 100) positives.push("Même ville recherchée");
  else if (scores.location < 50) negatives.push("Localisation différente");
  if (scores.type === 100) positives.push("Type de bien correspondant");
  else if (scores.type < 50) negatives.push("Type de bien différent");
  if (scores.surface >= 90) positives.push("Surface et pièces dans la cible");
  else if (scores.surface < 50) negatives.push("Surface hors cible");
  if (scores.secondary >= 80) positives.push("Profil prêt (timing + financement)");
  else if (scores.secondary < 45) negatives.push("Timing long ou financement à confirmer");

  return { total, scores, positives, negatives };
}

export const CRITERIA = [
  { key: "budget" as const, label: "Budget", weight: WEIGHTS.budget },
  { key: "location" as const, label: "Localisation", weight: WEIGHTS.location },
  { key: "type" as const, label: "Type de bien", weight: WEIGHTS.type },
  { key: "surface" as const, label: "Surface / Pièces", weight: WEIGHTS.surface },
  { key: "secondary" as const, label: "Critères secondaires", weight: WEIGHTS.secondary },
];

export function scoreBucket(s: number): 1 | 2 | 3 | 4 | 5 {
  if (s <= 20) return 1;
  if (s <= 40) return 2;
  if (s <= 60) return 3;
  if (s <= 80) return 4;
  return 5;
}
