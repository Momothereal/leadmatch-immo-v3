export const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const fmtInt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export const fmtEurShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(".", ",") + " M€";
  if (n >= 1_000) return Math.round(n / 1_000) + " k€";
  return n + " €";
};

export const FINANCING_LABEL: Record<string, string> = {
  approved: "Accord bancaire",
  in_progress: "Simulation en cours",
  not_started: "Pas démarré",
  cash: "Cash",
  unknown: "Non renseigné",
};

export const TIMELINE_LABEL: Record<string, string> = {
  immediate: "Immédiat",
  "1-3months": "1-3 mois",
  "3-6months": "3-6 mois",
  "6-12months": "6-12 mois",
  exploring: "En exploration",
};

export type ScoreBucket = 1 | 2 | 3 | 4 | 5;

export const scoreBucket = (score: number): ScoreBucket => {
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
};

export const scoreLabel = (score: number) => {
  const labels: Record<ScoreBucket, string> = {
    1: "Incompatible",
    2: "Faible compatibilité",
    3: "Compatibilité moyenne",
    4: "Bonne compatibilité",
    5: "Excellente compatibilité",
  };
  return labels[scoreBucket(score)];
};

export const initialsFor = (name: string) => {
  const parts = name.split(/[\s&]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const colorFor = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return `c${h % 8}`;
};
