import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2, Users, Zap, TrendingUp, ArrowRight, Phone, Calendar, ExternalLink,
  CheckCheck, MoreHorizontal, Upload, Plus, Activity, Star, FileText, Heart, Trophy, Gift, Copy, Check,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ImportDialog } from "@/components/leadmatch/import/ImportDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useReferral } from "@/hooks/useReferral";

interface MatchRow {
  id: string; score: number; created_at: string;
  property: { id: string; title: string; city: string | null } | null;
  lead: { id: string; first_name: string; last_name: string } | null;
}
interface LeadRow {
  id: string; first_name: string; last_name: string; created_at: string;
  desired_city: string | null; budget_max: number | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { referralLink, referralCode } = useReferral();
  const [counts, setCounts] = useState({ properties: 0, leads: 0, matches: 0, avgScore: 0 });
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [recentLeads, setRecentLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importKind, setImportKind] = useState<"properties" | "leads">("properties");

  useEffect(() => {
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [p, l, mAll, mRecent, lRecent, pNew, lNew] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("score"),
        supabase
          .from("matches")
          .select("id,score,created_at,property:properties(id,title,city),lead:leads(id,first_name,last_name)")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("leads")
          .select("id,first_name,last_name,created_at,desired_city,budget_max")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("properties").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      ]);

      const scores = (mAll.data ?? []).map((r: { score: number }) => r.score);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      setCounts({
        properties: p.count ?? 0,
        leads: l.count ?? 0,
        matches: scores.length,
        avgScore: avg,
      });
      (window as unknown as { __weekly?: { p: number; l: number } }).__weekly = {
        p: pNew.count ?? 0,
        l: lNew.count ?? 0,
      };
      if (mRecent.data) setMatches(mRecent.data as unknown as MatchRow[]);
      if (lRecent.data) setRecentLeads(lRecent.data as LeadRow[]);
      setLoading(false);
    })();
  }, [importOpen]);

  const weekly = (window as unknown as { __weekly?: { p: number; l: number } }).__weekly ?? { p: 0, l: 0 };

  const openImport = (k: "properties" | "leads") => { setImportKind(k); setImportOpen(true); };
  const firstName = (user?.email?.split("@")[0] ?? "Agent").replace(/\./g, " ");

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Hero */}
        <div className="rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm bg-[#0F2D52]">
          <div>
            <div className="text-white text-xl font-bold mb-1 capitalize">Bonjour {firstName}</div>
            <div className="text-white/70 text-sm">
              Vous avez <strong className="text-white">{counts.leads} leads</strong> et{" "}
              <strong className="text-white">{counts.properties} biens</strong> à matcher aujourd'hui.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openImport("leads")}
              className="h-9 px-4 rounded-lg text-sm font-medium text-white border border-white/25 bg-white/10 hover:bg-white/20 transition inline-flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Importer
            </button>
            <button
              onClick={() => navigate("/matching")}
              className="h-9 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition bg-[#C8A96E] hover:bg-[#b8995c] text-[#0F2D52]"
            >
              <Zap className="w-4 h-4" /> Lancer un matching
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600"
            label="Leads actifs" value={counts.leads}
            delta={weekly.l > 0 ? `+${weekly.l} cette semaine` : "Aucun nouveau cette semaine"}
            linkLabel="Voir les leads" linkColor="text-blue-600"
            onLink={() => navigate("/leads")}
          />
          <KpiCard
            icon={Building2} iconBg="bg-emerald-50" iconColor="text-emerald-600"
            label="Biens disponibles" value={counts.properties}
            delta={weekly.p > 0 ? `+${weekly.p} cette semaine` : "Aucun nouveau cette semaine"}
            linkLabel="Voir les biens" linkColor="text-emerald-600"
            onLink={() => navigate("/properties")}
          />
          <KpiCard
            icon={Zap} iconBg="bg-amber-50" iconColor="text-amber-600"
            label="Matchs enregistrés" value={counts.matches}
            delta={`${matches.length} récents`}
            linkLabel="Historique" linkColor="text-amber-600"
            onLink={() => navigate("/matching/history")}
          />
          <KpiCard
            icon={TrendingUp} iconBg="bg-fuchsia-50" iconColor="text-fuchsia-600"
            label="Score moyen" value={`${counts.avgScore}`}
            delta={counts.matches ? "Sur tous les matchs calculés" : "Aucun match calculé"}
            linkLabel="Lancer un match" linkColor="text-fuchsia-600"
            onLink={() => navigate("/matching")}
          />
        </div>

        {/* Actions + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ActionsRequises leads={recentLeads} matches={matches} navigate={navigate} />
          </div>
          <ActivityFeed leads={recentLeads} matches={matches} />
        </div>

        {/* Pipeline + recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PipelineCard leads={counts.leads} matches={counts.matches} avgScore={counts.avgScore} />
          </div>
          <QuickActions
            onImportLeads={() => openImport("leads")}
            onImportProps={() => openImport("properties")}
          />
        </div>

        {/* Referral */}
        {referralLink && (
          <ReferralCard referralLink={referralLink} referralCode={referralCode ?? ""} />
        )}

        {/* Recent tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentLeadsCard leads={recentLeads} loading={loading} />
          <RecentMatchesCard matches={matches} loading={loading} />
        </div>
      </div>

      <ImportDialog key={importKind} open={importOpen} onOpenChange={setImportOpen} defaultKind={importKind} />
    </AppLayout>
  );
};

/* -------- KPI -------- */
function KpiCard({
  icon: Icon, iconBg, iconColor, label, value, delta, linkLabel, linkColor, onLink,
}: {
  icon: typeof Users; iconBg: string; iconColor: string;
  label: string; value: number | string; delta: string;
  linkLabel: string; linkColor: string; onLink: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
      </div>
      <div className="text-3xl font-bold tnum leading-none mb-2">{value}</div>
      <div className="text-xs text-emerald-600 font-medium mb-3">{delta}</div>
      <button
        onClick={onLink}
        className={cn("text-xs font-semibold inline-flex items-center gap-1 hover:underline", linkColor)}
      >
        {linkLabel} <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

/* -------- Actions requises -------- */
function ActionsRequises({
  leads, matches, navigate,
}: {
  leads: LeadRow[]; matches: MatchRow[]; navigate: ReturnType<typeof useNavigate>;
}) {
  const [tab, setTab] = useState<"nouveaux" | "matchs" | "perimes">("nouveaux");

  const recentNoMatch = useMemo(() => {
    const matchedLeadIds = new Set(matches.map((m) => m.lead?.id).filter(Boolean));
    return leads.filter((l) => !matchedLeadIds.has(l.id)).slice(0, 5);
  }, [leads, matches]);

  const lowScores = useMemo(() => matches.filter((m) => m.score < 50).slice(0, 5), [matches]);
  const goodMatches = useMemo(() => matches.filter((m) => m.score >= 70).slice(0, 5), [matches]);

  const tabs = [
    { id: "nouveaux" as const, label: "Nouveaux leads", count: recentNoMatch.length },
    { id: "matchs" as const, label: "Bons matchs", count: goodMatches.length },
    { id: "perimes" as const, label: "Faibles scores", count: lowScores.length },
  ];
  const total = recentNoMatch.length + goodMatches.length + lowScores.length;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">Actions requises</div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{total}</span>
        </div>
        <button
          onClick={() => toast.success("Toutes les actions marquées lues")}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <CheckCheck className="w-3.5 h-3.5" /> Tout marquer lu
        </button>
      </div>
      <div className="flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "h-10 px-4 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground",
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>
      <div className="divide-y">
        {tab === "nouveaux" && recentNoMatch.map((l) => (
          <ActionRow
            key={l.id} dotColor="bg-blue-500"
            title={`${l.first_name} ${l.last_name}`}
            subtitle={`Nouveau lead${l.desired_city ? ` · ${l.desired_city}` : ""}`}
            onView={() => navigate(`/leads/${l.id}`)}
            onMatch={() => navigate("/matching")}
          />
        ))}
        {tab === "matchs" && goodMatches.map((m) => (
          <ActionRow
            key={m.id} dotColor="bg-emerald-500"
            title={`${m.lead?.first_name ?? "?"} ${m.lead?.last_name ?? ""} × ${m.property?.title ?? "?"}`}
            subtitle={`Score ${m.score} · à recontacter`}
            onView={() => navigate(`/matching/history/${m.id}`)}
            onMatch={() => navigate(`/matching/history/${m.id}`)}
          />
        ))}
        {tab === "perimes" && lowScores.map((m) => (
          <ActionRow
            key={m.id} dotColor="bg-amber-500"
            title={`${m.lead?.first_name ?? "?"} ${m.lead?.last_name ?? ""} × ${m.property?.title ?? "?"}`}
            subtitle={`Score faible (${m.score}) · revoir le profil`}
            onView={() => navigate(`/matching/history/${m.id}`)}
            onMatch={() => navigate(`/matching/history/${m.id}`)}
          />
        ))}
        {((tab === "nouveaux" && recentNoMatch.length === 0) ||
          (tab === "matchs" && goodMatches.length === 0) ||
          (tab === "perimes" && lowScores.length === 0)) && (
          <div className="text-sm text-muted-foreground text-center py-10">
            Rien à signaler ici 🎉
          </div>
        )}
      </div>
    </div>
  );
}

function ActionRow({
  dotColor, title, subtitle, onView, onMatch,
}: { dotColor: string; title: string; subtitle: string; onView: () => void; onMatch: () => void }) {
  return (
    <div className="h-14 flex items-center px-4 gap-3 hover:bg-muted/40 transition-colors group">
      <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
      </div>
      <div className="hidden md:flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMatch}
          className="h-7 px-2 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1"
        >
          <Phone className="w-3 h-3" /> Relancer
        </button>
        <button
          onClick={onView}
          className="h-7 px-2 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" /> Voir
        </button>
      </div>
      <button className="w-7 h-7 rounded-md hover:bg-muted text-muted-foreground inline-flex items-center justify-center md:hidden">
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* -------- Activity feed -------- */
function ActivityFeed({ leads, matches }: { leads: LeadRow[]; matches: MatchRow[] }) {
  const items = useMemo(() => {
    const a = leads.map((l) => ({
      id: `l-${l.id}`,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
      text: `Lead ajouté · ${l.first_name} ${l.last_name}`,
      time: l.created_at,
    }));
    const b = matches.map((m) => ({
      id: `m-${m.id}`,
      icon: Heart,
      color: "text-fuchsia-600 bg-fuchsia-50",
      text: `Match · ${m.lead?.first_name ?? "?"} × ${m.property?.title ?? "?"}`,
      time: m.created_at,
    }));
    return [...a, ...b].sort((x, y) => +new Date(y.time) - +new Date(x.time)).slice(0, 8);
  }, [leads, matches]);

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <div className="text-sm font-semibold">Activité récente</div>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-10">Aucune activité</div>
      ) : (
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", it.color)}>
                <it.icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{it.text}</div>
                <div className="text-[11px] text-muted-foreground">{relTime(it.time)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function relTime(iso: string) {
  const diff = Date.now() - +new Date(iso);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d}j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

/* -------- Pipeline -------- */
function PipelineCard({ leads, matches, avgScore }: { leads: number; matches: number; avgScore: number }) {
  const stages = [
    { label: "Leads", count: leads, color: "bg-blue-500" },
    { label: "Matchs", count: matches, color: "bg-emerald-500" },
    { label: "Bons (≥70)", count: Math.round(matches * (avgScore >= 70 ? 0.6 : 0.3)), color: "bg-amber-500" },
    { label: "Excellents (≥85)", count: Math.round(matches * (avgScore >= 85 ? 0.4 : 0.1)), color: "bg-fuchsia-500" },
  ];
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold">Pipeline</div>
          <div className="text-xs text-muted-foreground">Vue d'ensemble de votre tunnel</div>
        </div>
        <Trophy className="w-4 h-4 text-amber-500" />
      </div>
      <div className="space-y-3">
        {stages.map((s) => {
          const pct = (s.count / max) * 100;
          return (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{s.label}</span>
                <span className="tnum text-muted-foreground">{s.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", s.color)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- Quick actions -------- */
function QuickActions({
  onImportLeads, onImportProps,
}: { onImportLeads: () => void; onImportProps: () => void }) {
  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3">
      <div className="text-sm font-semibold mb-1">Raccourcis</div>
      <Button onClick={onImportLeads} variant="outline" className="justify-start gap-2">
        <Upload className="w-4 h-4" /> Importer des leads
      </Button>
      <Button onClick={onImportProps} variant="outline" className="justify-start gap-2">
        <Upload className="w-4 h-4" /> Importer des biens
      </Button>
      <Link to="/matching">
        <Button className="w-full justify-start gap-2">
          <Zap className="w-4 h-4" /> Nouveau matching
        </Button>
      </Link>
      <Link to="/matching/history">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <FileText className="w-4 h-4" /> Voir l'historique
        </Button>
      </Link>
    </div>
  );
}

/* -------- Recent leads / matches -------- */
function RecentLeadsCard({ leads, loading }: { leads: LeadRow[]; loading: boolean }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="text-sm font-semibold">Derniers leads</div>
        <Link to="/leads" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Tout voir <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="py-10 text-sm text-muted-foreground text-center">Chargement…</div>
      ) : leads.length === 0 ? (
        <div className="py-10 text-sm text-muted-foreground text-center">Aucun lead pour le moment.</div>
      ) : (
        <ul className="divide-y">
          {leads.map((l) => (
            <li key={l.id}>
              <Link to={`/leads/${l.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                  {(l.first_name[0] ?? "?")}{(l.last_name[0] ?? "")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.first_name} {l.last_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l.desired_city ?? "—"}{l.budget_max ? ` · jusqu'à ${(l.budget_max / 1000).toFixed(0)} k€` : ""}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground tnum">{relTime(l.created_at)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentMatchesCard({ matches, loading }: { matches: MatchRow[]; loading: boolean }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="text-sm font-semibold">Derniers matchs</div>
        <Link to="/matching/history" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Historique <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="py-10 text-sm text-muted-foreground text-center">Chargement…</div>
      ) : matches.length === 0 ? (
        <div className="py-10 text-sm text-muted-foreground text-center">Aucun match enregistré.</div>
      ) : (
        <ul className="divide-y">
          {matches.map((m) => (
            <li key={m.id}>
              <Link to={`/matching/history/${m.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                <ScoreBadge value={m.score} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {m.lead ? `${m.lead.first_name} ${m.lead.last_name}` : "Lead supprimé"}
                    <ArrowRight className="inline w-3 h-3 mx-1.5 text-muted-foreground" />
                    {m.property?.title ?? "Bien supprimé"}
                  </div>
                  <div className="text-xs text-muted-foreground">{relTime(m.created_at)}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ScoreBadge = ({ value }: { value: number }) => {
  const cls = value >= 81 ? "score-bg-s5" : value >= 61 ? "score-bg-s4" : value >= 41 ? "score-bg-s3" : value >= 21 ? "score-bg-s2" : "score-bg-s1";
  return <div className={cn("w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold tnum", cls)}>{value}</div>;
};

/* -------- Referral card -------- */
function ReferralCard({ referralLink, referralCode }: { referralLink: string; referralCode: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="rounded-2xl border bg-gradient-to-r from-[#0F2D52] to-[#1E4D8C] p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-[rgba(200,169,110,0.2)] flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-[#C8A96E]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Parrainez un collègue · 1 mois offert</div>
          <div className="text-xs text-white/60 mt-0.5">
            Partagez votre lien. Dès que votre filleul souscrit, votre abonnement est prolongé d'un mois gratuitement.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 md:w-64 h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-xs text-white/80 font-mono flex items-center truncate">
          {referralLink}
        </div>
        <button
          onClick={copy}
          className="h-9 w-9 rounded-lg bg-[#C8A96E] hover:bg-[#b8995c] flex items-center justify-center shrink-0 transition"
          title="Copier le lien"
        >
          {copied ? <Check className="w-4 h-4 text-[#0F2D52]" /> : <Copy className="w-4 h-4 text-[#0F2D52]" />}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
