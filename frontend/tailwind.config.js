/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Enable dark mode using a class
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Define dark mode colors (example palette - can be customized)
      colors: {
        dark: {
          primary: "#1a202c", // Dark background
          secondary: "#2d3748", // Slightly lighter dark
          accent: "#4a5568", // Darker accent
          text: "#e2e8f0", // Light text
          "text-secondary": "#a0aec0", // Dimmer text
          border: "#4a5568", // Border color
          "primary-hover": "#2d3748",
          "button-bg": "#4299e1", // Example blue button
          "button-hover": "#2b6cb0",
        },
        // You can keep light mode colors here or define them explicitly
        // light: { ... }
      },
      // Custom fonts
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Montserrat", "system-ui", "sans-serif"],
      },
      // Custom animations
      animation: {
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "slide-in-up": "slideInUp 0.3s ease-out",
      },
      // Custom keyframes
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"), // Re-enable the forms plugin
  ],
};
