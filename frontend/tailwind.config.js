/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1B2430",
          light: "#293244",
          soft: "#4A5568",
        },
        paper: "#F5F6F3",
        teal: {
          DEFAULT: "#3A6B72",
          dark: "#2A4F55",
          light: "#E7EFEE",
        },
        coral: {
          DEFAULT: "#E4572E",
          light: "#FCEAE3",
        },
        gold: {
          DEFAULT: "#D4A94F",
          light: "#FBF2DE",
        },
        sage: {
          DEFAULT: "#4C7A5A",
          light: "#E7F0EA",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,36,48,0.06), 0 4px 10px rgba(27,36,48,0.06)",
        stacked: "2px 3px 0 rgba(27,36,48,0.08), 4px 6px 0 rgba(27,36,48,0.04)",
        pop: "0 8px 30px rgba(27,36,48,0.16)",
      },
    },
  },
  plugins: [],
};
