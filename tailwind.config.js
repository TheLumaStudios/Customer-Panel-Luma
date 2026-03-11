/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#E5E7EB",
        input: "#F9FAFB",
        ring: "#4F46E5",
        background: "#FAFBFC",
        foreground: "#111827",
        primary: {
          DEFAULT: "#4F46E5",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F9FAFB",
          foreground: "#111827",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#4F46E5",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
}
