import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Same brand ramp as the production Case Dashboard.
        brand: {
          50: "#eff9ff",
          100: "#daeeff",
          200: "#a9dbfe",
          300: "#67bffe",
          400: "#2ea5f8",
          500: "#0083e0",
          600: "#005fa4",
          700: "#004d85",
          800: "#003961",
          900: "#00243d",
        },
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out both",
        "slide-up": "slide-up 0.22s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
