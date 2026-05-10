import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Mail, Phone, ArrowLeft, Target, Building2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { fmtEur, FINANCING_LABEL, TIMELINE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { scoreLeadProperty, scoreBucket, CRITERIA, type ScoringLead, type ScoringProperty } from "@/lib/scoring";

const TYPE_LABEL: Record<string, string> = { apartment: "Appartement", house: "Maison", land: "Terrain", commercial: "Local", other: "Autre" };

interface FullLead extends ScoringLead {
  email: string | null; phone: string | null; notes: string | null;
}

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<FullLead | null>(null);
  const [properties, setProperties] = useState<ScoringProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [l, p] = await Promise.all([
        supabase.from("leads").select("*").eq("id", id).maybeSingle(),
        supabase.from("properties").select("id,title,city,postal_code,price,surface_m2,rooms,property_type,transaction_type"),
      ]);
      if (l.data) setLead(l.data as FullLead);
      if (p.data) setProperties(p.data as ScoringProperty[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <AppLayout><div className="p-12 text-center text-sm text-muted-foreground">Chargement…</div></AppLayout>;
  if (!lead) return <AppLayout><div className="p-12 text-center text-sm text-muted-foreground">Lead introuvable.</div></AppLayout>;

  const scored = properties.map(prop => ({ prop, result: scoreLeadProperty(lead, prop) }))
    .sort((a, b) => b.result.total - a.result.total);
  const top3 = scored.slice(0, 3);
  const avgScore = scored.length ? Math.round(scored.reduce((s, x) => s + x.result.total, 0) / scored.length) : 0;
  const avgBreakdown = scored.length ? CRITERIA.reduce((acc, c) => {
    acc[c.key] = Math.round(scored.reduce((s, x) => s + x.result.scores[c.key], 0) / scored.length);
    return acc;
  }, {} as Record<string, number>) : {};

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/leads" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="w-3 h-3" />Leads</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{lead.first_name} {lead.last_name}</span>
        </nav>

        <header className="rounded-lg border border-line bg-card p-5 flex flex-col md:flex-row gap-4 md:items-center">
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg shrink-0">
            {(lead.first_name[0] ?? "").toUpperCase()}{(lead.last_name[0] ?? "").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold">{lead.first_name} {lead.last_name}</h1>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
              {lead.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
              {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
            </div>
          </div>
          {scored.length > 0 && (
            <div className={cn("px-4 py-2 rounded-lg text-center", `score-bg-s${scoreBucket(avgScore)}`)}>
              <div className={cn("text-2xl font-semibold tnum", `score-text-s${scoreBucket(avgScore)}`)}>{avgScore}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-70">Score moyen</div>
            </div>
          )}
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-line bg-card p-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Profil recherché</h2>
            <dl className="space-y-2 text-xs">
              <Row label="Budget" value={`${lead.budget_min ? fmtEur(lead.budget_min) : "—"} – ${lead.budget_max ? fmtEur(lead.budget_max) : "—"}`} />
              <Row label="Ville" value={lead.desired_city ?? "—"} />
              <Row label="Type" value={lead.desired_property_type ? TYPE_LABEL[lead.desired_property_type] : "—"} />
              <Row label="Surface min" value={lead.desired_surface_min ? `${lead.desired_surface_min} m²` : "—"} />
              <Row label="Pièces min" value={lead.desired_rooms_min?.toString() ?? "—"} />
              <Row label="Timeline" value={lead.timeline ? TIMELINE_LABEL[lead.timeline] : "—"} />
              <Row label="Financement" value={lead.financing ? FINANCING_LABEL[lead.financing] : "—"} />
            </dl>
          </div>

          <div className="rounded-lg border border-line bg-card p-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Critères pondérés (moyenne)</h2>
            {scored.length === 0 ? (
              <div className="text-xs text-muted-foreground">Aucun bien pour calculer un score.</div>
            ) : (
              <div className="space-y-2.5">
                {CRITERIA.map(c => {
                  const s = avgBreakdown[c.key] ?? 0;
                  const cb = scoreBucket(s);
                  return (
                    <div key={c.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{c.label}<span className="ml-1.5 text-[10px] text-muted-foreground tnum">{c.weight}%</span></span>
                        <span className={cn("tnum font-medium", `score-text-s${cb}`)}>{s}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full", `score-fill-s${cb}`)} style={{ width: `${s}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {lead.notes && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-amber-800 mb-1.5">Note agent</h2>
            <p className="text-sm leading-relaxed text-amber-950">{lead.notes}</p>
          </section>
        )}

        <section className="rounded-lg border border-line bg-card">
          <header className="px-4 py-3 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top biens compatibles</h2>
            <Link to="/matching" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <Target className="w-3 h-3" /> Voir le matching
            </Link>
          </header>
          {top3.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun bien à comparer. <Link to="/properties" className="text-primary underline">Importer un bien →</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {top3.map(({ prop, result }) => {
                const b = scoreBucket(result.total);
                return (
                  <li key={prop.id}>
                    <Link to={`/properties/${prop.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center font-semibold tnum text-sm shrink-0", `score-bg-s${b}`)}>
                        {result.total}
                      </div>
                      <div className="w-8 h-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{prop.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {[prop.city, prop.price ? fmtEur(prop.price) : null].filter(Boolean).join(" · ")}
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

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[110px_1fr] gap-2">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);

export default LeadDetail;
