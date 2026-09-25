import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--color-surface)",
          dim: "var(--color-surface-dim)",
          bright: "var(--color-surface-bright)",
          container: {
            lowest: "var(--color-surface-container-lowest)",
            low: "var(--color-surface-container-low)",
            DEFAULT: "var(--color-surface-container)",
            high: "var(--color-surface-container-high)",
            highest: "var(--color-surface-container-highest)",
          },
        },
        "on-surface": {
          DEFAULT: "var(--color-on-surface)",
          variant: "var(--color-on-surface-variant)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          container: "var(--color-primary-container)",
        },
        "on-primary": {
          DEFAULT: "var(--color-on-primary)",
          container: "var(--color-on-primary-container)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          container: "var(--color-secondary-container)",
        },
        "on-secondary": {
          DEFAULT: "var(--color-on-secondary)",
          container: "var(--color-on-secondary-container)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          container: "var(--color-success-container)",
        },
        "on-success": {
          DEFAULT: "var(--color-on-success)",
          container: "var(--color-on-success-container)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          container: "var(--color-error-container)",
        },
        "on-error": {
          DEFAULT: "var(--color-on-error)",
          container: "var(--color-on-error-container)",
        },
        outline: {
          DEFAULT: "var(--color-outline)",
          variant: "var(--color-outline-variant)",
        },
        border: "var(--color-border)",
        background: "var(--color-background)",
        "on-background": "var(--color-on-background)",
      },
      borderRadius: {
        input: "var(--radius-input)",
        button: "var(--radius-button)",
        card: "var(--radius-card)",
        container: "var(--radius-container)",
        pill: "var(--radius-pill)",
      },
      fontFamily: {
        montserrat: ["var(--font-montserrat)"],
        inter: ["var(--font-inter)"],
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme }: any) {
      addUtilities({
        ".text-display-lg": {
          fontFamily: theme("fontFamily.montserrat"),
          fontSize: "48px",
          lineHeight: "56px",
          fontWeight: "700",
        },
        ".text-headline-lg": {
          fontFamily: theme("fontFamily.montserrat"),
          fontSize: "32px",
          lineHeight: "40px",
          fontWeight: "700",
        },
        ".text-headline-lg-mobile": {
          fontFamily: theme("fontFamily.montserrat"),
          fontSize: "24px",
          lineHeight: "32px",
          fontWeight: "700",
        },
        ".text-headline-md": {
          fontFamily: theme("fontFamily.montserrat"),
          fontSize: "24px",
          lineHeight: "32px",
          fontWeight: "600",
        },
        ".text-body-lg": {
          fontFamily: theme("fontFamily.inter"),
          fontSize: "18px",
          lineHeight: "28px",
          fontWeight: "400",
        },
        ".text-body-md": {
          fontFamily: theme("fontFamily.inter"),
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: "400",
        },
        ".text-label-md": {
          fontFamily: theme("fontFamily.inter"),
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: "600",
        },
        ".text-label-sm": {
          fontFamily: theme("fontFamily.inter"),
          fontSize: "12px",
          lineHeight: "16px",
          fontWeight: "500",
        },
      });
    },
  ],
};

export default config;