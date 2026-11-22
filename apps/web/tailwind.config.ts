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
        background: "var(--background)",
        foreground: "var(--foreground)",
        baki: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#b91c1c",
        },
        joma: {
          light: "#dcfce7",
          DEFAULT: "#22c55e",
          dark: "#15803d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
