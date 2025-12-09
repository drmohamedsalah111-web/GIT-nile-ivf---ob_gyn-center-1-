export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './App.tsx',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#e0f2f1',
          100: '#b2dfdb',
          500: '#009688',
          600: '#00897b',
          700: '#00838f',
          800: '#006064',
          900: '#004d40',
        }
      }
    }
  },
  plugins: [],
};
