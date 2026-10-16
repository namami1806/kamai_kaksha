/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        butter: '#FBE7A1',
        'butter-light': '#FFF8D9',
        lavender: '#E4D8FA',
        'lavender-light': '#F5F0FF',
        leaf: '#A8D26B',
        'leaf-light': '#E8F5D6',
        rose: '#E8A6D8',
        'rose-light': '#FBEBF6',
        sky: '#8EC5F2',
        'sky-light': '#E6F3FD',
        ink: '#1F2540',
        'ink-muted': '#363E5C',
        primary: '#4A5AE8',
        'primary-hover': '#3B4BD0',
        'coin-gold': '#F5B82E',
        'coin-shine': '#FFE27A',
      },
      borderRadius: {
        '28': '28px',
        '32': '32px',
      },
      fontFamily: {
        sans: ['Poppins', 'Baloo 2', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        display: ['Baloo 2', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        'bento': '0 8px 30px rgba(31, 37, 64, 0.06)',
        'bento-hover': '0 14px 40px rgba(31, 37, 64, 0.12)',
        'pill': '0 4px 14px rgba(31, 37, 64, 0.05)',
      }
    },
  },
  plugins: [],
}
