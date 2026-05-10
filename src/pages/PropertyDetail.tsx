import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Building2, Target, MapPin, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { fmtEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { scoreLeadProperty, scoreBucket, type ScoringProperty, type ScoringLead } from "@/lib/scoring";

const TYPE_LABEL: Record<string, string> = { apartment: "Appartement", house: "Maison", land: "Terrain", commercial: "Local", other: "Autre" };
const TX_LABEL: Record<string, string> = { sale: "Vente", rent: "Location" };

interface FullProperty extends ScoringProperty {
  bedrooms: number | null; dpe_rating: string | null; description: string | null; neighborhood: string | null;
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<FullProperty | null>(null);
  const [leads, setLeads] = useState<ScoringLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [p, l] = await Promise.all([
        supabase.from("properties").select("*").eq("id", id).maybeSingle(),
        supabase.from("leads").select("id,first_name,last_name,desired_city,desired_postal_code,budget_min,budget_max,desired_surface_min,desired_rooms_min,desired_property_type,desired_transaction_type,timeline,financing"),
      ]);
      if (p.data) setProperty(p.data as FullProperty);
      if (l.data) setLeads(l.data as ScoringLead[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <AppLayout><div className="p-12 text-center text-sm text-muted-foreground">Chargement…</div></AppLayout>;
  if (!property) return <AppLayout><div className="p-12 text-center text-sm text-muted-foreground">Bien introuvable.</div></AppLayout>;

  const scored = leads.map(lead => ({ lead, result: scoreLeadProperty(lead, property) }))
    .sort((a, b) => b.result.total - a.result.total);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/properties" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="w-3 h-3" />Biens</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate">{property.title}</span>
        </nav>

        <header className="rounded-lg border border-line bg-card p-5 flex flex-col md:flex-row gap-4 md:items-start">
          <div className="w-14 h-14 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">{property.title}</h1>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {[property.neighborhood, property.postal_code, property.city].filter(Boolean).join(" · ") || "Localisation non précisée"}
            </div>
            <div className="mt-3 text-2xl font-semibold text-primary tnum">{property.price ? fmtEur(property.price) : "—"}</div>
          </div>
          <Link to={`/matching?propertyId=${property.id}`}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary-dark text-xs font-medium inline-flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> Lancer le matching
          </Link>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Info label="Type" value={TYPE_LABEL[property.property_type] ?? property.property_type} />
          <Info label="Transaction" value={TX_LABEL[property.transaction_type] ?? property.transaction_type} />
          <Info label="Surface" value={property.surface_m2 ? `${property.surface_m2} m²` : "—"} />
          <Info label="Pièces" value={property.rooms?.toString() ?? "—"} />
          <Info label="Chambres" value={property.bedrooms?.toString() ?? "—"} />
          <Info label="DPE" value={property.dpe_rating ?? "—"} />
          <Info label="Ville" value={property.city ?? "—"} />
          <Info label="Code postal" value={property.postal_code ?? "—"} />
        </section>

        {property.description && (
          <section className="rounded-lg border border-line bg-card p-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Description</h2>
            <p className="text-sm leading-relaxed text-foreground/90">{property.description}</p>
          </section>
        )}

        <section className="rounded-lg border border-line bg-card">
          <header className="px-4 py-3 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-semibold">Leads compatibles</h2>
            <span className="text-xs text-muted-foreground">{scored.length} lead(s)</span>
          </header>
          {scored.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun lead à comparer. <Link to="/leads" className="text-primary underline">Importer des leads →</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {scored.map(({ lead, result }) => {
                const b = scoreBucket(result.total);
                return (
                  <li key={lead.id}>
                    <Link to={`/leads/${lead.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center font-semibold tnum text-sm shrink-0", `score-bg-s${b}`)}>
                        {result.total}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{lead.first_name} {lead.last_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {[lead.desired_city, lead.budget_max ? `≤ ${fmtEur(lead.budget_max)}` : null].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-line bg-card p-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
    <div className="text-sm font-medium mt-1 truncate">{value}</div>
  </div>
);

export default PropertyDetail;
