import { z } from "zod";

// ─── Énumérations DB ────────────────────────────────────────────────
export const propertyTypes = ["apartment", "house", "land", "commercial", "other"] as const;
export const transactionTypes = ["sale", "rent"] as const;
export const leadTransactionTypes = ["buy", "rent"] as const;
export const timelines = ["immediate", "1-3months", "3-6months", "6-12months", "exploring"] as const;
export const financings = ["approved", "in_progress", "not_started", "cash", "unknown"] as const;

// ─── Schémas Zod (côté client) ──────────────────────────────────────
const numOrNull = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."))),
  z.number().finite().nullable()
);
const intOrNull = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : parseInt(String(v).replace(/[^\d-]/g, ""), 10)),
  z.number().int().nullable()
);
const strOrNull = z.preprocess(
  (v) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim()),
  z.string().max(500).nullable()
);

export const propertyImportSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(200),
  property_type: z.enum(propertyTypes).default("apartment"),
  transaction_type: z.enum(transactionTypes).default("sale"),
  price: numOrNull,
  surface_m2: numOrNull,
  rooms: intOrNull,
  bedrooms: intOrNull,
  city: strOrNull,
  postal_code: strOrNull,
  neighborhood: strOrNull,
  dpe_rating: strOrNull,
  description: strOrNull,
});
export type PropertyImport = z.infer<typeof propertyImportSchema>;

export const leadImportSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(100),
  last_name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.preprocess(
    (v) => (v === "" || v == null ? null : String(v).trim()),
    z.string().email("Email invalide").max(255).nullable()
  ),
  phone: strOrNull,
  budget_min: numOrNull,
  budget_max: numOrNull,
  desired_property_type: z.enum(propertyTypes).nullable().optional(),
  desired_transaction_type: z.enum(leadTransactionTypes).nullable().optional(),
  desired_city: strOrNull,
  desired_postal_code: strOrNull,
  desired_surface_min: numOrNull,
  desired_rooms_min: intOrNull,
  timeline: z.enum(timelines).nullable().optional(),
  financing: z.enum(financings).nullable().optional(),
  notes: strOrNull,
});
export type LeadImport = z.infer<typeof leadImportSchema>;

// ─── Définitions de champs (UI mapping) ─────────────────────────────
export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  hints: string[]; // mots-clés pour auto-détection (lowercase, sans accent)
}

export const propertyFields: FieldDef[] = [
  { key: "title", label: "Titre", required: true, hints: ["titre", "title", "nom", "designation", "intitule"] },
  { key: "property_type", label: "Type de bien", hints: ["type", "categorie", "property type"] },
  { key: "transaction_type", label: "Transaction", hints: ["transaction", "vente", "location", "sale", "rent"] },
  { key: "price", label: "Prix (€)", hints: ["prix", "price", "montant", "tarif", "valeur"] },
  { key: "surface_m2", label: "Surface (m²)", hints: ["surface", "m2", "metres", "area", "superficie"] },
  { key: "rooms", label: "Nombre de pièces", hints: ["pieces", "rooms", "piece", "nb pieces"] },
  { key: "bedrooms", label: "Chambres", hints: ["chambres", "chambre", "bedrooms", "bedroom"] },
  { key: "city", label: "Ville", hints: ["ville", "city", "commune"] },
  { key: "postal_code", label: "Code postal", hints: ["code postal", "cp", "postal", "zip"] },
  { key: "neighborhood", label: "Quartier", hints: ["quartier", "neighborhood", "secteur"] },
  { key: "dpe_rating", label: "DPE", hints: ["dpe", "diagnostic", "energie", "ges"] },
  { key: "description", label: "Description", hints: ["description", "desc", "notes", "commentaire"] },
];

export const leadFields: FieldDef[] = [
  { key: "first_name", label: "Prénom", required: true, hints: ["prenom", "first name", "first", "firstname"] },
  { key: "last_name", label: "Nom", required: true, hints: ["nom", "last name", "last", "lastname", "famille"] },
  { key: "email", label: "Email", hints: ["email", "mail", "courriel", "e-mail"] },
  { key: "phone", label: "Téléphone", hints: ["telephone", "tel", "phone", "mobile", "portable"] },
  { key: "budget_min", label: "Budget min (€)", hints: ["budget min", "min budget", "budget minimum"] },
  { key: "budget_max", label: "Budget max (€)", hints: ["budget max", "max budget", "budget", "budget maximum"] },
  { key: "desired_property_type", label: "Type recherché", hints: ["type recherche", "type bien", "desired type"] },
  { key: "desired_transaction_type", label: "Achat/Location", hints: ["achat", "location", "buy", "rent"] },
  { key: "desired_city", label: "Ville recherchée", hints: ["ville recherche", "ville souhait", "desired city", "secteur"] },
  { key: "desired_postal_code", label: "CP recherché", hints: ["cp recherche", "code postal recherche"] },
  { key: "desired_surface_min", label: "Surface min", hints: ["surface min", "min surface"] },
  { key: "desired_rooms_min", label: "Pièces min", hints: ["pieces min", "min pieces", "rooms min"] },
  { key: "timeline", label: "Échéance", hints: ["echeance", "timeline", "delai", "horizon"] },
  { key: "financing", label: "Financement", hints: ["financement", "financing", "pret", "credit"] },
  { key: "notes", label: "Notes", hints: ["notes", "note", "commentaire", "remarque"] },
];

// ─── Normalisation valeurs enum ─────────────────────────────────────
const propertyTypeMap: Record<string, typeof propertyTypes[number]> = {
  appartement: "apartment", apartment: "apartment", appart: "apartment", flat: "apartment",
  maison: "house", house: "house", villa: "house", pavillon: "house",
  terrain: "land", land: "land",
  commercial: "commercial", commerce: "commercial", local: "commercial", bureau: "commercial",
};
const transactionMap: Record<string, typeof transactionTypes[number]> = {
  vente: "sale", sale: "sale", achat: "sale", vendre: "sale",
  location: "rent", rent: "rent", louer: "rent", locatif: "rent",
};
const leadTxMap: Record<string, typeof leadTransactionTypes[number]> = {
  achat: "buy", buy: "buy", acheter: "buy", acquisition: "buy",
  location: "rent", rent: "rent", louer: "rent",
};
const timelineMap: Record<string, typeof timelines[number]> = {
  immediat: "immediate", immediate: "immediate", urgent: "immediate", "tout de suite": "immediate",
  "1-3 mois": "1-3months", "1-3months": "1-3months",
  "3-6 mois": "3-6months", "3-6months": "3-6months",
  "6-12 mois": "6-12months", "6-12months": "6-12months",
  exploration: "exploring", exploring: "exploring", curieux: "exploring",
};
const financingMap: Record<string, typeof financings[number]> = {
  approuve: "approved", approved: "approved", accepte: "approved", obtenu: "approved",
  "en cours": "in_progress", in_progress: "in_progress", "in progress": "in_progress",
  "non commence": "not_started", not_started: "not_started", "non débuté": "not_started",
  cash: "cash", comptant: "cash",
  inconnu: "unknown", unknown: "unknown",
};

const normalizeKey = (s: unknown) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export function coerceEnum(field: string, value: unknown): unknown {
  if (value == null || value === "") return null;
  const k = normalizeKey(value);
  switch (field) {
    case "property_type":
    case "desired_property_type":
      return propertyTypeMap[k] ?? value;
    case "transaction_type":
      return transactionMap[k] ?? value;
    case "desired_transaction_type":
      return leadTxMap[k] ?? value;
    case "timeline":
      return timelineMap[k] ?? value;
    case "financing":
      return financingMap[k] ?? value;
    default:
      return value;
  }
}
