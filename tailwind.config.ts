import type { Config } from "tailwindcss";
import { esTheme } from "./tailwind-tokens";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      ...esTheme,
      colors: { ...esTheme.colors },
      fontFamily: { ...esTheme.fontFamily },
    },
  },
  plugins: [],
};

export default config;
