import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "var(--vault-bg)",
          surface: "var(--vault-surface)",
          border: "var(--vault-border)",
          accent: "var(--vault-accent)",
          muted: "var(--vault-muted)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
