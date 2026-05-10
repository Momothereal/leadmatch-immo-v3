import { User, Mail, Calendar, Sparkles } from "lucide-react";
import type { Prospect } from "@/data/mock";
import { CRITERIA_META, OTHER_PROPERTIES } from "@/data/mock";
import {
  fmtEur, fmtEurShort, scoreBucket, scoreLabel, initialsFor, colorFor,
  FINANCING_LABEL, TIMELINE_LABEL,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const avatarColors = ["bg-c0", "bg-c1", "bg-c2", "bg-c3", "bg-c4", "bg-c5", "bg-c6", "bg-c7"];
const colorClass = (key: string) => {
  const map: Record<string, string> = {
    c0: "bg-[hsl(var(--c0))]", c1: "bg-[hsl(var(--c1))]", c2: "bg-[hsl(var(--c2))]",
    c3: "bg-[hsl(var(--c3))]", c4: "bg-[hsl(var(--c4))]", c5: "bg-[hsl(var(--c5))]",
    c6: "bg-[hsl(var(--c6))]", c7: "bg-[hsl(var(--c7))]",
  };
  return map[key] ?? "bg-primary";
};

export const DetailPanel = ({ prospect: p }: { prospect: Prospect | undefined }) => {
  if (!p) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground h-full">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <User className="w-5 h-5" strokeWidth={1.6} />
        </div>
        <div className="text-[14px] font-medium text-foreground mb-1">Sélectionnez un lead</div>
        <div className="text-[12.5px] max-w-[260px] leading-relaxed">
          Cliquez sur une ligne pour voir le scoring IA détaillé, les facteurs clés et le profil complet.
        </div>
      </div>
    );
  }

  const b = p.bucket;
  const alt = p.altSuggestion ? OTHER_PROPERTIES.find((op) => op.id === p.altSuggestion) : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-5 space-y-5">
        {/* Head */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-[14px] shadow-sm",
              colorClass(colorFor(p.name))
            )}
          >
            {initialsFor(p.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-medium truncate">{p.name}</div>
            <div className="text-[11.5px] text-muted-foreground flex items-center gap-2 flex-wrap">
              Lead depuis le{" "}
              {new Date(p.firstSeen).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              <span className="px-1.5 py-0.5 rounded bg-muted text-[10.5px] font-medium text-foreground/70">
                {p.source}
              </span>
            </div>
          </div>
        </div>

        {/* Score hero */}
        <div className={cn("flex items-center gap-4 p-4 rounded-xl border", `score-bg-s${b} border-current/15`)}>
          <div className={cn("tnum text-[44px] font-medium leading-none", `score-text-s${b}`)}>
            {p.total}
            <span className="text-[16px] opacity-60 font-normal">/100</span>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-foreground/55 font-medium">
              Compatibilité avec ce bien
            </div>
            <div className={cn("text-[15px] font-medium mt-0.5", `score-text-s${b}`)}>
              {scoreLabel(p.total)}
            </div>
          </div>
        </div>

        {/* AI summary */}
        <div className="relative p-4 rounded-xl bg-primary-soft border border-primary/15 text-[13px] leading-relaxed text-foreground/90">
          <div className="absolute -top-2 left-3 px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-primary text-white inline-flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} /> IA
          </div>
          {p.summary}
        </div>

        {/* Factors */}
        {(p.positives.length > 0 || p.negatives.length > 0) && (
          <div>
            <SectionTitle>Facteurs clés</SectionTitle>
            <div className="space-y-1.5">
              {p.positives.map((f, i) => (
                <Factor key={`p${i}`} kind="pos" text={f} />
              ))}
              {p.negatives.map((f, i) => (
                <Factor key={`n${i}`} kind="neg" text={f} />
              ))}
            </div>
          </div>
        )}

        {/* Breakdown */}
        <div>
          <SectionTitle right="Pondération IA">Breakdown par critère</SectionTitle>
          <div className="space-y-2.5">
            {(Object.entries(CRITERIA_META) as [keyof typeof CRITERIA_META, (typeof CRITERIA_META)[keyof typeof CRITERIA_META]][])
              .map(([key, meta]) => {
                const s = p.scores[key] ?? 0;
                const cb = scoreBucket(s);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="text-[12px]">
                        {meta.label}
                        <span className="ml-1.5 text-[10.5px] text-muted-foreground tnum">{meta.weight}%</span>
                      </div>
                      <div className={cn("text-[12px] tnum font-medium", `score-text-s${cb}`)}>{s}/100</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", `score-fill-s${cb}`)}
                        style={{ width: `${s}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Dossier */}
        <div>
          <SectionTitle>Profil du lead</SectionTitle>
          <dl className="rounded-lg border border-line divide-y divide-line bg-card overflow-hidden">
            <Row label="Budget" value={`${fmtEur(p.budget.min)} – ${fmtEur(p.budget.max)}`} mono />
            <Row label="Zone" value={p.desiredCity} />
            <Row label="Recherche" value={`${p.desiredRooms} pièces · ${p.desiredSurface}m²+`} />
            <Row label="Timeline">
              <Tag>{TIMELINE_LABEL[p.timeline]}</Tag>
            </Row>
            <Row label="Financement">
              <Tag
                variant={
                  p.financing === "approved" || p.financing === "cash"
                    ? "pos"
                    : p.financing === "not_started"
                    ? "neg"
                    : "neutral"
                }
              >
                {FINANCING_LABEL[p.financing]}
              </Tag>
            </Row>
            <Row label="Activité" value={`${p.visits} visite(s) · ${p.opened}/${p.sent} mails ouverts`} mono />
            {p.notes && <Row label="Notes" value={p.notes} italic />}
          </dl>
        </div>

        {alt && (
          <div className="p-3.5 rounded-lg bg-primary-soft border border-primary/15 text-[12.5px] leading-relaxed text-primary-dark">
            <div className="font-semibold mb-0.5 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" strokeWidth={2.5} /> Suggestion IA
            </div>
            <div>
              Ce lead pourrait mieux correspondre à <b>{alt.title}</b> ({fmtEurShort(alt.price)}).
            </div>
          </div>
        )}
      </div>

      {/* Actions sticky */}
      <div className="mt-auto sticky bottom-0 bg-card/95 backdrop-blur border-t border-line p-3 flex gap-2">
        <button className="flex-1 h-9 rounded-md border border-line text-[12.5px] font-medium hover:bg-muted inline-flex items-center justify-center gap-1.5 transition">
          <Mail className="w-3.5 h-3.5" strokeWidth={2} /> Contacter
        </button>
        <button className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-[12.5px] font-medium hover:bg-primary-dark inline-flex items-center justify-center gap-1.5 transition shadow-sm">
          <Calendar className="w-3.5 h-3.5" strokeWidth={2} /> Proposer visite
        </button>
      </div>
    </div>
  );
};

const SectionTitle = ({ children, right }: { children: React.ReactNode; right?: string }) => (
  <div className="flex justify-between items-baseline mb-2.5">
    <h3 className="text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground">{children}</h3>
    {right && <span className="text-[10.5px] text-muted-2">{right}</span>}
  </div>
);

const Factor = ({ kind, text }: { kind: "pos" | "neg"; text: string }) => (
  <div
    className={cn(
      "flex items-start gap-2 px-3 py-2 rounded-md text-[12.5px] border",
      kind === "pos"
        ? "bg-emerald-50/60 border-emerald-200/50 text-emerald-900"
        : "bg-rose-50/50 border-rose-200/50 text-rose-900"
    )}
  >
    <span
      className={cn(
        "w-4 h-4 rounded-full flex items-center justify-center text-[12px] font-bold leading-none flex-shrink-0 mt-0.5",
        kind === "pos" ? "bg-emerald-200/70 text-emerald-800" : "bg-rose-200/70 text-rose-800"
      )}
    >
      {kind === "pos" ? "+" : "−"}
    </span>
    <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
  </div>
);

const Row = ({
  label, value, children, mono, italic,
}: { label: string; value?: string; children?: React.ReactNode; mono?: boolean; italic?: boolean }) => (
  <div className="grid grid-cols-[110px_1fr] gap-3 px-3.5 py-2.5">
    <dt className="text-[11.5px] text-muted-foreground">{label}</dt>
    <dd className={cn("text-[12.5px] text-foreground", mono && "font-mono", italic && "italic text-muted-foreground")}>
      {children ?? value}
    </dd>
  </div>
);

const Tag = ({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "pos" | "neg" | "neutral" }) => (
  <span
    className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border",
      variant === "pos" && "bg-emerald-50 text-emerald-700 border-emerald-200/70",
      variant === "neg" && "bg-rose-50 text-rose-700 border-rose-200/70",
      variant === "neutral" && "bg-muted text-foreground/70 border-line"
    )}
  >
    {children}
  </span>
);
