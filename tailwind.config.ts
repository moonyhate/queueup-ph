import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#122420",
        surface: "#F7F3E8",
        surface2: "#EFE8D6",
        court: {
          DEFAULT: "#1F5C4F",
          light: "#2C8570",
          dark: "#0F332B",
        },
        ball: "#D8F13A",
        progress: "#2F5FE0",
        rest: "#E2A63B",
        waiting: "#8A8577",
        line: "#D9D2BC",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
