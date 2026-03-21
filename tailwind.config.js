/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#080b10',
          base: '#0c1018',
          surface: '#121826',
          raised: '#19202f',
          modal: '#1e2738',
        },
        amber: {
          DEFAULT: '#e6a817',
          50:  'rgba(230,168,23,0.05)',
          100: 'rgba(230,168,23,0.10)',
          200: 'rgba(230,168,23,0.20)',
          300: 'rgba(230,168,23,0.30)',
          400: '#fbbf24',
          600: '#d97706',
          800: '#451a03',
        },
        ink: {
          DEFAULT: '#e8ecf0',
          secondary: '#8b95a3',
          muted: '#4a5568',
          faint: 'rgba(255,255,255,0.04)',
        },
        emerald: {
          DEFAULT: '#10b981',
          dim:  'rgba(16,185,129,0.15)',
          text: '#34d399',
        },
        rose: {
          DEFAULT: '#e74c3c',
          dim:  'rgba(231,76,60,0.15)',
          text: '#fb7185',
        },
        sky: {
          DEFAULT: '#38bdf8',
          dim:  'rgba(56,189,248,0.15)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs:    ['13px', '18px'],
        sm:    ['14px', '20px'],
        base:  ['16px', '24px'],
        lg:    ['18px', '26px'],
        xl:    ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
      },
      borderRadius: {
        sm:  '6px',
        DEFAULT: '8px',
        md:  '10px',
        lg:  '12px',
        xl:  '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'amber-glow': '0 0 24px rgba(230,168,23,0.18)',
        'amber-sm':   '0 0 12px rgba(230,168,23,0.12)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'modal':      '0 24px 64px rgba(0,0,0,0.6)',
        'inner-top':  'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'surface-gradient': 'linear-gradient(135deg, #121826 0%, #0f1520 100%)',
        'raised-gradient':  'linear-gradient(135deg, #19202f 0%, #141d2e 100%)',
        'amber-gradient':   'linear-gradient(135deg, #e6a817 0%, #f59e0b 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
