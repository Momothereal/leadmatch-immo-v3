import { Tag, Flag, MoreHorizontal, Check } from "lucide-react";
import type { Prospect } from "@/data/mock";
import { fmtEurShort, FINANCING_LABEL, TIMELINE_LABEL } from "@/lib/format";
import { ScorePill } from "./ScorePill";
import { cn } from "@/lib/utils";

interface Props {
  prospect: Prospect;
  selected: boolean;
  checked: boolean;
  onSelect: (id: string) => void;
  onCheck: (id: string) => void;
}

const stageStyles: Record<string, string> = {
  hot: "bg-rose-50 text-rose-700 border-rose-200/70",
  active: "bg-amber-50 text-amber-700 border-amber-200/70",
  cold: "bg-slate-100 text-slate-600 border-slate-200/70",
};

export const ProspectRow = ({ prospect: p, selected, checked, onSelect, onCheck }: Props) => (
  <div
    onClick={() => onSelect(p.id)}
    className={cn(
      "group grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-3 items-center px-3.5 py-3 rounded-lg cursor-pointer transition",
      "border border-transparent",
      selected
        ? "bg-primary-soft/60 border-primary/30 shadow-sm"
        : "hover:bg-muted/50 hover:border-line"
    )}
  >
    <button
      onClick={(e) => { e.stopPropagation(); onCheck(p.id); }}
      className={cn(
        "w-4 h-4 rounded border flex items-center justify-center transition",
        checked
          ? "bg-primary border-primary text-white"
          : "border-line hover:border-muted-foreground bg-card"
      )}
    >
      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
    </button>

    <ScorePill score={p.total} />

    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[13.5px] font-medium text-foreground truncate">{p.name}</span>
        <span
          className={cn(
            "text-[10.5px] px-1.5 py-0.5 rounded border font-medium",
            stageStyles[p.stageLevel]
          )}
        >
          {p.stage}
        </span>
      </div>
      <div className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
        {p.summary}
      </div>
    </div>

    <div className="hidden xl:flex flex-col gap-1 text-[11.5px] text-muted-foreground min-w-[180px]">
      <div className="flex items-center gap-1.5">
        <Tag className="w-3 h-3" strokeWidth={1.8} />
        Budget <b className="text-foreground tnum">{fmtEurShort(p.budget.min)} – {fmtEurShort(p.budget.max)}</b>
      </div>
      <div className="flex items-center gap-1.5">
        <Flag className="w-3 h-3" strokeWidth={1.8} />
        {FINANCING_LABEL[p.financing]} · {TIMELINE_LABEL[p.timeline]}
      </div>
    </div>

    <div className="hidden lg:flex flex-col items-end text-right">
      <div className="text-[11.5px] text-foreground">{p.lastActivity}</div>
      <div className="text-[10.5px] text-muted-foreground font-mono mt-0.5">
        {p.visits}v · {p.opened}/{p.sent}
      </div>
    </div>

    <button
      onClick={(e) => e.stopPropagation()}
      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition"
    >
      <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
    </button>
  </div>
);
