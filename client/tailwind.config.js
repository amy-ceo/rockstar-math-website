/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepBlue: "#001F3F",
        royalBlue: "#0047AB",
        skyBlue: "#87CEEB",
        steelBlue: "#4682B4",
        lightGray: "#EAEAEA",
        steelGray: "#6D737A",
        gray2: "#ECF6FF",
        darkTeal: "#091F28"

      },
      fontFamily: {
        sans: ['Public Sans', 'sans-serif'],
      },
      screens: {
        'lg': '991px',
        '2xl': '1400px',
      },
    },
  },
  plugins: [],
}

