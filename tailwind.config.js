/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F9F5',
          100: '#CCF3EB',
          200: '#99E7D7',
          300: '#66DAC3',
          400: '#33CEAF',
          500: '#1CC29F', // Splitwise primary green
          600: '#169B7F',
          700: '#10745F',
          800: '#0B4E3F',
          900: '#05271F'
        },
        secondary: {
          50: '#F0F2F5',
          100: '#E1E5EB',
          200: '#C2CAD6',
          300: '#A4B0C2',
          400: '#8696AD',
          500: '#677C99',
          600: '#53637A',
          700: '#3E4A5C',
          800: '#29323D',
          900: '#15191F'
        },
        accent: {
          50: '#FFF2E6',
          100: '#FFE5CC',
          200: '#FFCA99',
          300: '#FFB066',
          400: '#FF9533',
          500: '#FF7A00',
          600: '#CC6200',
          700: '#994900',
          800: '#663100',
          900: '#331800'
        },
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};