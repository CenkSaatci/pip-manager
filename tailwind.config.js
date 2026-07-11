/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pip: {
          bg: "var(--pip-bg, #0b1410)",
          panel: "var(--pip-panel, #0f1f16)",
          line: "var(--pip-line, #1c3a26)",
          green: "var(--pip-green, #5fff8f)",
          greendim: "var(--pip-greendim, #2fae5e)",
          amber: "var(--pip-amber, #ffb238)",
          red: "var(--pip-red, #ff5a4e)",
        },
      },
      fontFamily: {
        mono: ["'Share Tech Mono'", "'JetBrains Mono'", "ui-monospace", "monospace"],
        display: ["'VT323'", "'Share Tech Mono'", "monospace"],
      },
      boxShadow: {
        crt: "0 0 12px rgba(95,255,143,0.35), inset 0 0 40px rgba(0,0,0,0.6)",
        glow: "0 0 6px currentColor",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: 1 },
          "92%": { opacity: 1 },
          "93%": { opacity: 0.82 },
          "94%": { opacity: 1 },
        },
        scan: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100%" },
        },
      },
      animation: {
        flicker: "flicker 6s infinite",
        scan: "scan 8s linear infinite",
      },
    },
  },
  plugins: [],
};
