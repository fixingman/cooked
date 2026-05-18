import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50:  "#FFFEF9",
          100: "#FAF7F2",
          200: "#F5F0E8",
          300: "#EDE5D8",
          400: "#DDD0BA",
        },
        ink: {
          900: "#1A1208",
          700: "#3D3020",
          500: "#7A6A52",
          300: "#BBA98E",
          100: "#E8DFD0",
        },
        saffron: {
          300: "#FBCE85",
          400: "#F59E3F",
          500: "#E8890C",
          600: "#C97108",
          700: "#A45A06",
        },
        sage: {
          100: "#E8EDE5",
          200: "#D1DCCC",
          300: "#A8B89A",
          400: "#8AA87B",
          500: "#6B8C5F",
          600: "#527046",
          700: "#3D5434",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "timer-xl": ["6rem",   { lineHeight: "1",    letterSpacing: "-0.03em", fontWeight: "300" }],
        "timer-lg": ["4.5rem", { lineHeight: "1",    letterSpacing: "-0.025em", fontWeight: "300" }],
        "timer-md": ["3rem",   { lineHeight: "1",    letterSpacing: "-0.02em", fontWeight: "300" }],
        "display":  ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "heading":  ["2rem",   { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "title":    ["1.375rem", { lineHeight: "1.3",letterSpacing: "-0.01em" }],
        "label-lg": ["0.875rem", { lineHeight: "1.4",letterSpacing: "0.06em",  fontWeight: "600" }],
        "label":    ["0.75rem",  { lineHeight: "1.4",letterSpacing: "0.08em",  fontWeight: "600" }],
      },
      borderRadius: {
        "card":  "1.25rem",
        "chip":  "9999px",
        "panel": "2rem",
        "xl2":   "1.5rem",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top":    "env(safe-area-inset-top)",
        "nav-h":       "4rem",
      },
      keyframes: {
        slideUp: {
          "0%":   { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(107, 140, 95, 0.4)" },
          "50%":      { boxShadow: "0 0 0 12px rgba(107, 140, 95, 0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "slide-up":   "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in":    "fadeIn 0.3s ease forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "shimmer":    "shimmer 2s linear infinite",
      },
      boxShadow: {
        "card":     "0 2px 12px rgba(26, 18, 8, 0.06), 0 1px 3px rgba(26, 18, 8, 0.04)",
        "card-md":  "0 4px 24px rgba(26, 18, 8, 0.10), 0 1px 4px rgba(26, 18, 8, 0.06)",
        "card-lg":  "0 12px 48px rgba(26, 18, 8, 0.14), 0 2px 8px rgba(26, 18, 8, 0.08)",
        "glow-sage":"0 0 0 3px rgba(107, 140, 95, 0.3)",
        "inset-top":"inset 0 2px 8px rgba(26, 18, 8, 0.06)",
      },
      backgroundImage: {
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        "hero-scrim": "linear-gradient(to top, rgba(26,18,8,0.85) 0%, rgba(26,18,8,0.3) 50%, transparent 100%)",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
        "snap":   "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};

export default config;
