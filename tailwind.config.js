/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface:  '#FAFAF8',
        card:     '#FFFFFF',
        muted:    '#F4F4F2',
        primary:  '#0D6E6E',
        accent:   '#F5A623',
        danger:   '#E53E3E',
        success:  '#38A169',
        text: {
          DEFAULT: '#1A1A1A',
          muted:   '#6B7280',
          subtle:  '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E5E5',
          focus:   '#0D6E6E',
        }
      }
    },
  },
  plugins: [],
}
