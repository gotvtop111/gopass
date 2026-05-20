import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "rgb(var(--vault-bg) / <alpha-value>)",
          surface: "rgb(var(--vault-surface) / <alpha-value>)",
          border: "rgb(var(--vault-border) / <alpha-value>)",
          accent: "rgb(var(--vault-accent) / <alpha-value>)",
          muted: "rgb(var(--vault-muted) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
