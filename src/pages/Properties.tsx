import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2, Upload, Plus, Search, X, Star, MapPin, Maximize2, LayoutGrid,
  BedDouble, Users, History, Zap, Pencil, Copy, MoreHorizontal, Trash2,
  Archive, Eye, ArrowUpDown, ChevronDown, Check, SlidersHorizontal, List,
  CheckCircle2, Clock, Key, XCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ImportDialog } from "@/components/leadmatch/import/ImportDialog";
import { supabase } from "@/integrations/supabase/client";
import { fmtEur, fmtEurShort } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent,
} from "@/components/ui/sheet";

/* ───────────────────── Types & helpers ───────────────────── */

type Statut = "disponible" | "sous-compromis" | "vendu" | "retire";

interface PropertyRow {
  id: string;
  title: string;
  city: string | null;
  postal_code: string | null;
  neighborhood: string | null;
  price: number | null;
  property_type: string;
  transaction_type: string;
  surface_m2: number | null;
  rooms: number | null;
  bedrooms: number | null;
  description: string | null;
  dpe_rating: string | null;
  features: any;
  created_at: string;
  updated_at: string;
}

interface BienVM extends PropertyRow {
  statut: Statut;
  isFavorite: boolean;
  tags: string[];
  leadsCompatibles: number;
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement", house: "Maison", land: "Terrain",
  commercial: "Local commercial", other: "Autre",
};
const TX_LABELS: Record<string, string> = { sale: "Vente", rent: "Location" };

const STATUT_META: Record<Statut, { label: string; bg: string; fg: string; ring: string }> = {
  "disponible":     { label: "Disponible",     bg: "bg-emerald-100", fg: "text-emerald-700", ring: "ring-emerald-300" },
  "sous-compromis": { label: "Sous compromis", bg: "bg-amber-100",   fg: "text-amber-700",   ring: "ring-amber-300" },
  "vendu":          { label: "Vendu",          bg: "bg-slate-100",   fg: "text-slate-600",   ring: "ring-slate-300" },
  "retire":         { label: "Retiré",         bg: "bg-rose-100",    fg: "text-rose-700",    ring: "ring-rose-300" },
};
const STATUT_DOT: Record<Statut, string> = {
  "disponible": "bg-emerald-500",
  "sous-compromis": "bg-amber-500",
  "vendu": "bg-slate-400",
  "retire": "bg-rose-500",
};

const SORT_LABELS: Record<string, string> = {
  "date-desc": "Date d'ajout",
  "prix-asc": "Prix croissant",
  "prix-desc": "Prix décroissant",
  "surface-desc": "Surface",
  "leads-desc": "Leads compatibles",
  "activity-desc": "Dernière activité",
};

/* ───────── localStorage persistence (statut/favori) ───────── */

const KEY_FAV = "lmi_prop_fav_v1";
const KEY_STATUT = "lmi_prop_statut_v1";

function loadMap<V>(key: string): Record<string, V> {
  try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; }
}
function saveMap<V>(key: string, map: Record<string, V>) {
  localStorage.setItem(key, JSON.stringify(map));
}

/* ───────────────────── Component ───────────────────── */

const Properties = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [favMap, setFavMap] = useState<Record<string, boolean>>(() => loadMap<boolean>(KEY_FAV));
  const [statutMap, setStatutMap] = useState<Record<string, Statut>>(() => loadMap<Statut>(KEY_STATUT));
  const [leadsCount, setLeadsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // UI state
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<"tous" | Statut>("tous");
  const [sortKey, setSortKey] = useState<string>("date-desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    types: [] as string[],
    transaction: "tous" as "tous" | "sale" | "rent",
    prixMin: 0, prixMax: 5_000_000,
    surfaceMin: 0, surfaceMax: 1000,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [importKind, setImportKind] = useState<"properties" | "leads">("properties");
  const [confirm, setConfirm] = useState<{ kind: "delete" | "archive"; ids: string[]; title: string; msg: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;
  const [detailId, setDetailId] = useState<string | null>(null);

  /* Load properties */
  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("id,title,city,postal_code,neighborhood,price,property_type,transaction_type,surface_m2,rooms,bedrooms,description,dpe_rating,features,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (data) setRows(data as PropertyRow[]);
    setLoading(false);
    setSelected(new Set());
  };
  useEffect(() => { reload(); }, []);
  useEffect(() => { if (!importOpen) reload(); /* refresh after import */ }, [importOpen]);

  /* Load leads-compatible counts (best-effort: by city + property_type) */
  useEffect(() => {
    (async () => {
      if (rows.length === 0) return;
      const map: Record<string, number> = {};
      // Single query: get all leads then count per property in JS (RLS-scoped)
      const { data } = await supabase
        .from("leads")
        .select("desired_city,desired_property_type,budget_min,budget_max,desired_surface_min");
      const leads = data ?? [];
      for (const p of rows) {
        let c = 0;
        for (const l of leads) {
          const cityOk = !l.desired_city || !p.city
            ? true
            : l.desired_city.toLowerCase().split(" ")[0] === p.city.toLowerCase().split(" ")[0];
          const typeOk = !l.desired_property_type || l.desired_property_type === p.property_type;
          const priceOk = (!l.budget_max || (p.price ?? 0) <= Number(l.budget_max) * 1.1);
          const surfOk = (!l.desired_surface_min || (p.surface_m2 ?? 0) >= Number(l.desired_surface_min) * 0.9);
          if (cityOk && typeOk && priceOk && surfOk) c++;
        }
        map[p.id] = c;
      }
      setLeadsCount(map);
    })();
  }, [rows]);

  /* Build view models */
  const biens: BienVM[] = useMemo(() => rows.map(p => ({
    ...p,
    statut: statutMap[p.id] ?? "disponible",
    isFavorite: !!favMap[p.id],
    tags: Array.isArray(p.features?.tags) ? (p.features.tags as string[]) : [],
    leadsCompatibles: leadsCount[p.id] ?? 0,
  })), [rows, statutMap, favMap, leadsCount]);

  const filtered = useMemo(() => {
    let r = biens.slice();
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(b =>
        b.title.toLowerCase().includes(s) ||
        (b.city ?? "").toLowerCase().includes(s) ||
        (TYPE_LABELS[b.property_type] ?? "").toLowerCase().includes(s)
      );
    }
    if (statut !== "tous") r = r.filter(b => b.statut === statut);
    if (filters.types.length) r = r.filter(b => filters.types.includes(b.property_type));
    if (filters.transaction !== "tous") r = r.filter(b => b.transaction_type === filters.transaction);
    r = r.filter(b => (b.price ?? 0) >= filters.prixMin && (b.price ?? 0) <= filters.prixMax);
    r = r.filter(b => (b.surface_m2 ?? 0) >= filters.surfaceMin && (b.surface_m2 ?? 0) <= filters.surfaceMax);
    const sorters: Record<string, (a: BienVM, b: BienVM) => number> = {
      "prix-asc":      (a, b) => (a.price ?? 0) - (b.price ?? 0),
      "prix-desc":     (a, b) => (b.price ?? 0) - (a.price ?? 0),
      "surface-desc":  (a, b) => (b.surface_m2 ?? 0) - (a.surface_m2 ?? 0),
      "leads-desc":    (a, b) => b.leadsCompatibles - a.leadsCompatibles,
      "date-desc":     (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      "activity-desc": (a, b) => +new Date(b.updated_at) - +new Date(a.updated_at),
    };
    r.sort(sorters[sortKey] ?? sorters["date-desc"]);
    return r;
  }, [biens, search, statut, filters, sortKey]);

  const favoris = filtered.filter(b => b.isFavorite);
  const main = filtered.filter(b => !b.isFavorite);
  const totalPages = Math.max(1, Math.ceil(main.length / PER_PAGE));
  const paged = main.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  useEffect(() => { setPage(1); }, [search, statut, filters, sortKey]);

  const activeFilterCount =
    (filters.types.length ? 1 : 0) +
    (filters.transaction !== "tous" ? 1 : 0) +
    (filters.prixMin > 0 || filters.prixMax < 5_000_000 ? 1 : 0) +
    (filters.surfaceMin > 0 || filters.surfaceMax < 1000 ? 1 : 0);

  const detailBien = detailId ? biens.find(b => b.id === detailId) ?? null : null;

  /* ───────── Actions ───────── */

  const toggleFav = (id: string) => {
    setFavMap(prev => {
      const n = { ...prev, [id]: !prev[id] };
      if (!n[id]) delete n[id];
      saveMap(KEY_FAV, n);
      return n;
    });
    toast.success(favMap[id] ? "Retiré des favoris" : "Ajouté aux favoris");
  };

  const changeStatut = (id: string, s: Statut) => {
    setStatutMap(prev => {
      const n = { ...prev, [id]: s };
      saveMap(KEY_STATUT, n);
      return n;
    });
    toast.success(`Statut : ${STATUT_META[s].label}`);
  };

  const duplicate = async (b: BienVM) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase.from("properties").insert({
      user_id: u.user.id,
      title: `${b.title} (copie)`,
      city: b.city, postal_code: b.postal_code, neighborhood: b.neighborhood,
      price: b.price, property_type: b.property_type as any, transaction_type: b.transaction_type as any,
      surface_m2: b.surface_m2, rooms: b.rooms, bedrooms: b.bedrooms,
      description: b.description, dpe_rating: b.dpe_rating, features: b.features,
    }).select().single();
    if (error) { toast.error("Échec : " + error.message); return; }
    if (data) setRows(rs => [data as PropertyRow, ...rs]);
    toast.success("Bien dupliqué");
  };

  const askDelete = (ids: string[]) => setConfirm({
    kind: "delete", ids,
    title: ids.length > 1 ? `Supprimer ${ids.length} biens ?` : "Supprimer ce bien ?",
    msg: "Cette action est définitive. Les biens et leurs historiques de matching seront supprimés.",
  });
  const askArchive = (ids: string[]) => setConfirm({
    kind: "archive", ids,
    title: ids.length > 1 ? `Archiver ${ids.length} biens ?` : "Archiver ce bien ?",
    msg: "Le statut sera mis à « Retiré ». Vous pourrez le réactiver à tout moment.",
  });

  const doConfirm = async () => {
    if (!confirm) return;
    if (confirm.kind === "delete") {
      setDeleting(true);
      const { error } = await supabase.from("properties").delete().in("id", confirm.ids);
      setDeleting(false);
      if (error) { toast.error("Échec : " + error.message); return; }
      setRows(rs => rs.filter(r => !confirm.ids.includes(r.id)));
      toast.success(`${confirm.ids.length} bien${confirm.ids.length > 1 ? "s supprimés" : " supprimé"}`);
    } else {
      setStatutMap(prev => {
        const n = { ...prev };
        confirm.ids.forEach(id => { n[id] = "retire"; });
        saveMap(KEY_STATUT, n);
        return n;
      });
      toast.success(`${confirm.ids.length} bien${confirm.ids.length > 1 ? "s archivés" : " archivé"}`);
    }
    setSelected(new Set());
    setDetailId(null);
    setConfirm(null);
  };

  const launchMatching = (b: BienVM) => navigate(`/matching?propertyId=${b.id}`);
  const showLeads = (b: BienVM) => navigate(`/leads?propertyId=${b.id}`);
  const editBien = (_b: BienVM) => {
    setImportKind("properties");
    setImportOpen(true);
    toast.info("Édition rapide via le formulaire manuel.");
  };

  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const openImport = () => { setImportKind("properties"); setImportOpen(true); };

  const stats = {
    total: biens.length,
    dispo: biens.filter(b => b.statut === "disponible").length,
    compromis: biens.filter(b => b.statut === "sous-compromis").length,
    favoris: biens.filter(b => b.isFavorite).length,
    leadsTotal: biens.reduce((s, b) => s + b.leadsCompatibles, 0),
  };

  const noBiens = biens.length === 0;
  const noResults = !noBiens && filtered.length === 0;

  /* ───────── Render ───────── */

  return (
    <AppLayout
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={openImport}
            className="text-xs h-8 px-3 rounded-md border border-line bg-card hover:bg-muted inline-flex items-center gap-1.5 font-medium"
          >
            <Upload className="w-3.5 h-3.5" /> Importer
          </button>
          <button
            onClick={openImport}
            className="text-xs h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-1.5 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter un bien
          </button>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-card border-b border-line px-4 py-2.5 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute top-2.5 left-2.5 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Titre, ville, type…"
            className="w-56 h-8 pl-7 pr-7 text-xs rounded-md bg-background border border-line focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full hover:bg-muted flex items-center justify-center">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Statut chips */}
        <div className="flex gap-1">
          {([
            { k: "tous" as const, l: "Tous" },
            { k: "disponible" as const, l: "Disponible" },
            { k: "sous-compromis" as const, l: "Compromis" },
            { k: "vendu" as const, l: "Vendu" },
            { k: "retire" as const, l: "Retiré" },
          ]).map(c => (
            <button
              key={c.k}
              onClick={() => setStatut(c.k)}
              className={cn(
                "h-7 px-2.5 rounded-full text-[11px] font-medium transition",
                statut === c.k
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {c.l}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="relative">
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="h-8 px-2.5 rounded-md border border-line bg-background text-xs text-muted-foreground hover:bg-muted inline-flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          {filtersOpen && (
            <FiltersPanel
              filters={filters}
              setFilters={setFilters}
              onClose={() => setFiltersOpen(false)}
              count={filtered.length}
            />
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(o => !o)}
            className="h-8 px-2.5 rounded-md border border-line bg-background text-xs text-muted-foreground hover:bg-muted inline-flex items-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5" /> {SORT_LABELS[sortKey]}
            <ChevronDown className="w-3 h-3" />
          </button>
          {sortOpen && (
            <div className="absolute top-9 left-0 w-52 bg-card border border-line rounded-lg shadow-lg py-1 z-50">
              {Object.entries(SORT_LABELS).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => { setSortKey(k); setSortOpen(false); }}
                  className="w-full h-8 px-3 flex items-center gap-2 text-xs hover:bg-muted text-left"
                >
                  <span className="w-3.5">{sortKey === k && <Check className="w-3 h-3 text-primary" />}</span>
                  <span className={sortKey === k ? "text-primary font-medium" : ""}>{l}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex p-0.5 rounded-md bg-muted">
            <button
              onClick={() => setView("grid")}
              className={cn("w-7 h-7 rounded flex items-center justify-center", view === "grid" && "bg-card shadow-sm")}
              aria-label="Vue grille"
            >
              <LayoutGrid className={cn("w-3.5 h-3.5", view === "grid" ? "text-foreground" : "text-muted-foreground")} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("w-7 h-7 rounded flex items-center justify-center", view === "list" && "bg-card shadow-sm")}
              aria-label="Vue liste"
            >
              <List className={cn("w-3.5 h-3.5", view === "list" ? "text-foreground" : "text-muted-foreground")} />
            </button>
          </div>
        </div>
      </div>

      {/* Header + KPIs */}
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Mes biens</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.total} biens · {stats.dispo} disponibles · {stats.leadsTotal} leads compatibles au total
            </p>
          </div>
          <div className="flex gap-2">
            <KpiTile label="Disponibles" value={stats.dispo} tone="text-emerald-600" />
            <KpiTile label="Sous compromis" value={stats.compromis} tone="text-amber-600" />
            <KpiTile label="Favoris" value={stats.favoris} tone="text-amber-700" iconLeft={<Star className="w-3 h-3" />} />
          </div>
        </div>

        {/* Empty states */}
        {loading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">Chargement…</div>
        ) : noBiens ? (
          <div className="border border-dashed border-line rounded-lg py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div className="text-sm font-semibold">Aucun bien dans votre portefeuille</div>
            <div className="text-xs text-muted-foreground">Importez vos biens ou ajoutez-les manuellement pour commencer.</div>
            <div className="flex gap-2 justify-center pt-2">
              <button onClick={openImport} className="h-9 px-4 rounded-md border border-line bg-card text-sm inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Importer des biens
              </button>
              <button onClick={openImport} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Ajouter un bien
              </button>
            </div>
          </div>
        ) : noResults ? (
          <div className="border border-dashed border-line rounded-lg py-16 text-center space-y-2">
            <div className="text-sm font-semibold">Aucun bien ne correspond à vos filtres</div>
            <button
              onClick={() => {
                setSearch(""); setStatut("tous");
                setFilters({ types: [], transaction: "tous", prixMin: 0, prixMax: 5_000_000, surfaceMin: 0, surfaceMax: 1000 });
              }}
              className="h-8 px-3 rounded-md bg-muted text-xs text-foreground hover:bg-muted/80"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            {/* Favoris */}
            {favoris.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="text-sm font-semibold">Mes biens favoris</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">{favoris.length}</span>
                </div>
                {view === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {favoris.map(b => (
                      <BienCard
                        key={b.id} bien={b}
                        selected={selected.has(b.id)}
                        anySelection={selected.size > 0}
                        onToggleSelect={toggleSelect}
                        onOpenDetail={(x) => setDetailId(x.id)}
                        onToggleFav={toggleFav}
                        onChangeStatut={changeStatut}
                        onEdit={editBien}
                        onDuplicate={duplicate}
                        onArchive={(x) => askArchive([x.id])}
                        onDelete={(x) => askDelete([x.id])}
                        onMatching={launchMatching}
                        onLeads={showLeads}
                        favoriRing
                      />
                    ))}
                  </div>
                ) : null}
                <div className="border-t border-line my-5" />
              </section>
            )}

            {/* Main */}
            {view === "grid" ? (
              <>
                {favoris.length > 0 && (
                  <div className="text-sm font-semibold mb-2">Tous les biens ({main.length})</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paged.map(b => (
                    <BienCard
                      key={b.id} bien={b}
                      selected={selected.has(b.id)}
                      anySelection={selected.size > 0}
                      onToggleSelect={toggleSelect}
                      onOpenDetail={(x) => setDetailId(x.id)}
                      onToggleFav={toggleFav}
                      onChangeStatut={changeStatut}
                      onEdit={editBien}
                      onDuplicate={duplicate}
                      onArchive={(x) => askArchive([x.id])}
                      onDelete={(x) => askDelete([x.id])}
                      onMatching={launchMatching}
                      onLeads={showLeads}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between bg-card border border-line rounded-lg p-3">
                    <span className="text-xs text-muted-foreground">{paged.length} biens affichés sur {main.length}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="w-7 h-7 rounded-md bg-muted disabled:opacity-40 flex items-center justify-center">
                        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                          className={cn("w-7 h-7 rounded-md text-xs font-medium",
                            page === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>{p}</button>
                      ))}
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="w-7 h-7 rounded-md bg-muted disabled:opacity-40 flex items-center justify-center">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* List view */
              <div className="bg-card border border-line rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/40">
                      <tr className="border-b border-line">
                        <th className="w-10 px-3 h-9">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 accent-primary"
                            checked={selected.size > 0 && filtered.every(f => selected.has(f.id))}
                            onChange={e => setSelected(e.target.checked ? new Set(filtered.map(f => f.id)) : new Set())}
                          />
                        </th>
                        {["Bien", "Type", "Prix", "Surface", "Statut", "Leads", "Ajouté", ""].map(h => (
                          <th key={h} className="px-2 h-9 text-left text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(b => (
                        <BienRow
                          key={b.id} bien={b}
                          selected={selected.has(b.id)}
                          onToggleSelect={toggleSelect}
                          onOpenDetail={(x) => setDetailId(x.id)}
                          onToggleFav={toggleFav}
                          onChangeStatut={changeStatut}
                          onEdit={editBien}
                          onDuplicate={duplicate}
                          onArchive={(x) => askArchive([x.id])}
                          onDelete={(x) => askDelete([x.id])}
                          onMatching={launchMatching}
                          onLeads={showLeads}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-card border border-line shadow-xl rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold pl-1">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <span className="w-px h-5 bg-line" />
          <button
            onClick={() => navigate(`/matching?propertyIds=${Array.from(selected).join(",")}`)}
            className="text-xs h-7 px-2.5 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1 font-medium"
          >
            <Zap className="w-3 h-3" /> Matcher
          </button>
          <button
            onClick={() => askArchive(Array.from(selected))}
            className="text-xs h-7 px-2.5 rounded-md bg-amber-100 text-amber-800 inline-flex items-center gap-1 font-medium"
          >
            <Archive className="w-3 h-3" /> Archiver
          </button>
          <button
            onClick={() => askDelete(Array.from(selected))}
            className="text-xs h-7 px-2.5 rounded-md bg-destructive text-destructive-foreground inline-flex items-center gap-1 font-medium"
          >
            <Trash2 className="w-3 h-3" /> Supprimer
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs h-7 px-2 rounded-md hover:bg-muted text-muted-foreground inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Annuler
          </button>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!detailBien} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
          {detailBien && (
            <BienDetail
              bien={detailBien}
              onClose={() => setDetailId(null)}
              onToggleFav={toggleFav}
              onChangeStatut={changeStatut}
              onEdit={editBien}
              onDuplicate={duplicate}
              onArchive={(b) => askArchive([b.id])}
              onDelete={(b) => askDelete([b.id])}
              onMatching={launchMatching}
              onLeads={showLeads}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Import / manual create dialog */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} defaultKind={importKind} />

      {/* Confirm modal */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.msg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); doConfirm(); }}
              disabled={deleting}
              className={confirm?.kind === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {deleting ? "…" : confirm?.kind === "delete" ? "Supprimer" : "Archiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};
export default Properties;

/* ───────────────────── Sub-components ───────────────────── */

function KpiTile({ label, value, tone, iconLeft }: { label: string; value: number; tone: string; iconLeft?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-card px-3 py-1.5 min-w-[88px]">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn("text-base font-bold tnum flex items-center gap-1", tone)}>{iconLeft}{value}</div>
    </div>
  );
}

function StatutBadge({ statut, onClick }: { statut: Statut; onClick?: () => void }) {
  const m = STATUT_META[statut];
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-0.5",
        m.bg, m.fg, onClick && "cursor-pointer hover:opacity-90"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", STATUT_DOT[statut])} />
      {m.label}
    </span>
  );
}

function BienCard({
  bien, selected, anySelection, onToggleSelect, onOpenDetail, onToggleFav,
  onChangeStatut, onEdit, onDuplicate, onArchive, onDelete, onMatching, onLeads, favoriRing,
}: {
  bien: BienVM; selected: boolean; anySelection: boolean; favoriRing?: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (b: BienVM) => void;
  onToggleFav: (id: string) => void;
  onChangeStatut: (id: string, s: Statut) => void;
  onEdit: (b: BienVM) => void;
  onDuplicate: (b: BienVM) => void;
  onArchive: (b: BienVM) => void;
  onDelete: (b: BienVM) => void;
  onMatching: (b: BienVM) => void;
  onLeads: (b: BienVM) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statutMenu, setStatutMenu] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!menuOpen && !statutMenu) return;
    const f = () => { setMenuOpen(false); setStatutMenu(false); };
    document.addEventListener("click", f);
    return () => document.removeEventListener("click", f);
  }, [menuOpen, statutMenu]);

  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  const showCheck = hovered || anySelection || selected;
  const txnLabel = TX_LABELS[bien.transaction_type] ?? bien.transaction_type;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenDetail(bien)}
      className={cn(
        "bg-card rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md border border-line",
        favoriRing && "ring-1 ring-amber-300/70",
        selected && "ring-2 ring-primary"
      )}
    >
      {/* Image area */}
      <div className="h-36 relative bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-slate-300" />
        </div>

        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {showCheck && (
            <button
              onClick={stop(() => onToggleSelect(bien.id))}
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center bg-card",
                selected ? "bg-primary border-primary" : "border-line"
              )}
              aria-label="Sélectionner"
            >
              {selected && <Check className="w-3 h-3 text-primary-foreground" />}
            </button>
          )}
          <StatutBadge statut={bien.statut} />
        </div>

        <button
          onClick={stop(() => onToggleFav(bien.id))}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/95 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition"
          aria-label="Favori"
        >
          <Star className={cn("w-3.5 h-3.5", bien.isFavorite ? "text-amber-500 fill-amber-400" : "text-muted-foreground")} />
        </button>

        <span className={cn(
          "absolute bottom-2 left-2 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm",
          bien.transaction_type === "sale" ? "bg-primary/90" : "bg-blue-600/90"
        )}>
          {txnLabel}
        </span>
        {bien.leadsCompatibles > 0 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm bg-primary/80">
            <Users className="w-3 h-3" /> {bien.leadsCompatibles} leads
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="text-sm font-semibold truncate">{bien.title}</div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{bien.city ?? "—"}{bien.postal_code ? `, ${bien.postal_code}` : ""}</span>
        </div>
        <div className="text-lg font-bold mt-1 text-primary tnum">
          {bien.price ? fmtEurShort(bien.price) : "—"}
          {bien.transaction_type === "rent" && <span className="text-xs font-medium text-muted-foreground"> /mois</span>}
        </div>

        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Maximize2 className="w-3 h-3" />{bien.surface_m2 ?? "—"} m²</span>
          {bien.rooms ? <span className="inline-flex items-center gap-1"><LayoutGrid className="w-3 h-3" />{bien.rooms} pièces</span> : null}
          {bien.bedrooms ? <span className="inline-flex items-center gap-1"><BedDouble className="w-3 h-3" />{bien.bedrooms} ch.</span> : null}
        </div>

        {bien.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {bien.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-line bg-muted/30 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={stop(() => onLeads(bien))}
            className="h-6 px-2 rounded-md text-[10px] font-medium inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100"
            title="Voir les leads compatibles"
          >
            <Users className="w-3 h-3" /> Voir leads
          </button>
          <button
            onClick={stop(() => onMatching(bien))}
            className="h-6 px-2 rounded-md text-[10px] font-medium inline-flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100"
            title="Lancer un matching"
          >
            <Zap className="w-3 h-3" /> Matching
          </button>
        </div>
        <div className="flex gap-1 relative">
          <button onClick={stop(() => onEdit(bien))} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Modifier">
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={stop(() => onDuplicate(bien))} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Dupliquer">
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={stop(() => setMenuOpen(o => !o))} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Plus">
            <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-52 bg-card border border-line rounded-lg shadow-lg py-1 z-30"
            >
              <MenuItem icon={<Star className={cn("w-3.5 h-3.5", bien.isFavorite && "text-amber-500 fill-amber-400")} />} onClick={() => { onToggleFav(bien.id); setMenuOpen(false); }}>
                {bien.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              </MenuItem>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setStatutMenu(s => !s); }}
                  className="w-full h-8 px-3 flex items-center gap-2 text-xs hover:bg-muted text-left"
                >
                  <span className={cn("w-2 h-2 rounded-full", STATUT_DOT[bien.statut])} />
                  <span className="flex-1">Changer le statut</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </button>
                {statutMenu && (
                  <div className="absolute right-full top-0 mr-1 w-44 bg-card border border-line rounded-lg shadow-lg py-1">
                    {(Object.keys(STATUT_META) as Statut[]).map(k => (
                      <button
                        key={k}
                        onClick={(e) => { e.stopPropagation(); onChangeStatut(bien.id, k); setMenuOpen(false); setStatutMenu(false); }}
                        className="w-full h-8 px-3 flex items-center gap-2 text-xs hover:bg-muted text-left"
                      >
                        <span className={cn("w-2 h-2 rounded-full", STATUT_DOT[k])} />
                        <span className="flex-1">{STATUT_META[k].label}</span>
                        {bien.statut === k && <Check className="w-3 h-3 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <MenuItem icon={<Eye className="w-3.5 h-3.5" />} onClick={() => { onOpenDetail(bien); setMenuOpen(false); }}>
                Voir le détail
              </MenuItem>
              <Link
                to={`/matching/history`}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                className="w-full h-8 px-3 flex items-center gap-2 text-xs hover:bg-muted"
              >
                <History className="w-3.5 h-3.5" /> Historique des matchings
              </Link>
              <div className="border-t border-line my-1" />
              <MenuItem icon={<Copy className="w-3.5 h-3.5" />} onClick={() => { onDuplicate(bien); setMenuOpen(false); }}>
                Dupliquer
              </MenuItem>
              <MenuItem icon={<Archive className="w-3.5 h-3.5" />} onClick={() => { onArchive(bien); setMenuOpen(false); }}>
                Archiver
              </MenuItem>
              <div className="border-t border-line my-1" />
              <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => { onDelete(bien); setMenuOpen(false); }} danger>
                Supprimer définitivement
              </MenuItem>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, children, onClick, danger }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "w-full h-8 px-3 flex items-center gap-2 text-xs text-left",
        danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-muted"
      )}
    >
      {icon}{children}
    </button>
  );
}

function BienRow({
  bien, selected, onToggleSelect, onOpenDetail, onToggleFav, onChangeStatut,
  onEdit, onDuplicate, onArchive, onDelete, onMatching, onLeads,
}: {
  bien: BienVM; selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (b: BienVM) => void;
  onToggleFav: (id: string) => void;
  onChangeStatut: (id: string, s: Statut) => void;
  onEdit: (b: BienVM) => void;
  onDuplicate: (b: BienVM) => void;
  onArchive: (b: BienVM) => void;
  onDelete: (b: BienVM) => void;
  onMatching: (b: BienVM) => void;
  onLeads: (b: BienVM) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const f = () => setMenuOpen(false);
    document.addEventListener("click", f);
    return () => document.removeEventListener("click", f);
  }, [menuOpen]);
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  return (
    <tr onClick={() => onOpenDetail(bien)} className="hover:bg-muted/40 cursor-pointer border-b border-line">
      <td className="px-3 h-12">
        <input type="checkbox" className="w-3.5 h-3.5 accent-primary" checked={selected}
          onClick={(e) => e.stopPropagation()} onChange={() => onToggleSelect(bien.id)} />
      </td>
      <td className="px-2 h-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{bien.title}</div>
            <div className="text-[10px] text-muted-foreground truncate">{bien.city ?? "—"}</div>
          </div>
        </div>
      </td>
      <td className="px-2 h-12">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{TYPE_LABELS[bien.property_type] ?? bien.property_type}</span>
      </td>
      <td className="px-2 h-12 text-xs font-semibold text-primary tnum">{bien.price ? fmtEurShort(bien.price) : "—"}</td>
      <td className="px-2 h-12 text-xs text-muted-foreground">{bien.surface_m2 ?? "—"} m²</td>
      <td className="px-2 h-12"><StatutBadge statut={bien.statut} /></td>
      <td className="px-2 h-12">
        <button onClick={stop(() => onLeads(bien))} className="text-xs font-medium text-blue-700 inline-flex items-center gap-1">
          <Users className="w-3 h-3" />{bien.leadsCompatibles}
        </button>
      </td>
      <td className="px-2 h-12 text-[10px] text-muted-foreground">
        {new Date(bien.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
      </td>
      <td className="px-2 h-12">
        <div className="flex gap-0.5 relative">
          <button onClick={stop(() => onToggleFav(bien.id))} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center" title="Favori">
            <Star className={cn("w-3 h-3", bien.isFavorite ? "text-amber-500 fill-amber-400" : "text-muted-foreground")} />
          </button>
          <button onClick={stop(() => onMatching(bien))} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center" title="Matching">
            <Zap className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={stop(() => onEdit(bien))} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center" title="Modifier">
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={stop(() => setMenuOpen(o => !o))} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center" title="Plus">
            <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-7 w-44 bg-card border border-line rounded-lg shadow-lg py-1 z-30">
              <MenuItem icon={<Eye className="w-3.5 h-3.5" />} onClick={() => { onOpenDetail(bien); setMenuOpen(false); }}>Voir le détail</MenuItem>
              <MenuItem icon={<Copy className="w-3.5 h-3.5" />} onClick={() => { onDuplicate(bien); setMenuOpen(false); }}>Dupliquer</MenuItem>
              <MenuItem icon={<Archive className="w-3.5 h-3.5" />} onClick={() => { onArchive(bien); setMenuOpen(false); }}>Archiver</MenuItem>
              <div className="border-t border-line my-1" />
              <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => { onDelete(bien); setMenuOpen(false); }} danger>Supprimer</MenuItem>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function FiltersPanel({
  filters, setFilters, onClose, count,
}: {
  filters: { types: string[]; transaction: "tous" | "sale" | "rent"; prixMin: number; prixMax: number; surfaceMin: number; surfaceMax: number };
  setFilters: React.Dispatch<React.SetStateAction<{ types: string[]; transaction: "tous" | "sale" | "rent"; prixMin: number; prixMax: number; surfaceMin: number; surfaceMax: number }>>;
  onClose: () => void;
  count: number;
}) {
  const toggleType = (t: string) => setFilters(f => ({
    ...f, types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t],
  }));
  const reset = () => setFilters({ types: [], transaction: "tous", prixMin: 0, prixMax: 5_000_000, surfaceMin: 0, surfaceMax: 1000 });
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-9 left-0 w-80 bg-card border border-line rounded-lg shadow-xl z-50 p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Filtres avancés</span>
        <button onClick={onClose} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center">
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">Type de bien</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(TYPE_LABELS).map(([k, l]) => (
            <button
              key={k}
              onClick={() => toggleType(k)}
              className={cn(
                "h-7 px-2.5 rounded-full text-[11px] font-medium",
                filters.types.includes(k) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >{l}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">Transaction</div>
        <div className="flex gap-1">
          {([
            { k: "tous" as const, l: "Toutes" },
            { k: "sale" as const, l: "Vente" },
            { k: "rent" as const, l: "Location" },
          ]).map(c => (
            <button
              key={c.k}
              onClick={() => setFilters(f => ({ ...f, transaction: c.k }))}
              className={cn(
                "h-7 px-3 rounded-full text-[11px] font-medium",
                filters.transaction === c.k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >{c.l}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">Prix (€)</div>
        <div className="flex gap-2">
          <input type="number" value={filters.prixMin} onChange={e => setFilters(f => ({ ...f, prixMin: Number(e.target.value) || 0 }))}
            placeholder="Min" className="flex-1 h-8 px-2 rounded-md border border-line bg-background text-xs" />
          <input type="number" value={filters.prixMax} onChange={e => setFilters(f => ({ ...f, prixMax: Number(e.target.value) || 0 }))}
            placeholder="Max" className="flex-1 h-8 px-2 rounded-md border border-line bg-background text-xs" />
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">Surface (m²)</div>
        <div className="flex gap-2">
          <input type="number" value={filters.surfaceMin} onChange={e => setFilters(f => ({ ...f, surfaceMin: Number(e.target.value) || 0 }))}
            placeholder="Min" className="flex-1 h-8 px-2 rounded-md border border-line bg-background text-xs" />
          <input type="number" value={filters.surfaceMax} onChange={e => setFilters(f => ({ ...f, surfaceMax: Number(e.target.value) || 0 }))}
            placeholder="Max" className="flex-1 h-8 px-2 rounded-md border border-line bg-background text-xs" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-line">
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">Réinitialiser</button>
        <button onClick={onClose} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium">
          Voir {count} bien{count > 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}

function BienDetail({
  bien, onClose, onToggleFav, onChangeStatut, onEdit, onDuplicate, onArchive, onDelete, onMatching, onLeads,
}: {
  bien: BienVM;
  onClose: () => void;
  onToggleFav: (id: string) => void;
  onChangeStatut: (id: string, s: Statut) => void;
  onEdit: (b: BienVM) => void;
  onDuplicate: (b: BienVM) => void;
  onArchive: (b: BienVM) => void;
  onDelete: (b: BienVM) => void;
  onMatching: (b: BienVM) => void;
  onLeads: (b: BienVM) => void;
}) {
  const statutBtns: { k: Statut; icon: React.ReactNode; label: string }[] = [
    { k: "disponible", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Disponible" },
    { k: "sous-compromis", icon: <Clock className="w-3.5 h-3.5" />, label: "Compromis" },
    { k: "vendu", icon: <Key className="w-3.5 h-3.5" />, label: "Vendu" },
    { k: "retire", icon: <XCircle className="w-3.5 h-3.5" />, label: "Retiré" },
  ];
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-line">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatutBadge statut={bien.statut} />
              <span className={cn(
                "text-[10px] font-semibold text-white px-2 py-0.5 rounded",
                bien.transaction_type === "sale" ? "bg-primary" : "bg-blue-600"
              )}>{TX_LABELS[bien.transaction_type]}</span>
            </div>
            <h2 className="text-lg font-bold leading-tight">{bien.title}</h2>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{[bien.city, bien.postal_code].filter(Boolean).join(", ") || "—"}</span>
            </div>
          </div>
          <button
            onClick={() => onToggleFav(bien.id)}
            className={cn(
              "h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5",
              bien.isFavorite ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", bien.isFavorite && "fill-amber-400")} />
            {bien.isFavorite ? "Favori" : "Ajouter"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div>
          <div className="text-2xl font-bold text-primary tnum">{bien.price ? fmtEur(bien.price) : "—"}</div>
          {bien.surface_m2 && bien.transaction_type === "sale" && bien.price ? (
            <div className="text-xs text-muted-foreground mt-0.5">
              {fmtEur(Math.round(bien.price / bien.surface_m2))} /m²
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Maximize2 className="w-4 h-4" />, val: bien.surface_m2 ?? "—", suffix: "m²", lbl: "Surface" },
            { icon: <LayoutGrid className="w-4 h-4" />, val: bien.rooms ?? "—", lbl: "Pièces" },
            { icon: <BedDouble className="w-4 h-4" />, val: bien.bedrooms ?? "—", lbl: "Chambres" },
            { icon: <Building2 className="w-4 h-4" />, val: TYPE_LABELS[bien.property_type] ?? bien.property_type, lbl: "Type" },
            { icon: <span className="text-xs font-bold">DPE</span>, val: bien.dpe_rating ?? "—", lbl: "DPE" },
            { icon: <Users className="w-4 h-4" />, val: bien.leadsCompatibles, lbl: "Leads" },
          ].map((s, i) => (
            <div key={i} className="rounded-md bg-muted/50 p-2 text-center">
              <div className="flex items-center justify-center text-muted-foreground">{s.icon}</div>
              <div className="text-sm font-bold mt-0.5">{s.val}{s.suffix && <span className="text-[10px] ml-0.5">{s.suffix}</span>}</div>
              <div className="text-[10px] text-muted-foreground">{s.lbl}</div>
            </div>
          ))}
        </div>

        {bien.description && (
          <div>
            <div className="text-xs font-semibold mb-1">Description</div>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{bien.description}</p>
          </div>
        )}

        {bien.tags.length > 0 && (
          <div>
            <div className="text-xs font-semibold mb-1.5">Tags</div>
            <div className="flex flex-wrap gap-1">
              {bien.tags.map(t => (
                <span key={t} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs font-semibold mb-2">Statut</div>
          <div className="grid grid-cols-2 gap-2">
            {statutBtns.map(s => {
              const m = STATUT_META[s.k];
              const active = bien.statut === s.k;
              return (
                <button
                  key={s.k}
                  onClick={() => onChangeStatut(bien.id, s.k)}
                  className={cn(
                    "h-8 px-2 rounded-md border text-xs font-medium inline-flex items-center justify-center gap-1.5",
                    active ? `${m.bg} ${m.fg} border-transparent` : "bg-card border-line text-muted-foreground"
                  )}
                >
                  {s.icon}{s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-line bg-muted/30 p-4 space-y-2">
        <button
          onClick={() => onEdit(bien)}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2"
        >
          <Pencil className="w-3.5 h-3.5" /> Modifier ce bien
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onMatching(bien)} className="h-9 rounded-md bg-blue-50 text-blue-700 text-xs font-medium inline-flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Lancer un matching
          </button>
          <button onClick={() => onLeads(bien)} className="h-9 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium inline-flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Voir les leads
          </button>
          <button onClick={() => onDuplicate(bien)} className="h-9 rounded-md bg-card border border-line text-muted-foreground text-xs font-medium inline-flex items-center justify-center gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Dupliquer
          </button>
          <Link
            to={`/properties/${bien.id}`}
            className="h-9 rounded-md bg-card border border-line text-muted-foreground text-xs font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Détail complet
          </Link>
        </div>
        <button onClick={() => onArchive(bien)} className="w-full h-9 rounded-md bg-amber-50 text-amber-700 text-xs font-medium inline-flex items-center justify-center gap-1.5">
          <Archive className="w-3.5 h-3.5" /> Archiver ce bien
        </button>
        <button onClick={() => onDelete(bien)} className="w-full h-9 rounded-md bg-card border border-rose-200 text-destructive text-xs font-medium inline-flex items-center justify-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Supprimer définitivement
        </button>
        <button onClick={onClose} className="w-full h-8 text-xs text-muted-foreground hover:text-foreground">
          Fermer
        </button>
      </div>
    </div>
  );
}