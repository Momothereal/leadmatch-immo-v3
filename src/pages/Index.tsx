import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, LogOut, Upload, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PropertyHeader } from "@/components/leadmatch/PropertyHeader";
import { ProspectRow } from "@/components/leadmatch/ProspectRow";
import { DetailPanel } from "@/components/leadmatch/DetailPanel";
import { ImportDialog } from "@/components/leadmatch/import/ImportDialog";
import { PropertyPicker, type PickedProperty } from "@/components/leadmatch/PropertyPicker";
import { PROSPECTS } from "@/data/mock";

const Index = () => {
  const { user, signOut } = useAuth();
  const [selectedId, setSelectedId] = useState("p01");
  const [detailOpen, setDetailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importKind, setImportKind] = useState<"properties" | "leads">("leads");
  const [pickedProperty, setPickedProperty] = useState<PickedProperty | null>(null);

  const openImport = (kind: "properties" | "leads") => {
    setImportKind(kind);
    setImportOpen(true);
  };

  // Pré-filtrage des prospects selon le bien sélectionné
  // (ville, type recherché, achat/location)
  const list = useMemo(() => {
    const all = [...PROSPECTS].sort((a, b) => b.total - a.total);
    if (!pickedProperty) return all;
    const wantedTx = pickedProperty.transaction_type === "sale" ? "buy" : "rent";
    const cityNorm = (pickedProperty.city ?? "").toLowerCase();
    return all.filter((p) => {
      const cityOk = cityNorm
        ? p.desiredCity.toLowerCase().includes(cityNorm) ||
          cityNorm.includes(p.desiredCity.toLowerCase().split(" ")[0])
        : true;
      const typeOk = p.desiredType === pickedProperty.property_type;
      // wantedTx influence le ranking si dispo dans le mock — on le garde permissif
      void wantedTx;
      return cityOk && typeOk;
    });
  }, [pickedProperty]);
  const selected = PROSPECTS.find((p) => p.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-12 flex items-center justify-between px-4 border-b border-line bg-card">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold">LeadMatch</span>
          <nav className="flex items-center gap-1 text-xs">
            <span className="px-2 h-7 inline-flex items-center rounded-md bg-muted font-medium">Matching</span>
            <Link to="/dashboard" className="px-2 h-7 inline-flex items-center gap-1 rounded-md hover:bg-muted text-muted-foreground">
              <LayoutDashboard className="w-3 h-3" /> Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openImport("properties")}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 h-8 rounded-md border border-line hover:bg-muted transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importer des biens</span>
          </button>
          <button
            onClick={() => openImport("leads")}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 h-8 rounded-md bg-primary text-primary-foreground hover:bg-primary-dark transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importer des leads</span>
          </button>
          <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground" title="Déconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <PropertyHeader />

      <PropertyPicker selectedId={pickedProperty?.id ?? null} onSelect={setPickedProperty} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] min-h-0">
        <div className="overflow-y-auto p-3 space-y-1">
          {pickedProperty && (
            <div className="text-[11.5px] text-muted-foreground px-1.5 pb-1">
              {list.length} prospect(s) compatibles avec « {pickedProperty.title} »
            </div>
          )}
          {list.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8">
              Aucun prospect ne correspond à ce bien.
            </div>
          )}
          {list.map((p) => (
            <ProspectRow
              key={p.id}
              prospect={p}
              selected={p.id === selectedId}
              checked={false}
              onSelect={handleSelect}
              onCheck={() => {}}
            />
          ))}
        </div>
        <aside className="hidden lg:flex border-l border-line bg-card overflow-hidden flex-col">
          <DetailPanel prospect={selected} />
        </aside>
      </main>

      {detailOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailOpen(false)} />
          <div className="relative ml-auto w-full max-w-md bg-card border-l border-line flex flex-col h-full">
            <button
              onClick={() => setDetailOpen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
            <DetailPanel prospect={selected} />
          </div>
        </div>
      )}

      <ImportDialog
        key={importKind}
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultKind={importKind}
      />
    </div>
  );
};

export default Index;
