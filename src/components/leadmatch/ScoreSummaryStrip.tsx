import { PROSPECTS } from "@/data/mock";

export const ScoreSummaryStrip = () => {
  const buckets = [0, 0, 0, 0, 0];
  PROSPECTS.forEach((p) => buckets[p.bucket - 1]++);
  const total = PROSPECTS.length;
  const hot = PROSPECTS.filter((p) => p.total >= 61).length;
  const avg = Math.round(PROSPECTS.reduce((s, p) => s + p.total, 0) / total);

  const labels = ["0–20", "21–40", "41–60", "61–80", "81–100"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center px-6 py-4 border-b border-line bg-card">
      <div>
        <div className="text-[15px] font-medium tnum">{total} leads scorés</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">
          Dont <b className="score-text-s5">{hot}</b> avec un score &gt; 60
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex h-2 rounded-full overflow-hidden bg-muted">
          {buckets.map((c, i) => (
            <div
              key={i}
              className={`score-fill-s${i + 1} transition-all`}
              style={{ width: `${(c / total) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {buckets.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full score-fill-s${i + 1}`} />
              {labels[i]} <b className="font-mono text-foreground tnum">{c}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="text-right md:border-l md:border-line md:pl-6">
        <div className="tnum text-[28px] font-medium leading-none">
          {avg}
          <span className="text-[14px] text-muted-foreground font-normal ml-0.5">/100</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">
          Score moyen
        </div>
      </div>
    </div>
  );
};
