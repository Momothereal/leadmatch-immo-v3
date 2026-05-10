import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Building2, Search, X, Sparkles, Mail, Phone, Target, AlertTriangle, Users, ArrowLeftRight, CheckCircle2, XCircle, Lightbulb, Trash2, Filter, CheckSquare, Square } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fmtEur, fmtEurShort, FINANCING_LABEL, TIMELINE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  scoreLeadProperty, scoreBucket, CRITERIA,
  type ScoringProperty, type ScoringLead, type ScoreResult,
} from "@/lib/scoring";
import { buildMatchNarrative } from "@/lib/matchNarrative";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TYPE_LABEL: Record<string, string> = { apartment: "Appartement", house: "Maison", land: "Terrain", commercial: "Local", other: "Autre" };
const TX_LABEL: Record<string, string> = { sale: "Vente", rent: "Location" };

interface ScoredLead { lead: ScoringLead; result: ScoreResult; }
interface ScoredProperty { property: ScoringProperty; result: ScoreResult; }

type Mode = "by-property" | "by-lead";

const Matching = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [properties, setProperties] = useState<ScoringProperty[]>([]);
  const [leads, setLeads] = useState<ScoringLead[]>([]);
  const [loading, setLoading] = useState(true);
  const initialMode: Mode = params.get("leadId") ? "by-lead" : "by-property";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [pickedPropertyId, setPickedPropertyId] = useState<string | null>(params.get("propertyId"));
  const [pickedLeadId, setPickedLeadId] = useState<string | null>(params.get("leadId"));
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Inclusion/exclusion : si un set est non-vide, seuls ces ids participent au matching.
  const [includedLeadIds, setIncludedLeadIds] = useState<Set<string>>(new Set());
  const [includedPropertyIds, setIncludedPropertyIds] = useState<Set<string>>(new Set());
  const [minScore, setMinScore] = useState<number>(0);
  // Suppression
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "lead"; id: string; label: string }
    | { kind: "property"; id: string; label: string }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, l] = await Promise.all([
        supabase.from("properties")
          .select("id,title,city,postal_code,price,surface_m2,rooms,property_type,transaction_type,dpe_rating")
          .order("created_at", { ascending: false }),
        supabase.from("leads")
          .select("id,first_name,last_name,desired_city,desired_postal_code,budget_min,budget_max,desired_surface_min,desired_rooms_min,desired_property_type,desired_transaction_type,timeline,financing")
          .order("created_at", { ascending: false }),
      ]);
      if (p.data) setProperties(p.data as ScoringProperty[]);
      if (l.data) setLeads(l.data as ScoringLead[]);
      setLoading(false);
    })();
  }, []);

  const pickedProperty = properties.find(p => p.id === pickedPropertyId) ?? null;
  const pickedLead = leads.find(l => l.id === pickedLeadId) ?? null;

  const filteredProperties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(p =>
      [p.title, p.city, TYPE_LABEL[p.property_type]].filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [properties, search]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(l =>
      [l.first_name, l.last_name, l.desired_city].filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [leads, search]);

  const scoredLeads: ScoredLead[] = useMemo(() => {
    if (!pickedProperty) return [];
    const pool = includedLeadIds.size > 0
      ? leads.filter(l => includedLeadIds.has(l.id))
      : leads;
    return pool
      .map(lead => ({ lead, result: scoreLeadProperty(lead, pickedProperty) }))
      .filter(s => s.result.total >= minScore)
      .sort((a, b) => b.result.total - a.result.total);
  }, [pickedProperty, leads, includedLeadIds, minScore]);

  const scoredProperties: ScoredProperty[] = useMemo(() => {
    if (!pickedLead) return [];
    const pool = includedPropertyIds.size > 0
      ? properties.filter(p => includedPropertyIds.has(p.id))
      : properties;
    return pool
      .map(property => ({ property, result: scoreLeadProperty(pickedLead, property) }))
      .filter(s => s.result.total >= minScore)
      .sort((a, b) => b.result.total - a.result.total);
  }, [pickedLead, properties, includedPropertyIds, minScore]);

  const selected = scoredLeads.find(s => s.lead.id === selectedLeadId) ?? scoredLeads[0];
  const selectedProp = scoredProperties.find(s => s.property.id === selectedPropertyId) ?? scoredProperties[0];

  const onPickProperty = (id: string | null) => {
    setPickedPropertyId(id);
    setSelectedLeadId(null);
    if (id) setParams({ propertyId: id }, { replace: true });
    else setParams({}, { replace: true });
  };

  const onPickLead = (id: string | null) => {
    setPickedLeadId(id);
    setSelectedPropertyId(null);
    if (id) setParams({ leadId: id }, { replace: true });
    else setParams({}, { replace: true });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setSearch("");
    setParams({}, { replace: true });
    setPickedPropertyId(null);
    setPickedLeadId(null);
    setSelectedLeadId(null);
    setSelectedPropertyId(null);
    setIncludedLeadIds(new Set());
    setIncludedPropertyIds(new Set());
    setMinScore(0);
  };

  const toggleLeadInclude = (id: string) => {
    setIncludedLeadIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const togglePropertyInclude = (id: string) => {
    setIncludedPropertyIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const table = deleteTarget.kind === "lead" ? "leads" : "properties";
    const { error } = await supabase.from(table).delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("Suppression impossible : " + error.message);
      return;
    }
    toast.success(deleteTarget.kind === "lead" ? "Lead supprimé" : "Bien supprimé");
    if (deleteTarget.kind === "lead") {
      setLeads(prev => prev.filter(l => l.id !== deleteTarget.id));
      if (pickedLeadId === deleteTarget.id) onPickLead(null);
      if (selectedLeadId === deleteTarget.id) setSelectedLeadId(null);
      setIncludedLeadIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
    } else {
      setProperties(prev => prev.filter(p => p.id !== deleteTarget.id));
      if (pickedPropertyId === deleteTarget.id) onPickProperty(null);
      if (selectedPropertyId === deleteTarget.id) setSelectedPropertyId(null);
      setIncludedPropertyIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
    }
    setDeleteTarget(null);
  };

  // Enregistrement automatique d'un match consulté
  useEffect(() => {
    if (!user) return;
    let lead_id: string | undefined;
    let property_id: string | undefined;
    let score: number | undefined;
    if (mode === "by-property" && selected && pickedProperty) {
      lead_id = selected.lead.id;
      property_id = pickedProperty.id;
      score = selected.result.total;
    } else if (mode === "by-lead" && selectedProp && pickedLead) {
      lead_id = pickedLead.id;
      property_id = selectedProp.property.id;
      score = selectedProp.result.total;
    }
    if (!lead_id || !property_id || score == null) return;
    const t = setTimeout(async () => {
      await supabase.from("matches").insert({
        user_id: user.id,
        lead_id,
        property_id,
        score,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [mode, selected?.lead.id, pickedProperty?.id, selectedProp?.property.id, pickedLead?.id, user]);

  return (
    <AppLayout>
      {/* Toggle mode */}
      <div className="border-b border-line bg-card px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5" /> Matching à partir de :
        </div>
        <div className="inline-flex rounded-md border border-line overflow-hidden text-xs">
          <button
            onClick={() => switchMode("by-property")}
            className={cn(
              "px-3 h-8 inline-flex items-center gap-1.5 transition",
              mode === "by-property" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            )}
          >
            <Building2 className="w-3.5 h-3.5" /> un bien
          </button>
          <button
            onClick={() => switchMode("by-lead")}
            className={cn(
              "px-3 h-8 inline-flex items-center gap-1.5 transition border-l border-line",
              mode === "by-lead" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            )}
          >
            <Users className="w-3.5 h-3.5" /> un lead
          </button>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {mode === "by-property"
            ? "Choisissez un bien, nous classons les leads compatibles."
            : "Choisissez un lead, nous classons les biens compatibles."}
        </span>
      </div>

      {/* Picker */}
      <div className="border-b border-line bg-card px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 h-9 px-2.5 rounded-md bg-muted/60 border border-transparent focus-within:bg-card focus-within:border-line">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === "by-property" ? "Rechercher un bien…" : "Rechercher un lead…"}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
          </div>
          {(mode === "by-property" ? pickedPropertyId : pickedLeadId) && (
            <button
              onClick={() => (mode === "by-property" ? onPickProperty(null) : onPickLead(null))}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 h-9 rounded-md hover:bg-muted"
            >
              <X className="w-3 h-3" /> Désélectionner
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-xs text-muted-foreground py-2">Chargement…</div>
        ) : mode === "by-property" && properties.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Aucun bien importé. <Link to="/properties" className="font-medium underline">Importer un bien</Link>
          </div>
        ) : mode === "by-lead" && leads.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Aucun lead importé. <Link to="/leads" className="font-medium underline">Importer un lead</Link>
          </div>
        ) : mode === "by-property" ? (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {filteredProperties.map(p => {
              const active = p.id === pickedPropertyId;
              return (
                <button key={p.id} onClick={() => onPickProperty(active ? null : p.id)}
                  className={cn(
                    "shrink-0 w-[220px] text-left p-2.5 rounded-lg border transition",
                    active ? "border-primary bg-primary-soft/60 shadow-sm" : "border-line bg-card hover:border-primary/40 hover:bg-muted/40"
                  )}>
                  <div className="text-xs font-medium truncate">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {[p.city, TYPE_LABEL[p.property_type], TX_LABEL[p.transaction_type]].filter(Boolean).join(" · ")}
                  </div>
                  <div className="text-xs tnum text-primary font-medium mt-1">
                    {p.price ? fmtEurShort(p.price) : "—"}
                    {p.surface_m2 && <span className="text-muted-foreground font-normal"> · {p.surface_m2} m²</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {filteredLeads.map(l => {
              const active = l.id === pickedLeadId;
              return (
                <button key={l.id} onClick={() => onPickLead(active ? null : l.id)}
                  className={cn(
                    "shrink-0 w-[220px] text-left p-2.5 rounded-lg border transition",
                    active ? "border-primary bg-primary-soft/60 shadow-sm" : "border-line bg-card hover:border-primary/40 hover:bg-muted/40"
                  )}>
                  <div className="text-xs font-medium truncate">{l.first_name} {l.last_name}</div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {[l.desired_city, l.desired_property_type ? TYPE_LABEL[l.desired_property_type] : null].filter(Boolean).join(" · ") || "—"}
                  </div>
                  <div className="text-xs tnum text-primary font-medium mt-1">
                    {l.budget_max ? `≤ ${fmtEurShort(l.budget_max)}` : l.budget_min ? `≥ ${fmtEurShort(l.budget_min)}` : "—"}
                    {l.desired_surface_min && <span className="text-muted-foreground font-normal"> · {l.desired_surface_min} m²+</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body — Mode Par bien */}
      {mode === "by-property" && !pickedProperty ? (
        <div className="p-12 text-center text-muted-foreground">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <div className="text-sm">Sélectionnez un bien ci-dessus pour lancer le matching.</div>
        </div>
      ) : mode === "by-property" && pickedProperty && leads.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <div className="text-sm">Aucun lead pour comparer. <Link to="/leads" className="text-primary underline">Importer des leads →</Link></div>
        </div>
      ) : mode === "by-property" && pickedProperty ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] lg:min-h-0 lg:h-[calc(100vh-7.5rem-4.5rem)]">
          {/* Liste des leads scorés */}
          <div className="lg:overflow-y-auto p-3 space-y-1.5">
            <FilterBar
              total={leads.length}
              shown={scoredLeads.length}
              includedCount={includedLeadIds.size}
              minScore={minScore}
              onMinScore={setMinScore}
              onSelectAll={() => setIncludedLeadIds(new Set(leads.map(l => l.id)))}
              onClear={() => setIncludedLeadIds(new Set())}
              label={`leads compatibles avec « ${pickedProperty.title} »`}
            />
            {scoredLeads.map(({ lead, result }) => {
              const b = scoreBucket(result.total);
              const active = lead.id === (selected?.lead.id ?? "");
              const included = includedLeadIds.size === 0 || includedLeadIds.has(lead.id);
              return (
                <div key={lead.id}
                  className={cn(
                    "group w-full p-3 rounded-lg border transition flex items-center gap-3",
                    active ? "border-primary bg-primary-soft/60 shadow-sm" : "border-line bg-card hover:bg-muted/40"
                  )}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLeadInclude(lead.id); }}
                    className="shrink-0 w-5 h-5 rounded border border-line flex items-center justify-center hover:border-primary"
                    title="Inclure / Exclure du matching"
                  >
                    {included
                      ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      : <Square className="w-3.5 h-3.5 text-muted-foreground/40" />}
                  </button>
                  <button
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-semibold tnum text-sm shrink-0", `score-bg-s${b}`)}>
                      {result.total}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{lead.first_name} {lead.last_name}</div>
                      <div className="text-xs text-muted-foreground truncate flex flex-wrap gap-x-2">
                        {lead.desired_city && <span>{lead.desired_city}</span>}
                        {(lead.budget_min || lead.budget_max) && (
                          <span>· {lead.budget_min ? fmtEurShort(lead.budget_min) : "0"}–{lead.budget_max ? fmtEurShort(lead.budget_max) : "∞"}</span>
                        )}
                        {lead.timeline && <span>· {TIMELINE_LABEL[lead.timeline] ?? lead.timeline}</span>}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ kind: "lead", id: lead.id, label: `${lead.first_name} ${lead.last_name}` }); }}
                    className="shrink-0 w-7 h-7 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    title="Supprimer ce lead"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {scoredLeads.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-8">
                Aucun lead ne correspond aux filtres actuels.
              </div>
            )}
          </div>

          {/* Detail panel */}
          <aside className="flex lg:border-l border-t lg:border-t-0 border-line bg-card lg:overflow-hidden flex-col">
            {selected && <LeadDetail picked={pickedProperty} scored={selected} />}
          </aside>
        </div>
      ) : mode === "by-lead" && !pickedLead ? (
        <div className="p-12 text-center text-muted-foreground">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <div className="text-sm">Sélectionnez un lead ci-dessus pour voir les biens compatibles.</div>
        </div>
      ) : mode === "by-lead" && pickedLead && properties.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <div className="text-sm">Aucun bien pour comparer. <Link to="/properties" className="text-primary underline">Importer des biens →</Link></div>
        </div>
      ) : mode === "by-lead" && pickedLead ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] lg:min-h-0 lg:h-[calc(100vh-7.5rem-4.5rem)]">
          <div className="lg:overflow-y-auto p-3 space-y-1.5">
            <FilterBar
              total={properties.length}
              shown={scoredProperties.length}
              includedCount={includedPropertyIds.size}
              minScore={minScore}
              onMinScore={setMinScore}
              onSelectAll={() => setIncludedPropertyIds(new Set(properties.map(p => p.id)))}
              onClear={() => setIncludedPropertyIds(new Set())}
              label={`biens compatibles avec « ${pickedLead.first_name} ${pickedLead.last_name} »`}
            />
            {scoredProperties.map(({ property, result }) => {
              const b = scoreBucket(result.total);
              const active = property.id === (selectedProp?.property.id ?? "");
              const included = includedPropertyIds.size === 0 || includedPropertyIds.has(property.id);
              return (
                <div key={property.id}
                  className={cn(
                    "group w-full p-3 rounded-lg border transition flex items-center gap-3",
                    active ? "border-primary bg-primary-soft/60 shadow-sm" : "border-line bg-card hover:bg-muted/40"
                  )}>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePropertyInclude(property.id); }}
                    className="shrink-0 w-5 h-5 rounded border border-line flex items-center justify-center hover:border-primary"
                    title="Inclure / Exclure du matching"
                  >
                    {included
                      ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      : <Square className="w-3.5 h-3.5 text-muted-foreground/40" />}
                  </button>
                  <button
                    onClick={() => setSelectedPropertyId(property.id)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-semibold tnum text-sm shrink-0", `score-bg-s${b}`)}>
                      {result.total}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{property.title}</div>
                      <div className="text-xs text-muted-foreground truncate flex flex-wrap gap-x-2">
                        {property.city && <span>{property.city}</span>}
                        {property.price && <span>· {fmtEurShort(property.price)}</span>}
                        {property.surface_m2 && <span>· {property.surface_m2} m²</span>}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ kind: "property", id: property.id, label: property.title }); }}
                    className="shrink-0 w-7 h-7 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    title="Supprimer ce bien"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {scoredProperties.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-8">
                Aucun bien ne correspond aux filtres actuels.
              </div>
            )}
          </div>

          <aside className="flex lg:border-l border-t lg:border-t-0 border-line bg-card lg:overflow-hidden flex-col">
            {selectedProp && <PropertyDetailPanel lead={pickedLead} scored={selectedProp} />}
          </aside>
        </div>
      ) : (
        <div className="p-12" />
      )}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {deleteTarget?.kind === "lead" ? "ce lead" : "ce bien"} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.label} sera retiré définitivement, ainsi que les matchings associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

const FilterBar = ({
  total, shown, includedCount, minScore, onMinScore, onSelectAll, onClear, label,
}: {
  total: number; shown: number; includedCount: number; minScore: number;
  onMinScore: (n: number) => void; onSelectAll: () => void; onClear: () => void; label: string;
}) => (
  <div className="px-1.5 pb-1 space-y-2">
    <div className="text-xs text-muted-foreground">
      {shown} {label}
      {includedCount > 0 && <span> · {includedCount} sélectionné{includedCount > 1 ? "s" : ""}</span>}
    </div>
    <div className="flex items-center gap-2 flex-wrap text-[11px]">
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Filter className="w-3 h-3" /> Score min :
      </span>
      {[0, 50, 70, 80].map(v => (
        <button
          key={v}
          onClick={() => onMinScore(v)}
          className={cn(
            "h-6 px-2 rounded-md border transition tnum",
            minScore === v ? "bg-primary text-primary-foreground border-primary" : "border-line bg-card hover:bg-muted"
          )}
        >
          {v === 0 ? "Tous" : `≥ ${v}`}
        </button>
      ))}
      <span className="mx-1 text-muted-foreground/40">|</span>
      <button
        onClick={onSelectAll}
        className="h-6 px-2 rounded-md border border-line bg-card hover:bg-muted inline-flex items-center gap-1"
      >
        <CheckSquare className="w-3 h-3" /> Tout inclure ({total})
      </button>
      {includedCount > 0 && (
        <button
          onClick={onClear}
          className="h-6 px-2 rounded-md border border-line bg-card hover:bg-muted inline-flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Effacer sélection
        </button>
      )}
    </div>
  </div>
);

const PropertyDetailPanel = ({ lead, scored }: { lead: ScoringLead; scored: ScoredProperty }) => {
  const { property, result } = scored;
  const b = scoreBucket(result.total);
  const narrative = buildMatchNarrative(lead, property, result);
  return (
    <div className="flex flex-col lg:h-full lg:overflow-y-auto">
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{property.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {[property.city, TYPE_LABEL[property.property_type]].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>

        <div className={cn("flex items-center gap-4 p-4 rounded-xl border border-current/15", `score-bg-s${b}`)}>
          <div className={cn("tnum text-4xl font-medium leading-none", `score-text-s${b}`)}>
            {result.total}<span className="text-base opacity-60">/100</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-70 font-medium">Compatibilité</div>
            <div className={cn("text-sm font-medium mt-0.5", `score-text-s${b}`)}>
              {b >= 5 ? "Excellente" : b === 4 ? "Bonne" : b === 3 ? "Moyenne" : b === 2 ? "Faible" : "Incompatible"}
            </div>
          </div>
        </div>

        <NarrativeBlock narrative={narrative} />

        <div>
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Critères pondérés</h3>
          <div className="space-y-2.5">
            {CRITERIA.map(c => {
              const s = result.scores[c.key];
              const cb = scoreBucket(s);
              return (
                <div key={c.key}>
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="text-xs">{c.label}<span className="ml-1.5 text-[10px] text-muted-foreground tnum">{c.weight}%</span></div>
                    <div className={cn("text-xs tnum font-medium", `score-text-s${cb}`)}>{s}/100</div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", `score-fill-s${cb}`)} style={{ width: `${s}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Caractéristiques du bien</h3>
          <dl className="rounded-lg border border-line divide-y divide-line bg-card overflow-hidden text-xs">
            <Row label="Prix" value={property.price ? fmtEur(property.price) : "—"} />
            <Row label="Surface" value={property.surface_m2 ? `${property.surface_m2} m²` : "—"} />
            <Row label="Pièces" value={property.rooms ? String(property.rooms) : "—"} />
            <Row label="Ville" value={property.city ?? "—"} />
            <Row label="Transaction" value={TX_LABEL[property.transaction_type] ?? "—"} />
            <Row label="DPE" value={property.dpe_rating ?? "—"} />
          </dl>
        </div>
      </div>
    </div>
  );
};

const LeadDetail = ({ picked, scored }: { picked: ScoringProperty; scored: ScoredLead }) => {
  const { lead, result } = scored;
  const b = scoreBucket(result.total);
  const narrative = buildMatchNarrative(lead, picked, result);
  const sendEmail = () => {
    toast.success(`Email préparé pour ${lead.first_name} sur « ${picked.title} »`);
  };
  return (
    <div className="flex flex-col lg:h-full lg:overflow-y-auto">
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            {(lead.first_name[0] ?? "").toUpperCase()}{(lead.last_name[0] ?? "").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{lead.first_name} {lead.last_name}</div>
            <div className="text-xs text-muted-foreground truncate">{lead.desired_city ?? "—"}</div>
          </div>
        </div>

        <div className={cn("flex items-center gap-4 p-4 rounded-xl border border-current/15", `score-bg-s${b}`)}>
          <div className={cn("tnum text-4xl font-medium leading-none", `score-text-s${b}`)}>{result.total}<span className="text-base opacity-60">/100</span></div>
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-70 font-medium">Compatibilité</div>
            <div className={cn("text-sm font-medium mt-0.5", `score-text-s${b}`)}>
              {b >= 5 ? "Excellente" : b === 4 ? "Bonne" : b === 3 ? "Moyenne" : b === 2 ? "Faible" : "Incompatible"}
            </div>
          </div>
        </div>

        <NarrativeBlock narrative={narrative} />

        <div>
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Critères pondérés</h3>
          <div className="space-y-2.5">
            {CRITERIA.map(c => {
              const s = result.scores[c.key];
              const cb = scoreBucket(s);
              return (
                <div key={c.key}>
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="text-xs">{c.label}<span className="ml-1.5 text-[10px] text-muted-foreground tnum">{c.weight}%</span></div>
                    <div className={cn("text-xs tnum font-medium", `score-text-s${cb}`)}>{s}/100</div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", `score-fill-s${cb}`)} style={{ width: `${s}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Profil du lead</h3>
          <dl className="rounded-lg border border-line divide-y divide-line bg-card overflow-hidden text-xs">
            <Row label="Budget" value={`${lead.budget_min ? fmtEur(lead.budget_min) : "—"} – ${lead.budget_max ? fmtEur(lead.budget_max) : "—"}`} />
            <Row label="Type" value={lead.desired_property_type ? TYPE_LABEL[lead.desired_property_type] : "—"} />
            <Row label="Surface min" value={lead.desired_surface_min ? `${lead.desired_surface_min} m²` : "—"} />
            <Row label="Pièces min" value={lead.desired_rooms_min ? String(lead.desired_rooms_min) : "—"} />
            <Row label="Timeline" value={lead.timeline ? TIMELINE_LABEL[lead.timeline] : "—"} />
            <Row label="Financement" value={lead.financing ? FINANCING_LABEL[lead.financing] : "—"} />
          </dl>
        </div>
      </div>

      <div className="mt-auto sticky bottom-0 bg-card/95 backdrop-blur border-t border-line p-3 flex gap-2">
        <button className="flex-1 h-9 rounded-md border border-line text-xs font-medium hover:bg-muted inline-flex items-center justify-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> Appeler
        </button>
        <button onClick={sendEmail} className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-dark inline-flex items-center justify-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> Email
        </button>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[100px_1fr] gap-3 px-3 py-2">
    <dt className="text-[11px] text-muted-foreground">{label}</dt>
    <dd className="text-xs">{value}</dd>
  </div>
);

const NarrativeBlock = ({
  narrative,
}: {
  narrative: ReturnType<typeof buildMatchNarrative>;
}) => (
  <div className="space-y-3">
    {/* Headline + summary = vue d'ensemble */}
    <div className="rounded-lg bg-primary-soft border border-primary/15 p-3.5 text-xs leading-relaxed">
      <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary uppercase mb-1.5">
        <Sparkles className="w-2.5 h-2.5" /> Analyse personnalisée
      </div>
      <div className="font-semibold text-foreground mb-1.5 text-[12.5px] leading-snug">
        {narrative.headline}
      </div>
      <p className="text-foreground/80">{narrative.summary}</p>
    </div>

    {/* Pourquoi ça correspond */}
    {narrative.fit.length > 0 && (
      <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 p-3">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 uppercase mb-1.5">
          <CheckCircle2 className="w-3 h-3" /> Pourquoi ça correspond
        </div>
        <ul className="space-y-1 text-xs text-emerald-950/90">
          {narrative.fit.map((f, i) => (
            <li key={i} className="flex gap-1.5 leading-relaxed">
              <span className="text-emerald-600 shrink-0">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Pourquoi ça ne correspond pas */}
    {narrative.risks.length > 0 && (
      <div className="rounded-lg border border-rose-200/60 bg-rose-50/50 p-3">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-rose-800 uppercase mb-1.5">
          <XCircle className="w-3 h-3" /> Points de friction
        </div>
        <ul className="space-y-1 text-xs text-rose-950/90">
          {narrative.risks.map((r, i) => (
            <li key={i} className="flex gap-1.5 leading-relaxed">
              <span className="text-rose-600 shrink-0">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Recommandation */}
    <div className="rounded-lg border border-amber-200/70 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-950">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 uppercase mb-1">
        <Lightbulb className="w-3 h-3" /> Recommandation
      </div>
      {narrative.recommendation}
    </div>
  </div>
);

export default Matching;
