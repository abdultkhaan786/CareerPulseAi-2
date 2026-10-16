/** @type {import('tailwindcss').Config} */
const v = name => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: v("paper"),
        surface: v("surface"),
        raised: v("raised"),
        line: v("line"),
        ink: v("ink"),
        muted: v("muted"),
        night: { DEFAULT: "#0A1428", 2: "#111E3A", 3: "#1B2B4F", ink: "#C5D0E6" },
        signal: { DEFAULT: v("signal"), soft: v("signal-soft"), bright: "#2CD3C9" },
        ember: { DEFAULT: v("ember"), soft: v("ember-soft") },
        iris: { DEFAULT: v("iris"), soft: v("iris-soft") },
        danger: { DEFAULT: v("danger"), soft: v("danger-soft") }
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"]
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
      boxShadow: {
        card: "0 1px 2px rgb(16 28 54 / 0.04), 0 4px 16px -4px rgb(16 28 54 / 0.06)",
        lift: "0 2px 4px rgb(16 28 54 / 0.05), 0 16px 32px -12px rgb(16 28 54 / 0.18)",
        glow: "0 0 0 1px rgb(44 211 201 / 0.25), 0 8px 30px -6px rgb(44 211 201 / 0.35)"
      },
      keyframes: {
        draw: { to: { strokeDashoffset: "0" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        pop: { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "none" } },
        slideIn: { from: { transform: "translateX(-100%)" }, to: { transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        beat: {
          "0%": { boxShadow: "0 0 0 0 rgb(19 169 162 / .5)" },
          "70%": { boxShadow: "0 0 0 8px rgb(19 169 162 / 0)" },
          "100%": { boxShadow: "0 0 0 0 rgb(19 169 162 / 0)" }
        }
      },
      animation: {
        draw: "draw 2.4s cubic-bezier(.6,.1,.3,1) forwards",
        fadeIn: "fadeIn .2s ease both",
        rise: "rise .25s ease both",
        pop: "pop .18s ease both",
        slideIn: "slideIn .25s ease both",
        beat: "beat 2.4s infinite"
      }
    }
  },
  plugins: []
};
