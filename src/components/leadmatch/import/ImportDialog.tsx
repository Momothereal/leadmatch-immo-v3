import { useCallback, useMemo, useState } from "react";
import { Upload, FileSpreadsheet, ClipboardPaste, Loader2, CheckCircle2, AlertCircle, X, PenLine } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  propertyFields,
  leadFields,
  propertyImportSchema,
  leadImportSchema,
  FieldDef,
} from "@/lib/import/schemas";
import { parseFile, parsePastedText, autoMap, applyMapping, ParsedTable } from "@/lib/import/parse";
import { ManualForm } from "./ManualForm";
import { MissingFieldsHint, PROPERTY_CHECKS, LEAD_CHECKS, MissingField } from "./MissingFieldsHint";

type ImportKind = "properties" | "leads";
type Step = "source" | "mapping" | "preview" | "manual";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultKind?: ImportKind;
}

export const ImportDialog = ({ open, onOpenChange, defaultKind = "properties" }: Props) => {
  const [kind, setKind] = useState<ImportKind>(defaultKind);
  const [step, setStep] = useState<Step>("source");
  const [parsed, setParsed] = useState<ParsedTable | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [pastedText, setPastedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fields: FieldDef[] = kind === "properties" ? propertyFields : leadFields;
  const schema = kind === "properties" ? propertyImportSchema : leadImportSchema;

  const reset = () => {
    setStep("source");
    setParsed(null);
    setMapping({});
    setPastedText("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const ingestTable = (table: ParsedTable) => {
    if (table.rows.length === 0) {
      toast.error("Aucune ligne détectée dans la source.");
      return;
    }
    setParsed(table);
    setMapping(autoMap(table.headers, fields));
    setStep("mapping");
  };

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const table = await parseFile(file);
        ingestTable(table);
      } catch (e) {
        toast.error("Lecture du fichier impossible.", {
          description: e instanceof Error ? e.message : "Format non supporté.",
        });
      }
    },
    [fields]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Validation aperçu
  const validation = useMemo(() => {
    if (!parsed) return { valid: [] as Record<string, unknown>[], errors: [] as { row: number; message: string }[] };
    const mapped = applyMapping(parsed.rows, mapping);
    const valid: Record<string, unknown>[] = [];
    const errors: { row: number; message: string }[] = [];
    mapped.forEach((row, i) => {
      const result = schema.safeParse(row);
      if (result.success) valid.push(result.data);
      else {
        const issue = (result.error as z.ZodError).issues[0];
        errors.push({ row: i + 2, message: `${issue.path.join(".")} — ${issue.message}` });
      }
    });
    return { valid, errors };
  }, [parsed, mapping, schema]);

  const requiredOk = useMemo(
    () => fields.filter((f) => f.required).every((f) => Object.values(mapping).includes(f.key)),
    [fields, mapping]
  );

  const submit = async () => {
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Vous devez être connecté pour importer.");
      setSubmitting(false);
      return;
    }
    const payload = validation.valid.map((row) => ({ ...row, user_id: auth.user!.id }));
    const table = kind === "properties" ? "properties" : "leads";
    const { error } = await supabase.from(table).insert(payload as never);
    setSubmitting(false);
    if (error) {
      toast.error("Échec de l'import.", { description: error.message });
      return;
    }
    toast.success(`${payload.length} ${kind === "properties" ? "bien(s)" : "lead(s)"} importé(s).`);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[calc(100vh-2rem)] p-0 gap-0 overflow-y-auto">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="text-base font-semibold">Importer des données</DialogTitle>
          <DialogDescription className="text-xs">
            Glissez un fichier Excel/CSV, collez depuis un tableur, puis validez le mapping avant enregistrement.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={kind}
          onValueChange={(v) => {
            setKind(v as ImportKind);
            reset();
          }}
          className="px-6 pt-4"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-xs">
            <TabsTrigger value="properties">Mes biens</TabsTrigger>
            <TabsTrigger value="leads">Mes leads</TabsTrigger>
          </TabsList>

          {(["properties", "leads"] as const).map((k) => (
            <TabsContent key={k} value={k} className="mt-4">
              {step === "source" && (
                <SourceStep
                  dragActive={dragActive}
                  setDragActive={setDragActive}
                  onDrop={onDrop}
                  onFile={handleFile}
                  pastedText={pastedText}
                  setPastedText={setPastedText}
                  onPasteSubmit={() => ingestTable(parsePastedText(pastedText))}
                  onManual={() => setStep("manual")}
                />
              )}

              {step === "manual" && (
                <ManualForm
                  kind={k}
                  onCancel={reset}
                  onSaved={() => handleClose(false)}
                />
              )}

              {step === "mapping" && parsed && (
                <MappingStep
                  parsed={parsed}
                  fields={fields}
                  mapping={mapping}
                  setMapping={setMapping}
                  requiredOk={requiredOk}
                  errorCount={validation.errors.length}
                  validCount={validation.valid.length}
                  onBack={reset}
                  onNext={() => setStep("preview")}
                />
              )}

              {step === "preview" && parsed && (
                <PreviewStep
                  fields={fields}
                  mapping={mapping}
                  parsed={parsed}
                  validation={validation}
                  submitting={submitting}
                  kind={k}
                  onBack={() => setStep("mapping")}
                  onSubmit={submit}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ─── Étape 1 : source ──────────────────────────────────────────────
const SourceStep = ({
  dragActive,
  setDragActive,
  onDrop,
  onFile,
  pastedText,
  setPastedText,
  onPasteSubmit,
  onManual,
}: {
  dragActive: boolean;
  setDragActive: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFile: (file: File) => void;
  pastedText: string;
  setPastedText: (v: string) => void;
  onPasteSubmit: () => void;
  onManual: () => void;
}) => (
  <div className="space-y-5 pb-6">
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
      )}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Upload className="w-5 h-5" />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium">Glissez votre fichier Excel ou CSV</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Formats acceptés : .xlsx, .xls, .csv
        </div>
      </div>
      <input
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <Button variant="outline" size="sm" type="button" className="pointer-events-none">
        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Parcourir
      </Button>
    </label>

    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">ou collez vos données</span>
      <div className="h-px flex-1 bg-border" />
    </div>

    <div className="space-y-2">
      <Textarea
        value={pastedText}
        onChange={(e) => setPastedText(e.target.value)}
        placeholder={`Collez depuis Excel / Google Sheets — la première ligne doit contenir les en-têtes.\n\nNom\tPrénom\tEmail\nLefort\tCamille\tcamille@…`}
        rows={6}
        className="font-mono text-xs"
      />
      <Button
        onClick={onPasteSubmit}
        disabled={!pastedText.trim()}
        size="sm"
        variant="secondary"
        className="w-full"
      >
        <ClipboardPaste className="w-3.5 h-3.5 mr-1.5" /> Analyser le texte collé
      </Button>
    </div>

    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">ou saisissez manuellement</span>
      <div className="h-px flex-1 bg-border" />
    </div>

    <Button onClick={onManual} variant="outline" size="sm" className="w-full">
      <PenLine className="w-3.5 h-3.5 mr-1.5" /> Saisir une fiche à la main
    </Button>
  </div>
);

// ─── Étape 2 : mapping ─────────────────────────────────────────────
const MappingStep = ({
  parsed,
  fields,
  mapping,
  setMapping,
  requiredOk,
  errorCount,
  validCount,
  onBack,
  onNext,
}: {
  parsed: ParsedTable;
  fields: FieldDef[];
  mapping: Record<string, string | null>;
  setMapping: (m: Record<string, string | null>) => void;
  requiredOk: boolean;
  errorCount: number;
  validCount: number;
  onBack: () => void;
  onNext: () => void;
}) => {
  const usedKeys = new Set(Object.values(mapping).filter(Boolean) as string[]);
  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {parsed.rows.length} ligne(s) détectée(s) · {parsed.headers.length} colonne(s)
        </span>
        <div className="flex items-center gap-2">
          {requiredOk ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> Champs requis OK
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" /> Champs requis manquants
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="h-[320px] rounded-md border">
        <div className="divide-y">
          {parsed.headers.map((header) => {
            const sample = parsed.rows.slice(0, 3).map((r) => String(r[header] ?? "")).filter(Boolean);
            return (
              <div key={header} className="grid grid-cols-12 gap-3 items-center px-4 py-2.5">
                <div className="col-span-5 min-w-0">
                  <div className="text-[13px] font-medium truncate">{header}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {sample.length ? sample.join(" · ") : "—"}
                  </div>
                </div>
                <div className="col-span-1 text-center text-muted-foreground">→</div>
                <div className="col-span-6">
                  <Select
                    value={mapping[header] ?? "__none__"}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, [header]: v === "__none__" ? null : v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Ignorer cette colonne" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-muted-foreground">
                        Ignorer
                      </SelectItem>
                      {fields.map((f) => {
                        const isUsed = usedKeys.has(f.key) && mapping[header] !== f.key;
                        return (
                          <SelectItem key={f.key} value={f.key} disabled={isUsed}>
                            {f.label}
                            {f.required && <span className="text-destructive ml-1">*</span>}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-muted-foreground">
          {validCount} ligne(s) valide(s) · {errorCount} erreur(s)
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Retour
          </Button>
          <Button size="sm" onClick={onNext} disabled={!requiredOk || validCount === 0}>
            Aperçu
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Étape 3 : aperçu & validation ─────────────────────────────────
const PreviewStep = ({
  fields,
  mapping,
  parsed,
  validation,
  submitting,
  kind,
  onBack,
  onSubmit,
}: {
  fields: FieldDef[];
  mapping: Record<string, string | null>;
  parsed: ParsedTable;
  validation: { valid: Record<string, unknown>[]; errors: { row: number; message: string }[] };
  submitting: boolean;
  kind: ImportKind;
  onBack: () => void;
  onSubmit: () => void;
}) => {
  const mappedFields = fields.filter((f) => Object.values(mapping).includes(f.key));
  const previewRows = validation.valid.slice(0, 5);

  // Analyse les champs manquants de façon agrégée sur les lignes valides.
  const checks: MissingField[] = kind === "properties" ? PROPERTY_CHECKS : LEAD_CHECKS;
  const totalRows = validation.valid.length;
  const missingAggregated = checks
    .map((c) => {
      const emptyCount = validation.valid.filter(
        (r) => r[c.key] == null || r[c.key] === ""
      ).length;
      return { check: c, emptyCount };
    })
    .filter((m) => m.emptyCount > 0)
    // on considère "manquant à l'échelle de l'import" si > 50% des lignes n'ont pas la donnée
    .filter((m) => m.emptyCount / Math.max(1, totalRows) > 0.5);

  // Convertit en "values" synthétiques pour réutiliser MissingFieldsHint :
  // une clé est "remplie" si au moins 50% des lignes l'ont.
  const aggregatedValues: Record<string, unknown> = {};
  checks.forEach((c) => {
    const filled = validation.valid.filter((r) => r[c.key] != null && r[c.key] !== "").length;
    if (filled / Math.max(1, totalRows) > 0.5) aggregatedValues[c.key] = "ok";
  });

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="w-3 h-3" /> {validation.valid.length} prête(s) à importer
        </Badge>
        {validation.errors.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" /> {validation.errors.length} ignorée(s)
          </Badge>
        )}
        <span className="text-muted-foreground ml-auto">sur {parsed.rows.length} lignes source</span>
      </div>

      {totalRows > 0 && (
        <MissingFieldsHint checks={checks} values={aggregatedValues} />
      )}

      <ScrollArea className="h-[260px] rounded-md border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 sticky top-0">
            <tr>
              {mappedFields.map((f) => (
                <th key={f.key} className="text-left px-3 py-2 font-medium whitespace-nowrap">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-t">
                {mappedFields.map((f) => (
                  <td key={f.key} className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                    {row[f.key] == null || row[f.key] === "" ? "—" : String(row[f.key])}
                  </td>
                ))}
              </tr>
            ))}
            {previewRows.length === 0 && (
              <tr>
                <td colSpan={mappedFields.length} className="px-3 py-6 text-center text-muted-foreground">
                  Aucune ligne valide.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>

      {validation.errors.length > 0 && (
        <details className="rounded-md border bg-muted/20 px-3 py-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Voir les {validation.errors.length} ligne(s) ignorée(s)
          </summary>
          <ul className="mt-2 space-y-1 max-h-32 overflow-auto">
            {validation.errors.slice(0, 50).map((err, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground tnum">L.{err.row}</span>
                <span className="text-destructive">{err.message}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={submitting}>
          <X className="w-3.5 h-3.5 mr-1" /> Modifier le mapping
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={submitting || validation.valid.length === 0}>
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Import en cours…
            </>
          ) : (
            <>Importer {validation.valid.length} ligne(s)</>
          )}
        </Button>
      </div>
    </div>
  );
};
