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
        border: "hsl(0, 0%, 90%)",
        input: "hsl(0, 0%, 90%)",
        ring: "hsl(0, 0%, 0%)",
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(0, 0%, 0%)",
        primary: {
          DEFAULT: "hsl(0, 0%, 0%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(0, 0%, 96%)",
          foreground: "hsl(0, 0%, 0%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 0%, 20%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        muted: {
          DEFAULT: "hsl(0, 0%, 96%)",
          foreground: "hsl(0, 0%, 45%)",
        },
        accent: {
          DEFAULT: "hsl(0, 0%, 96%)",
          foreground: "hsl(0, 0%, 0%)",
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(0, 0%, 0%)",
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(0, 0%, 0%)",
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
