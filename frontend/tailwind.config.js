/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1E40AF',
          accent: '#EAB308',
          background: '#F8FAFC',
          text: '#0F172A',
          success: '#10B981',
          error: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        brand: '0 20px 45px -20px rgba(30, 64, 175, 0.45)'
      }
    }
  },
  plugins: []
};
