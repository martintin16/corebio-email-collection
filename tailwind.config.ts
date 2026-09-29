import type { Config } from "tailwindcss";

// Tokens del Design System aprobado. Centralizados acá: ningún componente
// debería declarar un hex, un tamaño de fuente o un radio "suelto".
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
        },
        primary: {
          DEFAULT: "#0F766E",
          100: "#CCFBF1",
          300: "#5EEAD4",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
        },
        success: { DEFAULT: "#166534", bg: "#DCFCE7" },
        warning: { DEFAULT: "#92400E", bg: "#FEF3C7" },
        danger: { DEFAULT: "#DC2626", bg: "#FEE2E2", text: "#991B1B" },
        info: { DEFAULT: "#1E40AF", bg: "#DBEAFE" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "20px" }],
        md: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
