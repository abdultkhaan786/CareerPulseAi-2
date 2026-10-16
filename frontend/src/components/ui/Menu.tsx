import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/format";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

/** Accessible dropdown menu: button toggles, arrow keys move, Escape closes. */
export function Menu({
  trigger,
  label,
  items,
  align = "right",
  header
}: {
  trigger: ReactNode;
  label: string;
  items: MenuItem[];
  align?: "left" | "right";
  header?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    root.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const els = Array.from(root.current?.querySelectorAll<HTMLElement>("[role=menuitem]") || []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      setOpen(false);
      btn.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      els[(i + 1) % els.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      els[(i - 1 + els.length) % els.length]?.focus();
    } else if (e.key === "Tab") setOpen(false);
  };

  return (
    <div className="relative" ref={root} onKeyDown={onKeyDown}>
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => setOpen(o => !o)}
        className="flex items-center rounded-lg"
      >
        {trigger}
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          className={cx(
            "absolute z-50 mt-2 min-w-[200px] animate-pop rounded-xl border border-line bg-surface p-1.5 shadow-lift",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          )}
        >
          {header && <div className="border-b border-line px-3 pb-2.5 pt-1.5">{header}</div>}
          {items.map(item => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm outline-none transition focus:bg-line/50 hover:bg-line/50",
                item.danger ? "text-danger" : "text-ink"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
