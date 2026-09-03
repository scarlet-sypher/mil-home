import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2f7",
          100: "#d7e0eb",
          300: "#93a9c4",
          700: "#1c3a5e",
          800: "#152c47",
          900: "#0e1f33",
        },
        // Field-HQ theme tokens (dark, photo-driven restyle) — reused across all stages.
        accent: {
          DEFAULT: "#14b8a6",
          dark: "#0f766e",
          light: "#5eead4",
        },
        "base-dark": {
          DEFAULT: "#0b1f1c",
          alt: "#0f172a",
        },
        "sidebar-base": "#0b3d34",
        // Page background for the light-themed table pages: near-white with a
        // faint green undertone, matching the app's dark-green/teal theme.
        "page-bg": "#f4f8f6",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
