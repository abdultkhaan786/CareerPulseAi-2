import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/format";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-xl bg-line/50 p-1", className)}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
              on ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cx("num rounded-md px-1.5 text-xs", on ? "bg-signal-soft text-signal" : "bg-line/80")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const btn = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button className={cx(btn, "text-muted hover:bg-line/50 hover:text-ink disabled:opacity-40")} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={cx(btn, "num", n === page ? "bg-ink text-paper dark:bg-signal dark:text-night" : "text-ink hover:bg-line/50")}
          >
            {n}
          </button>
        )
      )}
      <button className={cx(btn, "text-muted hover:bg-line/50 hover:text-ink disabled:opacity-40")} onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
