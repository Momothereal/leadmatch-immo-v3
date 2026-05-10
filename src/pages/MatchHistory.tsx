import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, History } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { fmtEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { scoreBucket } from "@/lib/scoring";
import { relativeDate } from "@/lib/relativeDate";

interface Row {
  id: string; score: number; created_at: string;
  property_id: string; lead_id: string;
  property: { title: string; city: string | null; price: number | null } | null;
  lead: { first_name: string; last_name: string } | null;
}

const MatchHistory = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("matches")
        .select("id,score,created_at,property_id,lead_id,property:properties(title,city,price),lead:leads(first_name,last_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) setRows(data as unknown as Row[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (r.score < minScore) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (r.lead && `${r.lead.first_name} ${r.lead.last_name}`.toLowerCase().includes(s))
      || (r.property?.title.toLowerCase().includes(s) ?? false)
      || (r.property?.city?.toLowerCase().includes(s) ?? false);
  }), [rows, q, minScore]);

  return (
    <AppLayout title="Historique des matchs">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <History className="w-4 h-4 text-primary" />
          <span className="font-semibold">Historique des matchs</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground tnum">{rows.length}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1 h-9 px-2.5 rounded-md bg-muted/60 border border-transparent focus-within:bg-card focus-within:border-line">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un lead, un bien, une ville…"
              className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-line bg-card text-xs">
            <label className="text-muted-foreground">Score min</label>
            <input type="range" min={0} max={100} step={5} value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))} className="w-24" />
            <span className="tnum w-8 text-right">{minScore}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-line rounded-lg py-16 text-center space-y-3">
            <History className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <div className="text-sm text-muted-foreground">
              {rows.length === 0 ? "Aucun match consulté pour l'instant." : "Aucun match ne correspond aux filtres."}
            </div>
            {rows.length === 0 && <Link to="/matching" className="text-xs text-primary hover:underline">Lancer votre premier matching →</Link>}
          </div>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-lg bg-card overflow-hidden">
            {filtered.map(r => {
              const b = scoreBucket(r.score);
              const initials = r.lead ? `${(r.lead.first_name[0] ?? "").toUpperCase()}${(r.lead.last_name[0] ?? "").toUpperCase()}` : "??";
              return (
                <li key={r.id}>
                  <Link to={`/matching/history/${r.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-semibold">{initials}</div>
                    </div>
                    <div className={cn("w-11 h-11 rounded-md flex items-center justify-center font-semibold tnum text-sm shrink-0", `score-bg-s${b}`)}>
                      {r.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.lead ? `${r.lead.first_name} ${r.lead.last_name}` : "Lead supprimé"}
                        <ArrowRight className="inline w-3 h-3 mx-1.5 text-muted-foreground" />
                        {r.property?.title ?? "Bien supprimé"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[r.property?.city, r.property?.price ? fmtEur(r.property.price) : null, relativeDate(r.created_at)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppLayout>
  );
};

export default MatchHistory;
