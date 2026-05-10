import { Eye, RefreshCw, Plus } from "lucide-react";
import { LISTING } from "@/data/mock";
import { fmtEurShort, fmtInt } from "@/lib/format";

export const PropertyHeader = () => {
  const [pre, suf] = LISTING.title.split("—").map((s) => s.trim());
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_auto] gap-5 px-6 py-5 border-b border-line bg-card">
      <div className="relative rounded-xl overflow-hidden h-[160px] lg:h-full min-h-[160px] bg-muted shadow-card">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${LISTING.coverUrl})` }}
        />
        <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-black/55 backdrop-blur-sm text-white text-[11px] font-mono font-medium">
          {LISTING.ref}
        </div>
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-black/55 backdrop-blur-sm text-white text-[11px]">
          <Eye className="w-3 h-3" strokeWidth={2} />
          <span className="tnum">{LISTING.photos}</span>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-1.5">
            <span>{LISTING.neighborhood}</span>
            <span className="w-1 h-1 rounded-full bg-muted-2" />
            <span>{LISTING.postal} {LISTING.city}</span>
            <span className="w-1 h-1 rounded-full bg-muted-2" />
            <span>Publié {LISTING.published}</span>
          </div>
          <h1 className="text-[26px] leading-tight font-medium tracking-tight">
            {pre} <em className="font-serif font-normal italic text-foreground/85">— {suf}</em>
          </h1>
        </div>

        <div className="flex flex-wrap gap-x-7 gap-y-2 pt-1">
          <Fact label="Prix" value={fmtEurShort(LISTING.price)} big />
          <Fact label="€/m²" value={fmtInt(LISTING.pricePerSqm)} />
          <Fact label="Surface" value={`${LISTING.surface} m²`} />
          <Fact label="Pièces" value={String(LISTING.rooms)} />
          <Fact label="Chambres" value={String(LISTING.bedrooms)} />
          <Fact label="Étage" value={LISTING.floor} />
          <Fact label="DPE" value={LISTING.dpe} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 justify-between">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11.5px] font-medium border border-emerald-200/60">
          <span className="pulse-dot" />
          {LISTING.status}
        </div>
        <div className="flex flex-col gap-1.5 w-full lg:w-auto">
          <button className="h-8 px-3 rounded-md text-[12px] font-medium border border-line hover:bg-muted text-foreground inline-flex items-center gap-1.5 justify-center transition">
            <RefreshCw className="w-3 h-3" strokeWidth={2} /> Re-scorer tous
          </button>
          <button className="h-8 px-3 rounded-md text-[12px] font-medium bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-1.5 justify-center transition shadow-sm">
            <Plus className="w-3 h-3" strokeWidth={2.4} /> Ajouter un lead
          </button>
        </div>
      </div>
    </div>
  );
};

const Fact = ({ label, value, big }: { label: string; value: string; big?: boolean }) => (
  <div>
    <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
    <div className={`tnum font-medium ${big ? "text-[20px] text-primary" : "text-[15px] text-foreground"}`}>
      {value}
    </div>
  </div>
);
