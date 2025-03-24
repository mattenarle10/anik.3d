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
        sans: ['Neue Montreal', 'sans-serif'],
        montreal: ['Neue Montreal', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'slide-in-left': 'slideInLeft 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slide-in-right': 'slideInRight 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%) scale(0.9)', opacity: 0 },
          '70%': { transform: 'translateX(3%)', opacity: 1 },
          '100%': { transform: 'translateX(0) scale(1)', opacity: 1 },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%) scale(0.9)', opacity: 0 },
          '70%': { transform: 'translateX(-3%)', opacity: 1 },
          '100%': { transform: 'translateX(0) scale(1)', opacity: 1 },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        background: '#000000',
        foreground: '#FFFFFF',
      },
    },
  },
  plugins: [],
};
