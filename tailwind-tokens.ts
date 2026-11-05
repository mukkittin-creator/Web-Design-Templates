/**
 * tailwind-tokens.ts — "Evrak Sihirbazı" tasarım sisteminin Tailwind karşılığı.
 * tailwind.config.ts içinde: theme.extend = { ...esTheme }
 * Tremor için: content'e "./node_modules/@tremor/**\/*.{js,ts,jsx,tsx}" ekleyin.
 *
 * shadcn/ui Button'a iki varyant ekleyin (components/ui/button.tsx → buttonVariants):
 *   magic: "bg-es-royal-600 text-white shadow-es-button hover:bg-es-royal-700 active:translate-y-px active:scale-[.99] rounded-[20px] font-bold"
 *   navy:  "bg-es-navy-900 text-white hover:bg-es-navy-800 active:translate-y-px rounded-xl font-bold"
 *   size xl: "h-14 px-6 text-base gap-2.5"
 *   outline varyantını: "border-[#C5CFDD] bg-white text-es-navy-900 hover:border-es-navy-900 hover:bg-es-surface-50 font-bold rounded-xl h-11"
 */
export const esTheme = {
  colors: {
    es: {
      "page-bg": "#EEF2F8",
      "surface-50": "#F9FAFB",
      line: "#E8EDF5", // disabled-100: ince kenar, ayraç, iskelet zemini
      "navy-900": "#1A365D",
      "navy-800": "#1E3A8A",
      "steel-500": "#3774AD",
      "royal-500": "#3B82F6",
      "royal-600": "#2563EB",
      "royal-700": "#1D4ED8",
      "turquoise-100": "#E0F7FC",
      "turquoise-500": "#00B4D8", // asla beyaz üstünde metin değil
      "ink-900": "#0F1E36",
      "ink-600": "#4B5563",
      "ink-500": "#6B7280",
      "ink-300": "#9CA3AF",
      "success-50": "#F0FDF4",
      "success-500": "#22C55E",
      "success-700": "#15803D",
      "error-50": "#FEF2F2",
      "error-600": "#DC2626",
    },
  },
  fontFamily: {
    display: ["Lexend", "Plus Jakarta Sans", "system-ui", "sans-serif"],
    sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  },
  boxShadow: {
    "es-card": "0 1px 2px 0 rgba(15,30,54,.06), 0 8px 20px -10px rgba(15,30,54,.28)",
    "es-lg": "0 10px 24px -6px rgba(15,30,54,.22)",
    "es-button": "0 8px 20px -6px rgba(59,130,246,.55)",
    "es-focus": "0 0 0 4px rgba(59,130,246,.22)",
    "es-error": "0 0 0 4px rgba(220,38,38,.14)",
  },
  borderRadius: { sm: "8px", xl: "12px", "2xl": "16px", "3xl": "28px" },
};
