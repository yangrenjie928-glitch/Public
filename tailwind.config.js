/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#ff4d6d",
          blue: "#3b82f6",
          yellow: "#facc15",
          green: "#22c55e",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "auth-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-8px)" },
          "75%": { transform: "translateX(8px)" },
        },
        "particle-drift": {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0.4" },
          "50%": { opacity: "0.85" },
          "100%": { transform: "translateY(-28px) translateX(12px)", opacity: "0.35" },
        },
      },
      animation: {
        pop: "pop 0.35s ease-out",
        float: "float 2.8s ease-in-out infinite",
        "auth-shake": "auth-shake 0.45s ease-in-out",
        "particle-drift": "particle-drift 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
