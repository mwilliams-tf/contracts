/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bank: {
          navy: "#0f2744",
          gold: "#c9a227",
          slate: "#64748b",
        },
      },
    },
  },
  plugins: [],
};
