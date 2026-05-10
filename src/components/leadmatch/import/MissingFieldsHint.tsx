import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MissingField {
  key: string;
  label: string;
  required?: boolean;
  /** impact sur le scoring — utilisé pour trier/classer */
  impact: "high" | "medium" | "low";
}

interface Props {
  /** champs attendus pour ce type (propriété ou lead) */
  checks: MissingField[];
  /** valeurs courantes du formulaire (ou objet mappé) */
  values: Record<string, unknown>;
  className?: string;
}

const isEmpty = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

const IMPACT_LABEL: Record<MissingField["impact"], string> = {
  high: "Fort impact",
  medium: "Impact moyen",
  low: "Complémentaire",
};

export const MissingFieldsHint = ({ checks, values, className }: Props) => {
  const missing = checks.filter((c) => isEmpty(values[c.key]));
  const requiredMissing = missing.filter((m) => m.required);
  const optionalMissing = missing.filter((m) => !m.required);

  if (missing.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800",
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Toutes les informations utiles au matching sont renseignées.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5 text-xs space-y-2",
        requiredMissing.length > 0
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-amber-200 bg-amber-50 text-amber-900",
        className
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {requiredMissing.length > 0
          ? `${requiredMissing.length} champ(s) obligatoire(s) manquant(s)`
          : `${optionalMissing.length} information(s) manquante(s) — le scoring sera moins précis`}
      </div>

      {requiredMissing.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {requiredMissing.map((f) => (
            <li
              key={f.key}
              className="inline-flex items-center gap-1 rounded border border-destructive/30 bg-background px-1.5 py-0.5 text-[11px] text-destructive"
            >
              {f.label} <span className="opacity-70">*</span>
            </li>
          ))}
        </ul>
      )}

      {optionalMissing.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {optionalMissing.map((f) => (
            <li
              key={f.key}
              className="inline-flex items-center gap-1 rounded border border-amber-300/60 bg-background px-1.5 py-0.5 text-[11px] text-amber-900"
              title={IMPACT_LABEL[f.impact]}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  f.impact === "high"
                    ? "bg-destructive"
                    : f.impact === "medium"
                    ? "bg-amber-500"
                    : "bg-muted-foreground/50"
                )}
              />
              {f.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Définitions par type ──────────────────────────────────────────
export const PROPERTY_CHECKS: MissingField[] = [
  { key: "title", label: "Titre", required: true, impact: "high" },
  { key: "price", label: "Prix", impact: "high" },
  { key: "city", label: "Ville", impact: "high" },
  { key: "property_type", label: "Type de bien", impact: "high" },
  { key: "transaction_type", label: "Transaction", impact: "medium" },
  { key: "surface_m2", label: "Surface", impact: "medium" },
  { key: "rooms", label: "Pièces", impact: "medium" },
  { key: "postal_code", label: "Code postal", impact: "medium" },
  { key: "dpe_rating", label: "DPE", impact: "low" },
  { key: "bedrooms", label: "Chambres", impact: "low" },
];

export const LEAD_CHECKS: MissingField[] = [
  { key: "first_name", label: "Prénom", required: true, impact: "high" },
  { key: "last_name", label: "Nom", required: true, impact: "high" },
  { key: "budget_max", label: "Budget max", impact: "high" },
  { key: "desired_city", label: "Ville recherchée", impact: "high" },
  { key: "desired_property_type", label: "Type recherché", impact: "high" },
  { key: "desired_transaction_type", label: "Achat/Location", impact: "medium" },
  { key: "budget_min", label: "Budget min", impact: "medium" },
  { key: "desired_surface_min", label: "Surface min", impact: "medium" },
  { key: "desired_rooms_min", label: "Pièces min", impact: "medium" },
  { key: "email", label: "Email", impact: "medium" },
  { key: "phone", label: "Téléphone", impact: "low" },
  { key: "timeline", label: "Échéance", impact: "low" },
  { key: "financing", label: "Financement", impact: "low" },
];