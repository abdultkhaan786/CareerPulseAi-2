import { Link } from "react-router-dom";
import { cx } from "@/lib/format";

export function Logo({ to = "/", light = false, className }: { to?: string; light?: boolean; className?: string }) {
  return (
    <Link to={to} className={cx("inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="CareerPulse home">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill={light ? "#1B2B4F" : "#0A1428"} />
        <path d="M4 17h6l3-8 5 14 3-6h7" fill="none" stroke="#2CD3C9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={cx("font-display text-[19px] font-extrabold tracking-tight", light ? "text-white" : "text-ink")}>
        CareerPulse
      </span>
    </Link>
  );
}
