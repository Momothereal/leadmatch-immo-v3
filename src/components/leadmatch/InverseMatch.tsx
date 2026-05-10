import { Sparkles, ArrowRight } from "lucide-react";
import { PROSPECTS, OTHER_PROPERTIES } from "@/data/mock";
import { fmtEurShort } from "@/lib/format";

export const InverseMatch = () => {
  const candidates = PROSPECTS.filter((p) => p.altSuggestion)
    .map((p) => {
      const property = OTHER_PROPERTIES.find((op) => op.id === p.altSuggestion);
      const estimated = Math.min(95, p.total + 35 + Math.round(((p.id.charCodeAt(1) % 10) / 10) * 8));
      return property ? { p, property, estimated } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  if (candidates.length === 0) return null;

  return (
    <div className="mt-6 mx-3 rounded-xl border border-line bg-gradient-to-br from-primary-soft/40 to-card overflow-hidden">
      <div className="flex items-start gap-3 p-4 border-b border-line/70">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4" strokeWidth={2} />
        </div>
        <div>
          <div className="text-[13.5px] font-medium">Matching inversé</div>
          <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
            {candidates.length} leads faiblement compatibles avec ce bien, mais qui correspondraient mieux à d'autres biens de votre portefeuille.
          </div>
        </div>
      </div>
      <div className="divide-y divide-line/70">
        {candidates.map(({ p, property, estimated }) => (
          <div key={p.id} className="flex items-center gap-3 p-3 px-4 text-[12.5px] hover:bg-muted/40 transition">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <b className="truncate">{p.name}</b>
              <ArrowRight className="w-3 h-3 text-muted-2 flex-shrink-0" />
              <span className="truncate">{property.title}</span>
              <span className="text-muted-foreground tnum">· {fmtEurShort(property.price)}</span>
            </div>
            <div className="hidden md:block text-muted-foreground tnum text-[11.5px]">
              score estimé <b className="text-foreground">{estimated}</b>{" "}
              <span className="text-muted-2">(ici: {p.total})</span>
            </div>
            <button className="h-7 px-2.5 rounded border border-line text-[11.5px] hover:bg-card transition">
              Voir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
