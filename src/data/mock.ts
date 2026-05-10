// Mock data — un bien + 12 prospects scorés par l'IA
import { scoreBucket } from "@/lib/format";

export const LISTING = {
  ref: "LM-2438",
  title: "Appartement 5 pièces — Haussmannien",
  address: "Rue de Verneuil, Paris 7e",
  city: "Paris",
  postal: "75007",
  neighborhood: "Saint-Thomas d'Aquin",
  price: 1_850_000,
  pricePerSqm: 21_264,
  surface: 87,
  rooms: 5,
  bedrooms: 3,
  floor: "3e",
  dpe: "C",
  transactionType: "sale" as const,
  propertyType: "apartment" as const,
  published: "il y a 11 jours",
  photos: 24,
  coverUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  status: "Mandat exclusif",
  features: ["Ascenseur", "Cheminée", "Parquet", "Moulures", "Cave"],
};

export const OTHER_PROPERTIES = [
  { id: "LM-2412", title: "3P 68m² — Odéon", city: "Paris 6e", price: 1_390_000, rooms: 3 },
  { id: "LM-2450", title: "4P 92m² — Trocadéro", city: "Paris 16e", price: 1_650_000, rooms: 4 },
  { id: "LM-2421", title: "2P 54m² — Bastille", city: "Paris 11e", price: 895_000, rooms: 2 },
  { id: "LM-2455", title: "5P 110m² — Neuilly", city: "Neuilly-sur-Seine", price: 1_490_000, rooms: 5 },
];

export const CRITERIA_META = {
  budget:    { label: "Budget",              weight: 40 },
  location:  { label: "Localisation",        weight: 25 },
  type:      { label: "Type de bien",        weight: 15 },
  surface:   { label: "Surface & pièces",    weight: 10 },
  secondary: { label: "Critères secondaires", weight: 10 },
} as const;

export type CriteriaKey = keyof typeof CRITERIA_META;

export interface Prospect {
  id: string;
  name: string;
  source: string;
  firstSeen: string;
  lastActivity: string;
  stage: string;
  stageLevel: "hot" | "active" | "cold";
  budget: { min: number; max: number };
  desiredCity: string;
  desiredType: string;
  desiredRooms: number;
  desiredSurface: number;
  timeline: string;
  financing: string;
  visits: number;
  opened: number;
  sent: number;
  scores: Record<CriteriaKey, number>;
  summary: string;
  positives: string[];
  negatives: string[];
  altSuggestion: string | null;
  notes?: string;
  total: number;
  bucket: 1 | 2 | 3 | 4 | 5;
}

const RAW: Omit<Prospect, "total" | "bucket">[] = [
  { id: "p01", name: "Amélie & Thomas Rostand", source: "Meilleurs Agents", firstSeen: "2026-03-14", lastActivity: "il y a 2h", stage: "Offre imminente", stageLevel: "hot", budget: { min: 1_700_000, max: 2_000_000 }, desiredCity: "Paris 7e", desiredType: "apartment", desiredRooms: 4, desiredSurface: 80, timeline: "immediate", financing: "approved", visits: 2, opened: 9, sent: 12, scores: { budget: 98, location: 100, type: 100, surface: 95, secondary: 90 }, summary: "Match quasi parfait : budget pleinement aligné, couple déjà résident du 7e avec accord bancaire BNP à 1,9M€. Deuxième visite programmée avec architecte — signal très fort.", positives: ["Budget 1,7-2M€ — dans la cible", "Accord bancaire validé", "Habitent déjà le 7e", "2e visite avec architecte"], negatives: [], altSuggestion: null, notes: "Couple 38/41, 2 enfants. Cherchent depuis 5 mois, très ciblé." },
  { id: "p02", name: "Sylvie Corbières", source: "Bien'ici", firstSeen: "2026-03-28", lastActivity: "il y a 6h", stage: "Chaud", stageLevel: "hot", budget: { min: 1_600_000, max: 1_900_000 }, desiredCity: "Paris 7e", desiredType: "apartment", desiredRooms: 4, desiredSurface: 80, timeline: "1-3months", financing: "in_progress", visits: 1, opened: 14, sent: 15, scores: { budget: 82, location: 95, type: 100, surface: 92, secondary: 85 }, summary: "Très bon profil avec engagement élevé (14 mails ouverts sur 15). Budget légèrement sous le prix (-2,6%) mais négociable. Compromis signé sur son bien actuel.", positives: ["Engagement exceptionnel", "Compromis signé sur son bien", "Zone idéale (fille rue de Grenelle)"], negatives: ["Budget max à -2,6% du prix", "Financement en cours"], altSuggestion: null, notes: "Veuve, 57 ans. Pied-à-terre près de sa fille." },
  { id: "p03", name: "Claire Mauban", source: "SeLoger", firstSeen: "2026-04-07", lastActivity: "il y a 5h", stage: "Décision cette semaine", stageLevel: "hot", budget: { min: 1_750_000, max: 2_000_000 }, desiredCity: "Paris 7e", desiredType: "apartment", desiredRooms: 4, desiredSurface: 85, timeline: "immediate", financing: "approved", visits: 1, opened: 4, sent: 4, scores: { budget: 95, location: 88, type: 100, surface: 88, secondary: 80 }, summary: "Apport de 850k€ et prêt relais débloqué. A visité 1h45 avec prise de mesures. Décision attendue cette semaine, en concurrence avec un bien rue Jacob.", positives: ["Prêt relais débloqué", "Visite très engagée (1h45)", "Décision imminente"], negatives: ["Concurrence active (rue Jacob)"], altSuggestion: null, notes: "Chef de projet, 43 ans." },
  { id: "p04", name: "Carla & Vincenzo Tosi", source: "Prospection directe", firstSeen: "2026-04-03", lastActivity: "il y a 1 jour", stage: "Qualifié", stageLevel: "active", budget: { min: 1_700_000, max: 2_100_000 }, desiredCity: "Paris 7e", desiredType: "apartment", desiredRooms: 4, desiredSurface: 80, timeline: "1-3months", financing: "cash", visits: 1, opened: 6, sent: 7, scores: { budget: 92, location: 80, type: 100, surface: 85, secondary: 72 }, summary: "Expatriés italiens arrivant à Paris avant septembre. Achat cash sans bien à vendre. Premier achat en France — demandent un accompagnement renforcé.", positives: ["Achat cash — pas de bien à vendre", "Deadline sept. 2026", "Budget large"], negatives: ["Ouverts sur plusieurs arrondissements"], altSuggestion: null, notes: "Expatriés, besoin d'accompagnement." },
  { id: "p05", name: "Famille Haddad-Weiss", source: "Site agence", firstSeen: "2026-02-11", lastActivity: "il y a 3 jours", stage: "Suivi actif", stageLevel: "active", budget: { min: 1_800_000, max: 2_200_000 }, desiredCity: "Paris 6e/7e", desiredType: "apartment", desiredRooms: 5, desiredSurface: 100, timeline: "3-6months", financing: "approved", visits: 0, opened: 6, sent: 8, scores: { budget: 98, location: 72, type: 100, surface: 58, secondary: 62 }, summary: "Budget validé 2,2M€ chez Crédit Agricole Private Bank. Cherchent 4 chambres (le bien en a 3) et 100m²+ (87m² ici). Pas encore de visite malgré 2 relances.", positives: ["Budget 2,2M€ validé", "Deadline rentrée sept. 2026"], negatives: ["Veulent 4 chambres (bien: 3)", "Veulent 100m²+ (bien: 87m²)", "Pas encore de visite"], altSuggestion: null, notes: "4 enfants. Emménagement rentrée." },
  { id: "p06", name: "Martin Lefèvre", source: "Recommandation", firstSeen: "2026-04-02", lastActivity: "il y a 1 jour", stage: "Tiède", stageLevel: "active", budget: { min: 1_500_000, max: 1_800_000 }, desiredCity: "Paris 7e", desiredType: "apartment", desiredRooms: 5, desiredSurface: 85, timeline: "3-6months", financing: "not_started", visits: 1, opened: 7, sent: 10, scores: { budget: 65, location: 92, type: 100, surface: 90, secondary: 55 }, summary: "Profil très ciblé sur le haussmannien du 7e mais budget max à -2,7% du prix. Pas encore de simulation bancaire. Divorce en cours côté client — timing incertain.", positives: ["Cherche exactement un 5P haussmannien", "Brief très aligné"], negatives: ["Budget à -2,7% du prix", "Pas d'accord bancaire", "Divorce → timing flou"], altSuggestion: null, notes: "Dirigeant, 45 ans." },
  { id: "p07", name: "Léa Vasseur", source: "Salon de l'Immo", firstSeen: "2026-03-30", lastActivity: "il y a 2 jours", stage: "En réflexion", stageLevel: "active", budget: { min: 1_500_000, max: 1_850_000 }, desiredCity: "Paris 7e", desiredType: "apartment", desiredRooms: 4, desiredSurface: 95, timeline: "6-12months", financing: "approved", visits: 1, opened: 8, sent: 11, scores: { budget: 78, location: 100, type: 100, surface: 65, secondary: 55 }, summary: "Habite la même rue — connaît l'immeuble. Budget serré (max au prix), et souhaitait 95m²+ (bien: 87m²). Timing flexible.", positives: ["Habite la même rue", "Financement validé"], negatives: ["Budget max = prix", "Surface 87m² vs 95m² souhaités", "Pas de deadline"], altSuggestion: null, notes: "Avocate, 39 ans." },
  { id: "p08", name: "Hugo Marchetti", source: "LinkedIn", firstSeen: "2026-04-15", lastActivity: "il y a 3h", stage: "Nouveau", stageLevel: "active", budget: { min: 1_600_000, max: 1_900_000 }, desiredCity: "Paris 7e/8e", desiredType: "apartment", desiredRooms: 4, desiredSurface: 80, timeline: "1-3months", financing: "not_started", visits: 0, opened: 2, sent: 2, scores: { budget: 72, location: 85, type: 100, surface: 80, secondary: 45 }, summary: "Recommandé par une cliente existante. A consulté le bien 6 fois en 3 jours — signal d'intérêt fort. Mais simulation bancaire non lancée, à cadrer rapidement.", positives: ["Recommandation directe", "6 consultations en 3 jours"], negatives: ["Simulation bancaire non lancée", "Premier achat — profil à sécuriser"], altSuggestion: null, notes: "Entrepreneur tech, 36 ans." },
  { id: "p09", name: "Bertrand & Caroline Nguyen", source: "Le Figaro Immo", firstSeen: "2026-03-20", lastActivity: "il y a 4 jours", stage: "À relancer", stageLevel: "cold", budget: { min: 1_400_000, max: 1_700_000 }, desiredCity: "Paris 7e/15e", desiredType: "apartment", desiredRooms: 4, desiredSurface: 85, timeline: "3-6months", financing: "approved", visits: 1, opened: 5, sent: 9, scores: { budget: 42, location: 88, type: 100, surface: 85, secondary: 40 }, summary: "Budget max à 1,7M€, soit -8% du prix — écart difficile à combler. Visite initiale positive mais pas de réponse aux 2 dernières relances. Exigent un parking, absent du bien.", positives: ["Financement validé", "Visite positive sur la lumière"], negatives: ["Budget à -8% du prix", "Silence depuis 2 relances", "Parking impossible — deal-breaker"], altSuggestion: "LM-2450" },
  { id: "p10", name: "Olivier Rambert", source: "Instagram", firstSeen: "2026-04-11", lastActivity: "il y a 12h", stage: "Qualifié", stageLevel: "active", budget: { min: 1_600_000, max: 2_100_000 }, desiredCity: "Paris 6/7/8/16", desiredType: "apartment", desiredRooms: 4, desiredSurface: 75, timeline: "exploring", financing: "not_started", visits: 0, opened: 3, sent: 3, scores: { budget: 85, location: 60, type: 100, surface: 80, secondary: 35 }, summary: "Budget confortable (a vendu une SCI en 2025) mais recherche peu ciblée sur 4 arrondissements. Aucun accord bancaire ni simulation fournis à ce jour.", positives: ["Budget large jusqu'à 2,1M€", "Patrimoine solide"], negatives: ["Recherche non ciblée (4 arrond.)", "Aucune simulation bancaire"], altSuggestion: null },
  { id: "p11", name: "Jean-Pierre Aubry", source: "PAP", firstSeen: "2026-01-22", lastActivity: "il y a 8 jours", stage: "Froid", stageLevel: "cold", budget: { min: 1_300_000, max: 1_600_000 }, desiredCity: "Paris 7e", desiredType: "apartment", desiredRooms: 4, desiredSurface: 80, timeline: "6-12months", financing: "not_started", visits: 0, opened: 2, sent: 14, scores: { budget: 28, location: 85, type: 100, surface: 80, secondary: 25 }, summary: "Budget à 1,6M€ max — écart de -13,5% avec le prix. Taux d'ouverture à 14%, aucune visite malgré 3 mois de suivi. Profil à déqualifier ou à déplacer sur un bien plus accessible.", positives: [], negatives: ["Écart budget -13,5%", "Désengagement (14% d'ouverture)", "Aucune visite en 3 mois"], altSuggestion: "LM-2421" },
  { id: "p12", name: "Sophie Dantec-Moreau", source: "Newsletter", firstSeen: "2026-02-28", lastActivity: "il y a 2 sem.", stage: "Dormant", stageLevel: "cold", budget: { min: 1_200_000, max: 1_500_000 }, desiredCity: "Paris 7e", desiredType: "apartment", desiredRooms: 3, desiredSurface: 65, timeline: "exploring", financing: "unknown", visits: 0, opened: 1, sent: 8, scores: { budget: 18, location: 85, type: 100, surface: 55, secondary: 20 }, summary: "Écart de budget de -19% rédhibitoire. Ne répond plus depuis fin mars. Profil exploratoire initial, à sortir du pipeline ou à réorienter sur un 3P.", positives: [], negatives: ["Écart budget -19%", "Aucune réponse depuis 3 semaines", "Cherche un 3P (bien: 5P)"], altSuggestion: "LM-2412" },
];

function compute(p: Omit<Prospect, "total" | "bucket">): number {
  let total = 0, ws = 0;
  for (const k in CRITERIA_META) {
    const w = CRITERIA_META[k as CriteriaKey].weight;
    total += (p.scores[k as CriteriaKey] ?? 0) * w;
    ws += w;
  }
  return Math.round(total / ws);
}

export const PROSPECTS: Prospect[] = RAW.map((p) => {
  const total = compute(p);
  return { ...p, total, bucket: scoreBucket(total) };
});
