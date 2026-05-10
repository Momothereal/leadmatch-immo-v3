import { Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { PROSPECTS } from "@/data/mock";
import { cn } from "@/lib/utils";

export type FilterKey = "all" | "hot" | "good" | "mid" | "low";
export type SortKey = "score" | "recent";

interface Props {
  filter: FilterKey;
  setFilter: (f: FilterKey) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
}

const tabs: { id: FilterKey; label: string; range: [number, number] }[] = [
  { id: "all",  label: "Tous",       range: [0, 100] },
  { id: "hot",  label: "Excellents", range: [81, 100] },
  { id: "good", label: "Bons",       range: [61, 80] },
  { id: "mid",  label: "Moyens",     range: [41, 60] },
  { id: "low",  label: "Faibles",    range: [0, 40] },
];

export const Toolbar = ({ filter, setFilter, sort, setSort }: Props) => (
  <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-line bg-card">
    <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted/60">
      {tabs.map((t) => {
        const count =
          t.id === "all" ? PROSPECTS.length : PROSPECTS.filter((p) => p.total >= t.range[0] && p.total <= t.range[1]).length;
        return (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
              "h-7 px-2.5 rounded text-[12px] font-medium inline-flex items-center gap-1.5 transition",
              filter === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            <span className={cn("tnum text-[10.5px]", filter === t.id ? "text-muted-foreground" : "text-muted-2")}>
              {count}
            </span>
          </button>
        );
      })}
    </div>

    <div className="hidden md:block w-px h-5 bg-line mx-1" />

    {["Financement", "Timeline", "Source"].map((l) => (
      <button
        key={l}
        className="h-7 px-2.5 rounded-md border border-line text-[12px] text-foreground hover:bg-muted inline-flex items-center gap-1.5 transition"
      >
        <Filter className="w-3 h-3 text-muted-foreground" strokeWidth={2} />
        {l}
        <ChevronDown className="w-3 h-3 text-muted-foreground" strokeWidth={2} />
      </button>
    ))}

    <div className="ml-auto flex items-center gap-2">
      <span className="text-[11.5px] text-muted-foreground">Trier par</span>
      <button
        onClick={() => setSort(sort === "score" ? "recent" : "score")}
        className="h-7 px-2.5 rounded-md border border-line text-[12px] hover:bg-muted inline-flex items-center gap-1.5 transition"
      >
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" strokeWidth={2} />
        {sort === "score" ? "Score ↓" : "Activité récente"}
      </button>
    </div>
  </div>
);
