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
        // Theme System Colors (CSS Variables)
        background: 'var(--bg-primary)',
        surface: 'var(--bg-secondary)',
        surfaceTertiary: 'var(--bg-tertiary)',
        textMain: 'var(--text-main)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        brand: 'var(--brand-color)',
        brandHover: 'var(--brand-hover)',
        borderColor: 'var(--border-color)',
        success: 'var(--success-color)',
        error: 'var(--error-color)',
        warning: 'var(--warning-color)',
        sidebar: 'var(--bg-sidebar)',

        // Keep existing teal colors for backward compatibility
        teal: {
          50: '#e0f2f1',
          100: '#b2dfdb',
          500: '#009688',
          600: '#00897b',
          700: '#00838f',
          800: '#006064',
          900: '#004d40',
        }
      },
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
        'tajawal': ['Tajawal', 'sans-serif'],
        'almarai': ['Almarai', 'sans-serif'],
        'ibm': ['"IBM Plex Sans Arabic"', 'sans-serif'],
        'primary': ['var(--font-primary)', 'sans-serif'],
      }
    }
  },
  plugins: [],
};
