import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Building2, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { fmtEur, FINANCING_LABEL, TIMELINE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { scoreLeadProperty, scoreBucket, CRITERIA, type ScoringLead, type ScoringProperty } from "@/lib/scoring";
import { toast } from "sonner";

const TYPE_LABEL: Record<string, string> = { apartment: "Appartement", house: "Maison", land: "Terrain", commercial: "Local", other: "Autre" };
const TX_LABEL: Record<string, string> = { sale: "Vente", rent: "Location" };

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ lead: ScoringLead & { email: string | null; phone: string | null }; property: ScoringProperty; consultedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: m } = await supabase.from("matches").select("lead_id,property_id,created_at").eq("id", id).maybeSingle();
      if (!m) { setLoading(false); return; }
      const [l, p] = await Promise.all([
        supabase.from("leads").select("*").eq("id", m.lead_id).maybeSingle(),
        supabase.from("properties").select("*").eq("id", m.property_id).maybeSingle(),
      ]);
      if (l.data && p.data) setData({ lead: l.data as never, property: p.data as never, consultedAt: m.created_at });
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <AppLayout><div className="p-12 text-center text-sm text-muted-foreground">Chargement…</div></AppLayout>;
  if (!data) return <AppLayout><div className="p-12 text-center text-sm text-muted-foreground">Match introuvable.</div></AppLayout>;

  const { lead, property } = data;
  const result = scoreLeadProperty(lead, property);
  const b = scoreBucket(result.total);
  const reco = result.total >= 70 ? { label: "Contacter maintenant", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" }
    : result.total >= 40 ? { label: "Surveiller", cls: "bg-amber-100 text-amber-800 border-amber-300" }
    : { label: "Déqualifier", cls: "bg-rose-100 text-rose-800 border-rose-300" };

  return (
    <AppLayout title="Détail du match">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <Link to="/matching/history" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3 h-3" /> Retour à l'historique
        </Link>

        {/* Score hero */}
        <div className={cn("rounded-xl border p-6 flex flex-col sm:flex-row items-center gap-6", `score-bg-s${b} border-current/20`)}>
          <div className={cn("tnum text-6xl font-medium leading-none", `score-text-s${b}`)}>
            {result.total}<span className="text-2xl opacity-60">/100</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs uppercase tracking-wider opacity-70 font-medium">Compatibilité</div>
            <div className={cn("text-lg font-semibold", `score-text-s${b}`)}>
              {b >= 5 ? "Excellente" : b === 4 ? "Bonne" : b === 3 ? "Moyenne" : b === 2 ? "Faible" : "Incompatible"}
            </div>
            <span className={cn("inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full border", reco.cls)}>
              Recommandation : {reco.label}
            </span>
          </div>
          <button onClick={() => toast.success(`Email préparé pour ${lead.first_name} sur « ${property.title} »`)}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-dark inline-flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> Envoyer ce bien par email
          </button>
        </div>

        {/* Split view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lead */}
          <Link to={`/leads/${lead.id}`} className="group rounded-lg border border-line bg-card p-4 hover:border-primary/40 transition">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Lead</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                {(lead.first_name[0] ?? "").toUpperCase()}{(lead.last_name[0] ?? "").toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate group-hover:text-primary transition">{lead.first_name} {lead.last_name}</div>
                <div className="text-xs text-muted-foreground truncate">{lead.email ?? lead.phone ?? "—"}</div>
              </div>
              <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
            </div>
            <dl className="text-xs space-y-1.5">
              <Row label="Budget" value={`${lead.budget_min ? fmtEur(lead.budget_min) : "—"} – ${lead.budget_max ? fmtEur(lead.budget_max) : "—"}`} />
              <Row label="Ville" value={lead.desired_city ?? "—"} />
              <Row label="Type" value={lead.desired_property_type ? TYPE_LABEL[lead.desired_property_type] : "—"} />
              <Row label="Surface min" value={lead.desired_surface_min ? `${lead.desired_surface_min} m²` : "—"} />
              <Row label="Timeline" value={lead.timeline ? TIMELINE_LABEL[lead.timeline] : "—"} />
              <Row label="Financement" value={lead.financing ? FINANCING_LABEL[lead.financing] : "—"} />
            </dl>
          </Link>

          {/* Property */}
          <Link to={`/properties/${property.id}`} className="group rounded-lg border border-line bg-card p-4 hover:border-primary/40 transition">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Bien</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate group-hover:text-primary transition">{property.title}</div>
                <div className="text-xs text-muted-foreground truncate">{[property.city, property.postal_code].filter(Boolean).join(" ")}</div>
              </div>
              <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
            </div>
            <dl className="text-xs space-y-1.5">
              <Row label="Prix" value={property.price ? fmtEur(property.price) : "—"} />
              <Row label="Type" value={TYPE_LABEL[property.property_type] ?? property.property_type} />
              <Row label="Transaction" value={TX_LABEL[property.transaction_type] ?? property.transaction_type} />
              <Row label="Surface" value={property.surface_m2 ? `${property.surface_m2} m²` : "—"} />
              <Row label="Pièces" value={property.rooms?.toString() ?? "—"} />
            </dl>
          </Link>
        </div>

        {/* Breakdown */}
        <section className="rounded-lg border border-line bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Analyse détaillée par critère</h2>
          <div className="space-y-3">
            {CRITERIA.map(c => {
              const s = result.scores[c.key];
              const cb = scoreBucket(s);
              return (
                <div key={c.key}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm">{c.label}<span className="ml-1.5 text-[10px] text-muted-foreground tnum">{c.weight}%</span></span>
                    <span className={cn("text-sm tnum font-medium", `score-text-s${cb}`)}>{s}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full transition-all", `score-fill-s${cb}`)} style={{ width: `${s}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pos / Neg */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-emerald-800 mb-2">Points forts</h3>
            {result.positives.length === 0 ? (
              <div className="text-xs text-emerald-700/70">Aucun point fort identifié.</div>
            ) : (
              <ul className="space-y-1 text-sm text-emerald-900">
                {result.positives.map((p, i) => <li key={i}>✓ {p}</li>)}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-rose-800 mb-2">Points faibles</h3>
            {result.negatives.length === 0 ? (
              <div className="text-xs text-rose-700/70">Aucun point faible identifié.</div>
            ) : (
              <ul className="space-y-1 text-sm text-rose-900">
                {result.negatives.map((n, i) => <li key={i}>✗ {n}</li>)}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[100px_1fr] gap-2">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium truncate">{value}</dd>
  </div>
);

export default MatchDetail;
