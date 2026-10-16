import { useId, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { norm } from "@/lib/skills";
import { cx } from "@/lib/format";

interface Props {
  value: string[];
  onChange: (skills: string[]) => void;
  /** Known skills (from analytics) for autocomplete and quick-add */
  suggestions?: string[];
  label: string;
  hint?: string;
  error?: string;
  max?: number;
}

export function SkillInput({ value, onChange, suggestions = [], label, hint, error, max = 50 }: Props) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const id = useId();
  const have = useMemo(() => new Set(value.map(norm)), [value]);

  const matches = useMemo(() => {
    const q = norm(text);
    if (!q) return [];
    return suggestions.filter(s => !have.has(norm(s)) && norm(s).includes(q)).slice(0, 6);
  }, [text, suggestions, have]);

  const quick = suggestions.filter(s => !have.has(norm(s))).slice(0, 6);

  const add = (raw: string) => {
    const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
    const next = [...value];
    const seen = new Set(have);
    for (const p of parts) {
      if (p.length > 40 || seen.has(norm(p)) || next.length >= max) continue;
      // Reuse the canonical spelling if this skill already exists in listings
      next.push(suggestions.find(s => norm(s) === norm(p)) || p);
      seen.add(norm(p));
    }
    onChange(next);
    setText("");
    setHi(0);
  };

  const remove = (s: string) => onChange(value.filter(v => v !== s));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && matches.length) {
      e.preventDefault();
      setOpen(true);
      setHi(h => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp" && matches.length) {
      e.preventDefault();
      setHi(h => (h - 1 + matches.length) % matches.length);
    } else if ((e.key === "Enter" || e.key === ",") && text.trim()) {
      e.preventDefault();
      add(open && matches[hi] ? matches[hi] : text);
    } else if (e.key === "Backspace" && !text && value.length) {
      remove(value[value.length - 1]);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <div
          className={cx(
            "flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-xl border bg-surface p-1.5 transition focus-within:border-signal focus-within:ring-4 focus-within:ring-signal/15",
            error ? "border-danger" : "border-line"
          )}
        >
          {value.map(s => (
            <span key={s} className="inline-flex animate-pop items-center gap-1 rounded-lg bg-signal-soft py-1 pl-2.5 pr-1 text-sm font-medium text-ink">
              {s}
              <button type="button" onClick={() => remove(s)} className="rounded p-0.5 text-muted hover:bg-black/5 hover:text-danger" aria-label={`Remove ${s}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <input
            id={id}
            value={text}
            onChange={e => {
              setText(e.target.value);
              setOpen(true);
              setHi(0);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={value.length ? "Add another…" : "Type a skill and press Enter"}
            className="min-w-[140px] flex-1 bg-transparent px-2 py-1 text-[15px] outline-none placeholder:text-muted/70"
            role="combobox"
            aria-expanded={open && matches.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={open && matches[hi] ? `${id}-opt-${hi}` : undefined}
            aria-describedby={hint ? `${id}-hint` : undefined}
          />
        </div>
        {open && matches.length > 0 && (
          <ul id={`${id}-list`} role="listbox" className="absolute z-30 mt-1.5 w-full animate-pop overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lift">
            {matches.map((m, i) => (
              <li
                key={m}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === hi}
                onMouseDown={e => {
                  e.preventDefault();
                  add(m);
                }}
                onMouseEnter={() => setHi(i)}
                className={cx("cursor-pointer px-3.5 py-2 text-sm", i === hi && "bg-signal-soft")}
              >
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {quick.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">Popular in listings</span>
          {quick.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:border-signal hover:bg-signal-soft"
            >
              <Plus className="h-3 w-3" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
