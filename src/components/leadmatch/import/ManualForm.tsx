import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  propertyImportSchema, leadImportSchema,
  propertyTypes, transactionTypes, leadTransactionTypes, timelines, financings,
} from "@/lib/import/schemas";
import { MissingFieldsHint, PROPERTY_CHECKS, LEAD_CHECKS } from "./MissingFieldsHint";

type Kind = "properties" | "leads";

interface Props {
  kind: Kind;
  onCancel: () => void;
  onSaved: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  apartment: "Appartement", house: "Maison", land: "Terrain", commercial: "Local commercial", other: "Autre",
};
const TX_LABEL: Record<string, string> = { sale: "Vente", rent: "Location" };
const LEAD_TX_LABEL: Record<string, string> = { buy: "Achat", rent: "Location" };
const TIMELINE_LABEL: Record<string, string> = {
  immediate: "Immédiat", "1-3months": "1-3 mois", "3-6months": "3-6 mois",
  "6-12months": "6-12 mois", exploring: "En exploration",
};
const FIN_LABEL: Record<string, string> = {
  approved: "Prêt approuvé", in_progress: "En cours", not_started: "Pas commencé",
  cash: "Cash", unknown: "Inconnu",
};

const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
const intv = (v: string) => (v.trim() === "" ? null : parseInt(v, 10));
const str = (v: string) => (v.trim() === "" ? null : v.trim());

export const ManualForm = ({ kind, onCancel, onSaved }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const get = (k: string) => form[k] ?? "";

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("Vous devez être connecté.");
        return;
      }

      let payload: Record<string, unknown>;
      if (kind === "properties") {
        const raw = {
          title: get("title"),
          property_type: get("property_type") || "apartment",
          transaction_type: get("transaction_type") || "sale",
          price: num(get("price")),
          surface_m2: num(get("surface_m2")),
          rooms: intv(get("rooms")),
          bedrooms: intv(get("bedrooms")),
          city: str(get("city")),
          postal_code: str(get("postal_code")),
          neighborhood: str(get("neighborhood")),
          dpe_rating: str(get("dpe_rating")),
          description: str(get("description")),
        };
        const parsed = propertyImportSchema.safeParse(raw);
        if (!parsed.success) {
          const issue = (parsed.error as z.ZodError).issues[0];
          toast.error("Champ invalide", { description: `${issue.path.join(".")} — ${issue.message}` });
          return;
        }
        payload = { ...parsed.data, user_id: auth.user.id };
      } else {
        const raw = {
          first_name: get("first_name"),
          last_name: get("last_name"),
          email: str(get("email")),
          phone: str(get("phone")),
          budget_min: num(get("budget_min")),
          budget_max: num(get("budget_max")),
          desired_property_type: str(get("desired_property_type")),
          desired_transaction_type: str(get("desired_transaction_type")),
          desired_city: str(get("desired_city")),
          desired_postal_code: str(get("desired_postal_code")),
          desired_surface_min: num(get("desired_surface_min")),
          desired_rooms_min: intv(get("desired_rooms_min")),
          timeline: str(get("timeline")),
          financing: str(get("financing")),
          notes: str(get("notes")),
        };
        const parsed = leadImportSchema.safeParse(raw);
        if (!parsed.success) {
          const issue = (parsed.error as z.ZodError).issues[0];
          toast.error("Champ invalide", { description: `${issue.path.join(".")} — ${issue.message}` });
          return;
        }
        payload = { ...parsed.data, user_id: auth.user.id };
      }

      const table = kind === "properties" ? "properties" : "leads";
      const { error } = await supabase.from(table).insert(payload as never);
      if (error) {
        toast.error("Échec de l'enregistrement", { description: error.message });
        return;
      }
      toast.success(kind === "properties" ? "Bien ajouté." : "Lead ajouté.");
      onSaved();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="text-xs text-muted-foreground">
        Renseignez les informations. Les champs marqués <span className="text-destructive">*</span> sont obligatoires.
      </div>

      <MissingFieldsHint
        checks={kind === "properties" ? PROPERTY_CHECKS : LEAD_CHECKS}
        values={form}
      />

      {kind === "properties" ? (
        <div className="space-y-4">
          <Section title="Informations principales">
            <Field label="Titre" required>
              <Input value={get("title")} onChange={(e) => set("title", e.target.value)} placeholder="Ex. Appartement T3 lumineux" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type de bien">
                <EnumSelect value={get("property_type")} onChange={(v) => set("property_type", v)} options={propertyTypes as readonly string[]} labels={TYPE_LABEL} placeholder="Appartement" />
              </Field>
              <Field label="Transaction">
                <EnumSelect value={get("transaction_type")} onChange={(v) => set("transaction_type", v)} options={transactionTypes as readonly string[]} labels={TX_LABEL} placeholder="Vente" />
              </Field>
            </div>
          </Section>

          <Section title="Caractéristiques">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix (€)"><Input inputMode="decimal" value={get("price")} onChange={(e) => set("price", e.target.value)} placeholder="450000" /></Field>
              <Field label="Surface (m²)"><Input inputMode="decimal" value={get("surface_m2")} onChange={(e) => set("surface_m2", e.target.value)} placeholder="75" /></Field>
              <Field label="Pièces"><Input inputMode="numeric" value={get("rooms")} onChange={(e) => set("rooms", e.target.value)} placeholder="3" /></Field>
              <Field label="Chambres"><Input inputMode="numeric" value={get("bedrooms")} onChange={(e) => set("bedrooms", e.target.value)} placeholder="2" /></Field>
              <Field label="DPE (A à G)"><Input maxLength={1} value={get("dpe_rating")} onChange={(e) => set("dpe_rating", e.target.value.toUpperCase())} placeholder="C" /></Field>
            </div>
          </Section>

          <Section title="Localisation">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ville"><Input value={get("city")} onChange={(e) => set("city", e.target.value)} placeholder="Bordeaux" /></Field>
              <Field label="Code postal"><Input value={get("postal_code")} onChange={(e) => set("postal_code", e.target.value)} placeholder="33000" /></Field>
              <Field label="Quartier"><Input value={get("neighborhood")} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Chartrons" /></Field>
            </div>
          </Section>

          <Section title="Description">
            <Field label="Description / caractéristiques">
              <Textarea rows={3} value={get("description")} onChange={(e) => set("description", e.target.value)} placeholder="Parking, balcon, ascenseur, cave…" />
            </Field>
          </Section>
        </div>
      ) : (
        <div className="space-y-4">
          <Section title="Identité">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" required><Input value={get("first_name")} onChange={(e) => set("first_name", e.target.value)} placeholder="Camille" /></Field>
              <Field label="Nom" required><Input value={get("last_name")} onChange={(e) => set("last_name", e.target.value)} placeholder="Lefort" /></Field>
              <Field label="Email"><Input type="email" value={get("email")} onChange={(e) => set("email", e.target.value)} placeholder="camille@exemple.com" /></Field>
              <Field label="Téléphone"><Input value={get("phone")} onChange={(e) => set("phone", e.target.value)} placeholder="06 12 34 56 78" /></Field>
            </div>
          </Section>

          <Section title="Recherche">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type de bien">
                <EnumSelect value={get("desired_property_type")} onChange={(v) => set("desired_property_type", v)} options={propertyTypes as readonly string[]} labels={TYPE_LABEL} placeholder="Tous types" />
              </Field>
              <Field label="Achat / Location">
                <EnumSelect value={get("desired_transaction_type")} onChange={(v) => set("desired_transaction_type", v)} options={leadTransactionTypes as readonly string[]} labels={LEAD_TX_LABEL} placeholder="Achat" />
              </Field>
              <Field label="Ville recherchée"><Input value={get("desired_city")} onChange={(e) => set("desired_city", e.target.value)} placeholder="Bordeaux" /></Field>
              <Field label="Code postal"><Input value={get("desired_postal_code")} onChange={(e) => set("desired_postal_code", e.target.value)} placeholder="33000" /></Field>
              <Field label="Surface min (m²)"><Input inputMode="decimal" value={get("desired_surface_min")} onChange={(e) => set("desired_surface_min", e.target.value)} placeholder="60" /></Field>
              <Field label="Pièces min"><Input inputMode="numeric" value={get("desired_rooms_min")} onChange={(e) => set("desired_rooms_min", e.target.value)} placeholder="3" /></Field>
            </div>
          </Section>

          <Section title="Budget & qualification">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Budget min (€)"><Input inputMode="decimal" value={get("budget_min")} onChange={(e) => set("budget_min", e.target.value)} placeholder="300000" /></Field>
              <Field label="Budget max (€)"><Input inputMode="decimal" value={get("budget_max")} onChange={(e) => set("budget_max", e.target.value)} placeholder="450000" /></Field>
              <Field label="Échéance">
                <EnumSelect value={get("timeline")} onChange={(v) => set("timeline", v)} options={timelines as readonly string[]} labels={TIMELINE_LABEL} placeholder="Non précisé" />
              </Field>
              <Field label="Financement">
                <EnumSelect value={get("financing")} onChange={(v) => set("financing", v)} options={financings as readonly string[]} labels={FIN_LABEL} placeholder="Non précisé" />
              </Field>
            </div>
          </Section>

          <Section title="Notes">
            <Field label="Notes libres">
              <Textarea rows={3} value={get("notes")} onChange={(e) => set("notes", e.target.value)} placeholder="Critères spécifiques, contexte du projet…" />
            </Field>
          </Section>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          <X className="w-3.5 h-3.5 mr-1" /> Retour
        </Button>
        <Button size="sm" onClick={submit} disabled={submitting}>
          {submitting ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Enregistrement…</>
          ) : (
            <><Save className="w-3.5 h-3.5 mr-1.5" /> Enregistrer</>
          )}
        </Button>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-md border border-line bg-card/50 p-3 space-y-3">
    <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">{title}</div>
    {children}
  </div>
);

const Field = ({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

const EnumSelect = ({
  value, onChange, options, labels, placeholder,
}: {
  value: string; onChange: (v: string) => void;
  options: readonly string[]; labels: Record<string, string>; placeholder: string;
}) => (
  <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__" className="text-muted-foreground">— Non précisé —</SelectItem>
      {options.map((o) => (
        <SelectItem key={o} value={o}>{labels[o] ?? o}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);