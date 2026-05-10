import { scoreBucket } from "@/lib/format";
import { cn } from "@/lib/utils";

export const ScorePill = ({ score }: { score: number }) => {
  const b = scoreBucket(score);
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-12 h-12 rounded-lg flex-shrink-0",
        `score-bg-s${b}`
      )}
    >
      <div className={cn("tnum text-[17px] font-semibold leading-none", `score-text-s${b}`)}>
        {score}
      </div>
      <div className="flex gap-0.5 mt-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] h-[3px] rounded-full",
              i <= b ? `score-fill-s${b}` : "bg-current opacity-20"
            )}
          />
        ))}
      </div>
    </div>
  );
};
