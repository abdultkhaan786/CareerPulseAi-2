import type { ReactNode } from "react";
import { CloudOff, RefreshCw, ServerCrash } from "lucide-react";
import { Button } from "./Button";
import { ApiError } from "@/lib/api";
import { cx } from "@/lib/format";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-soft text-signal">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const network = error instanceof ApiError && error.isNetwork;
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className={cx("flex flex-col items-center px-6 py-12 text-center", className)} role="alert">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        {network ? <CloudOff className="h-6 w-6" /> : <ServerCrash className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-bold">{network ? "Can't connect" : "Couldn't load this"}</h3>
      <p className="mt-1.5 max-w-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "signal" | "ember" | "iris" | "danger"; className?: string }) {
  const tones = {
    neutral: "bg-line/60 text-ink",
    signal: "bg-signal-soft text-signal",
    ember: "bg-ember-soft text-ember",
    iris: "bg-iris-soft text-iris",
    danger: "bg-danger-soft text-danger"
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Small tooltip shown on hover and keyboard focus of its child. */
export function Tooltip({ content, children, className }: { content: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cx("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-night px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lift transition group-focus-within/tt:opacity-100 group-hover/tt:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
