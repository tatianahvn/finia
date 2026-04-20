// tailwind.config.js — Finia Design System
// Paleta: Violeta Cálido · Light & Dark
// Generado: Abril 2026
// NOTA: Los nombres de llave son idénticos al config anterior.
//       Solo se actualizaron los valores hex. Tus clases Tailwind
//       existentes (bg-violet-600, text-neutral-900, etc.) NO cambian.

const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {

        // ─────────────────────────────────────────────
        // BRAND PRIMARY — Violeta Cálido
        // Antes: violeta genérico  →  Ahora: #7C3AED family
        // Clases: bg-violet-*, text-violet-*, border-violet-*
        // ─────────────────────────────────────────────
        violet: {
          50:  '#FDF4FF',   // fondo tintado, hover states
          100: '#F3E8FF',   // tag bg, badge bg
          200: '#E9D5FF',   // borde suave, divisores
          300: '#D8B4FE',   // disabled text, placeholder
          400: '#C084FC',   // texto brand en dark
          500: '#A855F7',   // bar chart dark, secondary dark
          600: '#9333EA',   // btn dark, accent dark
          700: '#7C3AED',   // PRIMARY — botones, logo, títulos (light)
          800: '#6D28D9',   // hover btn light
          900: '#4C1D95',   // texto ultra-dark, énfasis
          DEFAULT: '#7C3AED',
        },

        // ─────────────────────────────────────────────
        // NEUTRALS
        // Mantiene nombres. Ahora con tinte violeta frío.
        // Clases: bg-neutral-*, text-neutral-*
        // ─────────────────────────────────────────────
        neutral: {
          50:  '#FAFAFA',   // bg-surface light
          100: '#F4F0FF',   // bg-subtle light (tinte violeta muy suave)
          200: '#EDE8FF',   // bordes light
          400: '#A1A1AA',   // texto muted light
          900: '#18181B',   // texto primary light
          dark: {
            50:  '#0F0B1A',   // bg-base dark
            100: '#170F28',   // bg-surface dark
            200: '#1E1535',   // bg-elevated dark (cards)
            300: '#231A3D',   // bg-subtle dark
            400: '#2D2249',   // border dark
            500: '#4C3575',   // border-strong dark
            900: '#F4F0FF',   // texto primary dark
          },
        },

        // ─────────────────────────────────────────────
        // SEMÁNTICOS — mismos nombres, valores ajustados
        // Se mantienen lavanda, durazno, menta, rosa, celeste, ambar
        // porque ya los tienes en componentes.
        // Ahora representan también los colores de estado del sistema.
        // ─────────────────────────────────────────────

        // Lavanda → Surface/muted brand (bg tarjetas, sidebar active)
        lavanda: {
          light:   '#F3E8FF',   // sidebar active bg, tag bg
          DEFAULT: '#7C3AED',   // = violet-700 (alias conveniente)
          dark:    '#231A3D',   // bg-subtle dark
        },

        // Durazno → Alertas / Gastos altos (before: generic)
        durazno: {
          light:   '#FFF1EC',   // bg chip gasto
          DEFAULT: '#E05A2B',   // texto/ícono gasto light
          dark:    '#FF7A4D',   // texto/ícono gasto dark
        },

        // Menta → Positivo / Ingresos / Ahorro
        menta: {
          light:   '#ECFDF5',   // bg chip ingreso
          DEFAULT: '#059669',   // texto ingreso light
          dark:    '#34D399',   // texto ingreso dark
        },

        // Rosa → Moda / Alertas suaves
        rosa: {
          light:   '#FDF2F8',   // bg chip moda
          DEFAULT: '#BE185D',   // texto moda light
          dark:    '#F472B6',   // texto moda dark
        },

        // Celeste → Hogar / Info
        celeste: {
          light:   '#EFF6FF',   // bg chip hogar
          DEFAULT: '#2563EB',   // texto hogar light
          dark:    '#60A5FA',   // texto hogar dark
        },

        // Ambar → Ocio / Warning
        ambar: {
          light:   '#FFFBEB',   // bg chip warning
          DEFAULT: '#D97706',   // texto warning light
          dark:    '#FCD34D',   // texto warning dark
        },

        // ─────────────────────────────────────────────
        // CATEGORÍAS DE GASTOS — NUEVAS
        // Para gráficas donut/bar. Usar con:
        //   bg-cat-food-light / dark text-cat-food-light / dark
        // ─────────────────────────────────────────────
        cat: {
          food: {
            light:    '#E05A2B',
            dark:     '#FF7A4D',
            'bg-light': '#FFF1EC',
            'bg-dark':  '#1F1108',
          },
          home: {
            light:    '#2563EB',
            dark:     '#60A5FA',
            'bg-light': '#EFF6FF',
            'bg-dark':  '#080F1F',
          },
          transport: {
            light:    '#0D9488',
            dark:     '#2DD4BF',
            'bg-light': '#F0FDFA',
            'bg-dark':  '#051A18',
          },
          health: {
            light:    '#DC2626',
            dark:     '#F87171',
            'bg-light': '#FEF2F2',
            'bg-dark':  '#1F0808',
          },
          leisure: {
            light:    '#D97706',
            dark:     '#FCD34D',
            'bg-light': '#FFFBEB',
            'bg-dark':  '#1F1708',
          },
          education: {
            light:    '#7C3AED',
            dark:     '#A78BFA',
            'bg-light': '#F5F3FF',
            'bg-dark':  '#130D22',
          },
          savings: {
            light:    '#059669',
            dark:     '#34D399',
            'bg-light': '#ECFDF5',
            'bg-dark':  '#05160F',
          },
          fashion: {
            light:    '#BE185D',
            dark:     '#F472B6',
            'bg-light': '#FDF2F8',
            'bg-dark':  '#1A0813',
          },
          tech: {
            light:    '#4F46E5',
            dark:     '#818CF8',
            'bg-light': '#EEF2FF',
            'bg-dark':  '#0D0B22',
          },
          other: {
            light:    '#78716C',
            dark:     '#A8A29E',
            'bg-light': '#F5F5F4',
            'bg-dark':  '#141312',
          },
        },

      },

      // ─────────────────────────────────────────────
      // BACKGROUNDS semánticos (para bg-base, bg-surface etc.)
      // Úsalos con CSS variables en globals.css para máxima
      // compatibilidad con shadcn/ui
      // ─────────────────────────────────────────────
      backgroundColor: ({ theme }) => ({
        ...theme('colors'),
        base:     'var(--bg-base)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        subtle:   'var(--bg-subtle)',
        accent:   'var(--bg-accent)',
      }),

      textColor: ({ theme }) => ({
        ...theme('colors'),
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        brand:     'var(--text-brand)',
        'on-accent': 'var(--text-on-accent)',
      }),

      borderColor: ({ theme }) => ({
        ...theme('colors'),
        default: 'var(--border-default)',
        strong:  'var(--border-strong)',
      }),

      // ─────────────────────────────────────────────
      // SOMBRAS con tinte violeta
      // ─────────────────────────────────────────────
      boxShadow: {
        'card':     '0 1px 3px rgba(124,58,237,0.06), 0 4px 16px rgba(124,58,237,0.04)',
        'elevated': '0 8px 32px rgba(124,58,237,0.12)',
        'btn':      '0 2px 8px rgba(124,58,237,0.35)',
        'card-dark':'0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
      },

      // ─────────────────────────────────────────────
      // BORDER RADIUS — sistema consistente
      // ─────────────────────────────────────────────
      borderRadius: {
        'xs':  '4px',
        'sm':  '6px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '20px',
      },

    },
  },
  plugins: [],
}