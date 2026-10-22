/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['var(--font-roboto)', 'system-ui', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // HOOX design system (Design System/hoox-guideline.png + Home mock)
        hoox: {
          brand: '#003E7E',      // Primary brand
          highlight: '#00A6E0',  // Primary highlight
          light: '#E6F4FB',      // Background light
          text: '#1F2D3D',       // Text dark
          ui: '#4FB3E3',         // Secondary UI
          support: '#0E7490',    // Secondary support
          soft: '#B7D9EB',       // Background soft
          success: '#00C896',    // Success / positive
          accent: '#F7A800',     // Accent / CTA
          // Home page UI tokens
          ink: '#0B1A6B',        // headings / titles
          navy: '#012B49',       // dark buttons
          deep: '#00263B',       // sponsor hero base
          link: '#4A78D6',       // nav + secondary text
          muted: '#6B8DE0',      // meta text
          teal: '#0B7A8C',       // live / links
          chip: '#E4F1F7',       // date chips, stat bar
          mist: '#F3F6F8',       // page background
          line: '#E2EAF4',       // card borders
        },
      },
    },
  },
  plugins: [],
}
