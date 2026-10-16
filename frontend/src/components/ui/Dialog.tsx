import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";
import { cx } from "@/lib/format";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  size?: "sm" | "md";
}

export function Dialog({ open, onClose, title, description, children, size = "md" }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const el = panel.current;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])") || []).filter(
        n => !n.hasAttribute("disabled")
      );
    (focusables()[1] || focusables()[0])?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      (lastFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex animate-fadeIn items-end justify-center bg-night/60 p-4 backdrop-blur-[2px] sm:items-center"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cx(
          "card w-full animate-pop p-6 shadow-lift",
          size === "sm" ? "max-w-md" : "max-w-lg"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="dialog-title" className="text-xl font-bold">
              {title}
            </h2>
            {description && <div className="mt-1.5 text-muted">{description}</div>}
          </div>
          <button onClick={onClose} className="-mr-2 -mt-1 rounded-lg p-2 text-muted hover:bg-line/50 hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, loading }: ConfirmProps) {
  return (
    <Dialog open={open} onClose={loading ? () => {} : onClose} title={title} size="sm">
      <div className="-mt-2 flex gap-3 rounded-xl bg-danger-soft p-3 text-sm text-ink">
        <AlertTriangle className="h-5 w-5 shrink-0 text-danger" aria-hidden />
        <div>{description}</div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
