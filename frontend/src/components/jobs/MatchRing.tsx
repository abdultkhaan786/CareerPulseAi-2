import { matchTone } from "@/lib/skills";
import { cx } from "@/lib/format";

const STROKE = { strong: "stroke-signal", partial: "stroke-iris", low: "stroke-ember", none: "" };

export function MatchRing({ score, size = 48, label = true }: { score: number | null; size?: number; label?: boolean }) {
  const tone = matchTone(score);
  if (score === null) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line text-xs text-muted"
        style={{ width: size, height: size }}
        title="This job lists no skills"
      >
        –
      </span>
    );
  }
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const value = Math.round(score * 100);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value}% skill match`}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} className="stroke-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score)}
          className={cx(STROKE[tone], "transition-[stroke-dashoffset] duration-700")}
        />
      </svg>
      {label && (
        <span className="num relative font-display font-bold" style={{ fontSize: size * 0.28 }}>
          {value}
        </span>
      )}
    </span>
  );
}
