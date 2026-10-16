import { useEffect, useMemo, useRef, useState } from "react";
import type { SkillDemand } from "@/lib/types";
import { norm } from "@/lib/skills";
import { plural } from "@/lib/format";

interface Props {
  skills: SkillDemand[];
  userSkills?: string[];
  maxBeats?: number;
  height?: number;
  /** "dark" for the navy hero, "light" for panels */
  tone?: "light" | "dark";
  onSelect?: (skill: string) => void;
}

/**
 * ECG-style trace where each heartbeat is one in-demand skill; spike height = number of listings.
 * Sized to its container (ResizeObserver) so labels never stretch.
 */
export function PulseTrace({ skills, userSkills, maxBeats = 8, height = 200, tone = "light", onSelect }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const count = Math.max(3, Math.min(maxBeats, Math.floor(width / 92)));
  const h = width < 520 ? Math.round(height * 0.8) : height;
  const base = h * 0.7;
  const top = skills.slice(0, count);
  const max = Math.max(1, ...top.map(s => s.demand));
  const have = useMemo(() => new Set((userSkills || []).map(norm)), [userSkills]);
  const sig = top.map(s => `${s.skill}:${s.demand}`).join("|");

  const { d, beats } = useMemo(() => {
    if (!width) return { d: "", beats: [] as { x: number; y: number; s: SkillDemand }[] };
    if (!top.length) return { d: `M0 ${base} L${width} ${base}`, beats: [] };
    const step = width / (top.length + 0.4);
    const k = Math.min(1, step / 115);
    let path = `M0 ${base}`;
    const b: { x: number; y: number; s: SkillDemand }[] = [];
    top.forEach((s, i) => {
      const x = step * (i + 0.7);
      const amp = 20 + (s.demand / max) * (base - 42);
      path += ` L${x - 34 * k} ${base} Q${x - 27 * k} ${base - 9} ${x - 20 * k} ${base} L${x - 9 * k} ${base}`;
      path += ` L${x - 4 * k} ${base + 7} L${x} ${base - amp} L${x + 5 * k} ${base + 15} L${x + 11 * k} ${base}`;
      path += ` L${x + 20 * k} ${base} Q${x + 30 * k} ${base - 12} ${x + 40 * k} ${base}`;
      b.push({ x, y: base - amp, s });
    });
    path += ` L${width} ${base}`;
    return { d: path, beats: b };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, width, base]);

  const dark = tone === "dark";
  const label = top.length ? `Most requested skills: ${top.map(s => `${s.skill}, ${plural(s.demand, "listing")}`).join("; ")}` : "No listings yet";

  return (
    <div ref={wrap} className="relative w-full" style={{ height: h }}>
      {width > 0 && (
        <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role={onSelect ? "group" : "img"} aria-label={label} className={`overflow-visible ${dark ? "text-signal-bright" : "text-signal"}`}>
          <defs>
            <linearGradient id={`fade-${tone}`} x1="0" x2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.15" />
              <stop offset="0.08" stopColor="currentColor" stopOpacity="1" />
              <stop offset="0.92" stopColor="currentColor" stopOpacity="1" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0.15" />
            </linearGradient>
            <filter id={`glow-${tone}`} x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line x1="0" x2={width} y1={base} y2={base} strokeDasharray="2 6" className={dark ? "stroke-white/15" : "stroke-line"} />
          <g>
            <path
              key={sig + width}
              d={d}
              fill="none"
              stroke={`url(#fade-${tone})`}
              strokeWidth={2.4}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              filter={dark ? `url(#glow-${tone})` : undefined}
              className="animate-draw"
            />
          </g>
          {beats.map((b, i) => {
            const mine = have.has(norm(b.s.skill));
            const isActive = active === i;
            const name = b.s.skill.length > 13 ? `${b.s.skill.slice(0, 12)}…` : b.s.skill;
            return (
              <g
                key={b.s.skill}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? "button" : undefined}
                aria-label={onSelect ? `${b.s.skill}: ${plural(b.s.demand, "listing")}${userSkills ? (mine ? ", on your profile" : ", not on your profile") : ""}` : undefined}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => onSelect?.(b.s.skill)}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelect?.(b.s.skill)}
                className={onSelect ? "cursor-pointer outline-none" : "outline-none"}
                style={{ animation: `fadeIn .4s ${1.6 + i * 0.06}s both` }}
              >
                <rect x={b.x - 40} y={0} width={80} height={h} fill="transparent" />
                <line x1={b.x} x2={b.x} y1={b.y} y2={base} strokeDasharray="2 3" opacity={isActive ? 1 : 0} className={dark ? "stroke-white/40" : "stroke-muted/50"} />
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={isActive ? 7 : 5}
                  className={
                    userSkills
                      ? mine
                        ? "fill-signal"
                        : "fill-ember"
                      : dark
                        ? "fill-[#F5A650]"
                        : "fill-ember"
                  }
                  stroke={dark ? "#0A1428" : "rgb(var(--surface))"}
                  strokeWidth={2.5}
                  style={{ transition: "r .15s" }}
                />
                <text
                  x={b.x}
                  y={Math.max(14, b.y - 14)}
                  textAnchor="middle"
                  className={dark ? "fill-white" : "fill-ink"}
                  style={{ font: "600 13px 'IBM Plex Sans', sans-serif" }}
                >
                  {name}
                </text>
                <text
                  x={b.x}
                  y={base + 30}
                  textAnchor="middle"
                  className={dark ? "fill-night-ink" : "fill-muted"}
                  style={{ font: "500 12px 'IBM Plex Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}
                >
                  {isActive ? plural(b.s.demand, "listing") : b.s.demand}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
