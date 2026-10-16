import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

const NAMES = ["signal", "ember", "iris", "ink", "muted", "line", "surface", "danger"] as const;
type Palette = Record<(typeof NAMES)[number], string>;

/** Resolves the CSS color tokens to concrete colors for SVG chart libraries. */
export function useThemeColors(): Palette {
  const { theme } = useTheme();
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(NAMES.map(n => [n, `rgb(${style.getPropertyValue(`--${n}`).trim().split(/\s+/).join(",")})`])) as Palette;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}
