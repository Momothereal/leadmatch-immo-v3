import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Upload, AlertTriangle, Mail, Phone, Trash2, X, CheckSquare, Square, Zap, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ImportDialog } from "@/components/leadmatch/import/ImportDialog";
import { supabase } from "@/integrations/supabase/client";
import { fmtEurShort } from "@/lib/format";
import { toast } from "sonner";
import { useSubscription, STANDARD_LEAD_LIMIT } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Lead {
  id: string; first_name: string; last_name: string;
  desired_city: string | null; budget_min: number | null; budget_max: number | null;
  email: string | null; phone: string | null;
  desired_property_type: string | null;
}
const TYPE_LABEL: Record<string, string> = { apartment: "Appartement", house: "Maison", land: "Terrain", commercial: "Local", other: "Autre" };

const Leads = () => {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isStandard, isPro } = useSubscription();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("leads")
        .select("id,first_name,last_name,desired_city,budget_min,budget_max,email,phone,desired_property_type")
        .order("created_at", { ascending: false });
      if (data) setItems(data as Lead[]);
      setLoading(false);
      setSelected(new Set());
    })();
  }, [importOpen]);

  const filtered = items.filter(l => {
    if (!q) return true;
    const s = q.toLowerCase();
    return `${l.first_name} ${l.last_name}`.toLowerCase().includes(s)
      || (l.desired_city ?? "").toLowerCase().includes(s)
      || (l.email ?? "").toLowerCase().includes(s);
  });

  const toggle = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const allVisibleSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id));
  const toggleAllVisible = () => {
    setSelected(prev => {
      if (allVisibleSelected) {
        const n = new Set(prev);
        filtered.forEach(l => n.delete(l.id));
        return n;
      }
      const n = new Set(prev);
      filtered.forEach(l => n.add(l.id));
      return n;
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from("leads").delete().in("id", ids);
    setDeleting(false);
    setConfirmOpen(false);
    if (error) {
      toast.error("Échec de la suppression : " + error.message);
      return;
    }
    toast.success(`${ids.length} lead${ids.length > 1 ? "s supprimés" : " supprimé"}`);
    setItems(prev => prev.filter(l => !selected.has(l.id)));
    setSelected(new Set());
  };

  return (
    <AppLayout actions={
      <button onClick={() => setImportOpen(true)} className="text-xs h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-1.5 font-medium">
        <Upload className="w-3.5 h-3.5" /> Importer
      </button>
    }>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">Mes leads</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground tnum">{items.length}</span>
        </div>

        {/* Upsell Standard → Pro */}
        {isStandard && items.length >= STANDARD_LEAD_LIMIT && (
          <div className="rounded-xl bg-gradient-to-r from-[#0F2D52] to-[#1E4D8C] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C8A96E]/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#C8A96E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Limite Standard atteinte ({STANDARD_LEAD_LIMIT} leads)</p>
                <p className="text-xs text-white/70">Passez Pro pour des leads illimités, un scoring illimité et la gestion d'équipe.</p>
              </div>
            </div>
            <Link to="/pricing" className="shrink-0">
              <button className="h-8 px-4 rounded-lg bg-[#C8A96E] hover:bg-[#b8995c] text-[#0F2D52] text-xs font-semibold inline-flex items-center gap-1 transition">
                Passer Pro <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        )}

        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Importez vos leads via le bouton <strong>Importer</strong> pour les voir apparaître ici.</span>
        </div>

        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom, ville ou email…"
          className="w-full h-9 px-3 rounded-md border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted/40 border border-line">
            <button
              onClick={toggleAllVisible}
              className="text-xs inline-flex items-center gap-1.5 text-foreground hover:text-primary"
            >
              {allVisibleSelected
                ? <CheckSquare className="w-3.5 h-3.5" />
                : <Square className="w-3.5 h-3.5" />}
              {allVisibleSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-xs h-7 px-2 rounded-md hover:bg-muted inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Annuler
                  </button>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="text-xs h-7 px-2.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center gap-1.5 font-medium"
                  >
                    <Trash2 className="w-3 h-3" /> Supprimer
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-line rounded-lg py-16 text-center space-y-3">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <div className="text-sm text-muted-foreground">Aucun lead pour l'instant.</div>
            <button onClick={() => setImportOpen(true)} className="text-xs h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-1.5">
              <Upload className="w-3 h-3" /> Importer vos premiers leads
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-lg bg-card">
            {filtered.map((l) => {
              const isSel = selected.has(l.id);
              return (
                <li key={l.id} className={cn("flex items-center gap-3 p-3 hover:bg-muted/40", isSel && "bg-primary-soft/40")}>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(l.id); }}
                    className="shrink-0 w-4 h-4 rounded border border-line flex items-center justify-center hover:border-primary"
                    aria-label="Sélectionner"
                  >
                    {isSel
                      ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      : <Square className="w-3.5 h-3.5 text-muted-foreground/40" />}
                  </button>
                  <Link to={`/leads/${l.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-muted text-foreground/70 flex items-center justify-center text-xs font-semibold shrink-0">
                      {(l.first_name[0] ?? "").toUpperCase()}{(l.last_name[0] ?? "").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{l.first_name} {l.last_name}</div>
                      <div className="text-xs text-muted-foreground truncate flex flex-wrap gap-x-2">
                        {l.desired_city && <span>{l.desired_city}</span>}
                        {l.desired_property_type && <span>· {TYPE_LABEL[l.desired_property_type] ?? l.desired_property_type}</span>}
                        {l.email && <span className="inline-flex items-center gap-0.5"><Mail className="w-3 h-3" />{l.email}</span>}
                        {l.phone && <span className="inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{l.phone}</span>}
                      </div>
                    </div>
                    <div className="text-xs tnum text-muted-foreground shrink-0">
                      {l.budget_max ? `≤ ${fmtEurShort(l.budget_max)}` : l.budget_min ? `≥ ${fmtEurShort(l.budget_min)}` : "—"}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} defaultKind="leads" />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selected.size} lead{selected.size > 1 ? "s" : ""} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Les leads sélectionnés ainsi que leurs historiques de matching associés seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
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
export default Leads;
