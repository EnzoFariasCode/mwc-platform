import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 1. Aqui dizemos: "O padrão (sans) agora é a variável --font-poppins"
        sans: ["var(--font-poppins)", "sans-serif"],
        
        // 2. Aqui dizemos: "Quando eu usar font-futura, use a variável --font-orbitron"
        futura: ["var(--font-orbitron)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;