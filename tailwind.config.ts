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
      },
    },
  },
  plugins: [],
};

export default config;
