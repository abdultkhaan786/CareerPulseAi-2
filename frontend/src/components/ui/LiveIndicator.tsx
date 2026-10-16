import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { timeAgo, cx } from "@/lib/format";

/** "Updated 20s ago · Refresh" — shows that data is live and lets the user force a refresh. */
export function LiveIndicator({ updatedAt, fetching, onRefresh }: { updatedAt: number; fetching: boolean; onRefresh: () => void }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span className={cx("h-2 w-2 rounded-full", fetching ? "bg-ember" : "animate-beat bg-signal")} aria-hidden />
      <span aria-live="polite">{fetching ? "Updating…" : updatedAt ? `Updated ${timeAgo(new Date(updatedAt))}` : "Loading…"}</span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={fetching}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-ink transition hover:bg-line/50 disabled:opacity-50"
      >
        <RefreshCw className={cx("h-3.5 w-3.5", fetching && "animate-spin")} aria-hidden />
        Refresh
      </button>
    </div>
  );
}
