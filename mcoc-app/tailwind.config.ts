import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Canonical MCOC class colors — sampled from the in-game UI.
        cosmic: { DEFAULT: "#f6c83a", deep: "#8c6d10", glow: "#fff2b8" },
        tech: { DEFAULT: "#3aaaf6", deep: "#0e4f80", glow: "#bce2ff" },
        mutant: { DEFAULT: "#f6a23a", deep: "#8c4f10", glow: "#ffd9a8" },
        skill: { DEFAULT: "#f6453a", deep: "#7a1410", glow: "#ffb8b3" },
        science: { DEFAULT: "#3af67a", deep: "#0e6b2e", glow: "#b8ffce" },
        mystic: { DEFAULT: "#b53af6", deep: "#52107a", glow: "#e6b8ff" },
        ink: { DEFAULT: "#0a0a12", soft: "#15151f", mid: "#22222e" },
        chrome: { DEFAULT: "#e6e6ef", soft: "#9c9caa", dim: "#5a5a68" },
      },
      fontFamily: {
        display: ["Rajdhani", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
