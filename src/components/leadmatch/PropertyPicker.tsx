import { useEffect, useMemo, useState } from "react";
import { Search, Building2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtEurShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PickedProperty {
  id: string;
  title: string;
  city: string | null;
  property_type: string;
  transaction_type: string;
  price: number | null;
  surface_m2: number | null;
  rooms: number | null;
}

const TYPE_LABEL: Record<string, string> = {
  apartment: "Appartement", house: "Maison", land: "Terrain",
  commercial: "Local", other: "Autre",
};
const TX_LABEL: Record<string, string> = { sale: "Vente", rent: "Location" };

interface Props {
  selectedId: string | null;
  onSelect: (p: PickedProperty | null) => void;
}

export const PropertyPicker = ({ selectedId, onSelect }: Props) => {
  const [items, setItems] = useState<PickedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id,title,city,property_type,transaction_type,price,surface_m2,rooms")
        .order("created_at", { ascending: false });
      if (!cancel) {
        if (!error && data) setItems(data as PickedProperty[]);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.title, p.city, TYPE_LABEL[p.property_type], TX_LABEL[p.transaction_type]]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query]);

  return (
    <div className="border-b border-line bg-card px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 h-8 px-2.5 rounded-md bg-muted/60 border border-transparent focus-within:bg-card focus-within:border-line">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un bien (ville, type, transaction)…"
            className="flex-1 bg-transparent outline-none text-[12.5px] placeholder:text-muted-foreground"
          />
        </div>
        {selectedId && (
          <button
            onClick={() => onSelect(null)}
            className="text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 h-8 rounded-md hover:bg-muted"
          >
            <X className="w-3 h-3" /> Tout afficher
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-[12px] text-muted-foreground">Chargement des biens…</div>
      ) : filtered.length === 0 ? (
        <div className="text-[12px] text-muted-foreground flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5" />
          {items.length === 0 ? "Aucun bien importé pour l'instant." : "Aucun bien ne correspond."}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filtered.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(active ? null : p)}
                className={cn(
                  "shrink-0 w-[220px] text-left p-2.5 rounded-lg border transition",
                  active
                    ? "border-primary bg-primary-soft/60 shadow-sm"
                    : "border-line bg-card hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <div className="text-[12.5px] font-medium truncate">{p.title}</div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {[p.city, TYPE_LABEL[p.property_type], TX_LABEL[p.transaction_type]]
                    .filter(Boolean).join(" · ")}
                </div>
                <div className="text-[12px] tnum text-primary font-medium mt-1">
                  {p.price ? fmtEurShort(p.price) : "—"}
                  {p.surface_m2 ? <span className="text-muted-foreground font-normal"> · {p.surface_m2} m²</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
