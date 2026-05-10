// Génère une narration personnalisée pour expliquer pourquoi un lead correspond
// (ou non) à un bien. 100% déterministe, basé sur les données du lead + bien +
// le résultat de scoring. Pensé pour un agent immobilier non technique :
// phrases courtes, chiffrées, actionnables.

import type { ScoringLead, ScoringProperty, ScoreResult } from "./scoring";
import { fmtEurShort } from "./format";

const TYPE_LABEL: Record<string, string> = {
  apartment: "appartement",
  house: "maison",
  land: "terrain",
  commercial: "local commercial",
  other: "bien",
};

const TIMING_PHRASE: Record<string, string> = {
  immediate: "cherche à signer immédiatement",
  "1-3months": "vise une acquisition sous 1 à 3 mois",
  "3-6months": "projette d'acheter dans 3 à 6 mois",
  "6-12months": "n'est pas pressé (6 à 12 mois)",
  exploring: "est encore en phase d'exploration",
};

const FIN_PHRASE: Record<string, string> = {
  cash: "paiement comptant, aucun aléa bancaire",
  approved: "prêt déjà accordé, dossier sécurisé",
  in_progress: "financement en cours d'obtention",
  not_started: "financement pas encore démarré",
};

export interface MatchNarrative {
  headline: string;       // 1 phrase de synthèse
  summary: string;        // 2-3 phrases de vue d'ensemble (bien + lead)
  fit: string[];          // raisons de correspondance
  risks: string[];        // points de friction / raisons de non-correspondance
  recommendation: string; // action suggérée pour l'agent
}

export function buildMatchNarrative(
  lead: ScoringLead,
  property: ScoringProperty,
  result: ScoreResult,
): MatchNarrative {
  const fullName = `${lead.first_name} ${lead.last_name}`.trim();
  const firstName = lead.first_name || "Ce lead";
  const propType = TYPE_LABEL[property.property_type] ?? "bien";
  const desiredType = lead.desired_property_type ? TYPE_LABEL[lead.desired_property_type] : null;
  const price = property.price;
  const budgetMin = lead.budget_min;
  const budgetMax = lead.budget_max;

  // ---------- Headline ----------
  let headline: string;
  if (result.total >= 80) {
    headline = `${fullName} est une excellente cible pour ce ${propType}.`;
  } else if (result.total >= 60) {
    headline = `${fullName} présente un bon potentiel, avec quelques réserves.`;
  } else if (result.total >= 40) {
    headline = `${fullName} n'est que partiellement aligné sur ce bien.`;
  } else {
    headline = `${fullName} ne correspond pas vraiment à ce bien.`;
  }

  // ---------- Summary (vue d'ensemble bien + lead) ----------
  const propBits: string[] = [];
  propBits.push(
    `Ce ${propType}${property.city ? ` à ${property.city}` : ""}${
      price ? ` est proposé à ${fmtEurShort(price)}` : ""
    }`,
  );
  const specs: string[] = [];
  if (property.surface_m2) specs.push(`${property.surface_m2} m²`);
  if (property.rooms) specs.push(`${property.rooms} pièces`);
  if (property.dpe_rating) specs.push(`DPE ${property.dpe_rating.toUpperCase()}`);
  const propLine = specs.length
    ? `${propBits[0]} (${specs.join(", ")}).`
    : `${propBits[0]}.`;

  const leadBits: string[] = [];
  if (budgetMin || budgetMax) {
    const lo = budgetMin ? fmtEurShort(budgetMin) : "libre";
    const hi = budgetMax ? fmtEurShort(budgetMax) : "sans plafond";
    leadBits.push(`budget ${lo} – ${hi}`);
  }
  if (lead.desired_city) leadBits.push(`recherche sur ${lead.desired_city}`);
  if (desiredType) leadBits.push(`cible un ${desiredType}`);
  if (lead.desired_surface_min) leadBits.push(`au moins ${lead.desired_surface_min} m²`);
  if (lead.desired_rooms_min) leadBits.push(`${lead.desired_rooms_min} pièces min.`);
  const leadLine = leadBits.length
    ? `${firstName} : ${leadBits.join(", ")}.`
    : `${firstName} n'a pas précisé tous ses critères.`;

  const contextBits: string[] = [];
  if (lead.timeline && TIMING_PHRASE[lead.timeline]) contextBits.push(`${firstName} ${TIMING_PHRASE[lead.timeline]}`);
  if (lead.financing && FIN_PHRASE[lead.financing]) contextBits.push(FIN_PHRASE[lead.financing]);
  const contextLine = contextBits.length ? `${contextBits.join(" ; ")}.` : "";

  const summary = [propLine, leadLine, contextLine].filter(Boolean).join(" ");

  // ---------- Fit (pourquoi ça correspond) ----------
  const fit: string[] = [];
  const s = result.scores;

  if (s.budget >= 90 && price && (budgetMin || budgetMax)) {
    fit.push(`Budget parfaitement dans la fourchette : prix ${fmtEurShort(price)} contre ${budgetMin ? fmtEurShort(budgetMin) : "0"} – ${budgetMax ? fmtEurShort(budgetMax) : "∞"}.`);
  } else if (s.budget >= 70 && price) {
    fit.push(`Budget proche de la cible (${fmtEurShort(price)}), négociation possible.`);
  }

  if (s.location >= 90 && property.city && lead.desired_city) {
    fit.push(`Localisation idéale : le bien est à ${property.city}, exactement où ${firstName} cherche.`);
  } else if (s.location >= 80) {
    fit.push(`Secteur très proche de la zone recherchée.`);
  }

  if (s.type >= 90 && desiredType) {
    fit.push(`Type de bien recherché : un ${desiredType}, ce qui colle parfaitement.`);
  }

  if (s.surface >= 90) {
    const parts: string[] = [];
    if (property.surface_m2 && lead.desired_surface_min) {
      parts.push(`${property.surface_m2} m² pour un minimum demandé de ${lead.desired_surface_min} m²`);
    }
    if (property.rooms && lead.desired_rooms_min) {
      parts.push(`${property.rooms} pièces (min. ${lead.desired_rooms_min})`);
    }
    fit.push(`Surface et pièces dans la cible${parts.length ? ` : ${parts.join(", ")}` : ""}.`);
  }

  if (lead.financing === "cash") fit.push(`Acheteur cash : aucune dépendance au crédit, closing rapide.`);
  else if (lead.financing === "approved") fit.push(`Prêt déjà accordé : sécurité maximale sur le financement.`);

  if (lead.timeline === "immediate") fit.push(`Timing immédiat : prêt à signer sans délai.`);
  else if (lead.timeline === "1-3months") fit.push(`Calendrier court (1–3 mois), lead chaud.`);

  if (property.dpe_rating && ["A", "B"].includes(property.dpe_rating.trim().toUpperCase())) {
    fit.push(`Bien performant énergétiquement (DPE ${property.dpe_rating.toUpperCase()}), argument fort.`);
  }

  // ---------- Risks (pourquoi ça ne convient pas) ----------
  const risks: string[] = [];

  if (s.budget < 50 && price) {
    if (budgetMax && price > budgetMax) {
      const over = Math.round(((price - budgetMax) / budgetMax) * 100);
      risks.push(`Prix ${fmtEurShort(price)} au-dessus du budget max (${fmtEurShort(budgetMax)}), soit +${over}%.`);
    } else if (budgetMin && price < budgetMin) {
      risks.push(`Prix inférieur au budget minimum du lead : risque de doute sur la qualité.`);
    } else {
      risks.push(`Écart de budget significatif.`);
    }
  } else if (s.budget < 75 && budgetMax && price && price > budgetMax) {
    risks.push(`Prix légèrement au-dessus du budget (${fmtEurShort(price)} vs max ${fmtEurShort(budgetMax)}).`);
  }

  if (s.location < 50) {
    if (property.city && lead.desired_city) {
      risks.push(`Localisation différente : bien à ${property.city}, le lead cherche sur ${lead.desired_city}.`);
    } else {
      risks.push(`Localisation non alignée ou non renseignée.`);
    }
  }

  if (s.type < 50 && desiredType) {
    risks.push(`Type de bien différent : ${propType} proposé contre ${desiredType} recherché.`);
  }

  if (s.surface < 50) {
    if (property.surface_m2 && lead.desired_surface_min && property.surface_m2 < lead.desired_surface_min) {
      risks.push(`Surface trop petite : ${property.surface_m2} m² pour ${lead.desired_surface_min} m² minimum demandés.`);
    }
    if (property.rooms && lead.desired_rooms_min && property.rooms < lead.desired_rooms_min) {
      risks.push(`Nombre de pièces insuffisant : ${property.rooms} vs ${lead.desired_rooms_min} souhaitées.`);
    }
    if (!risks.some(r => r.includes("Surface") || r.includes("pièces"))) {
      risks.push(`Surface/pièces hors cible.`);
    }
  }

  if (lead.financing === "not_started") risks.push(`Financement pas commencé : prévoir un délai avant signature.`);
  if (lead.timeline === "exploring") risks.push(`Lead encore en exploration, pas prêt à décider.`);
  else if (lead.timeline === "6-12months") risks.push(`Horizon d'achat lointain (6–12 mois).`);

  if (property.dpe_rating && ["F", "G"].includes(property.dpe_rating.trim().toUpperCase())) {
    risks.push(`DPE ${property.dpe_rating.toUpperCase()} : passoire thermique, frein potentiel.`);
  }

  // ---------- Missing data notes ----------
  const missing: string[] = [];
  if (!budgetMin && !budgetMax) missing.push("budget");
  if (!lead.desired_city) missing.push("zone recherchée");
  if (!lead.desired_property_type) missing.push("type de bien voulu");
  if (!lead.timeline) missing.push("timing");
  if (!lead.financing) missing.push("financement");
  if (missing.length >= 2) {
    risks.push(`Informations manquantes côté lead : ${missing.join(", ")}. Le score peut évoluer après qualification.`);
  }

  // ---------- Recommendation ----------
  let recommendation: string;
  if (result.total >= 80) {
    recommendation = `Action : contacter ${firstName} en priorité aujourd'hui et proposer une visite rapidement.`;
  } else if (result.total >= 60) {
    recommendation = `Action : envoyer la fiche à ${firstName} en soulignant les points forts et lever les réserves par téléphone.`;
  } else if (result.total >= 40) {
    recommendation = `Action : pertinence moyenne. À qualifier davantage avant d'engager du temps, ou proposer un bien alternatif.`;
  } else {
    recommendation = `Action : ne pas pousser ce bien. Réserver ${firstName} pour un mandat mieux adapté.`;
  }

  return { headline, summary, fit, risks, recommendation };
}