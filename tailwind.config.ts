import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orgos: {
          primary: {
            DEFAULT: "var(--orgos-primary)",
            hover: "var(--orgos-primary-hover)",
            subtle: "var(--orgos-primary-subtle)",
            border: "var(--orgos-primary-border)",
          },
          success: {
            DEFAULT: "var(--orgos-success)",
            hover: "var(--orgos-success-hover)",
            bg: "var(--orgos-success-bg)",
            border: "var(--orgos-success-border)",
          },
          warning: {
            DEFAULT: "var(--orgos-warning)",
            bg: "var(--orgos-warning-bg)",
            border: "var(--orgos-warning-border)",
          },
          danger: {
            DEFAULT: "var(--orgos-danger)",
            bg: "var(--orgos-danger-bg)",
            border: "var(--orgos-danger-border)",
          },
          bg: {
            app: "var(--orgos-bg-app)",
            surface: "var(--orgos-bg-surface)",
            dim: "var(--orgos-bg-surface-dim)",
            sidebar: "var(--orgos-bg-sidebar)",
            "sidebar-active": "var(--orgos-bg-sidebar-active)",
          },
          border: {
            light: "var(--orgos-border-light)",
            medium: "var(--orgos-border-medium)",
            dark: "var(--orgos-border-dark)",
          },
          text: {
            primary: "var(--orgos-text-primary)",
            secondary: "var(--orgos-text-secondary)",
            tertiary: "var(--orgos-text-tertiary)",
            inverse: "var(--orgos-text-inverse)",
            sidebar: "var(--orgos-text-sidebar)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--orgos-font-sans)"],
        mono: ["var(--orgos-font-mono)"],
      },
      borderRadius: {
        sm: "var(--orgos-radius-sm)",
        md: "var(--orgos-radius-md)",
      },
    },
  },
  plugins: [],
};
export default config;
