import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Define custom screens for true mobile-first approach
    screens: {
      // Mobile is default (0-767px)
      'sm': '640px',     // Small mobile devices
      'md': '768px',     // Tablet
      'lg': '1024px',    // Desktop
      'xl': '1280px',    // Large desktop
      '2xl': '1440px',   // Extra large desktop
      '3xl': '1920px',   // Full HD and above
    },
    extend: {
      // Container configurations
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',    // Mobile
          sm: '1.5rem',
          md: '2rem',         // Tablet
          lg: '3rem',         // Desktop
          xl: '4rem',
          '2xl': '5rem',      // Large desktop
        },
        screens: {
          sm: '100%',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1440px',
        },
      },
      // Typography scaling
      fontSize: {
        // Mobile-first font sizes
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.875rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
        '5xl': ['3rem', { lineHeight: '1' }],            // 48px
        // Responsive sizes
        'responsive-xs': ['0.75rem', {
          lineHeight: '1rem',
          '@media (min-width: 768px)': {
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
          },
        }],
        'responsive-sm': ['0.875rem', {
          lineHeight: '1.25rem',
          '@media (min-width: 768px)': {
            fontSize: '1rem',
            lineHeight: '1.5rem',
          },
        }],
        'responsive-base': ['1rem', {
          lineHeight: '1.5rem',
          '@media (min-width: 768px)': {
            fontSize: '1.125rem',
            lineHeight: '1.75rem',
          },
        }],
        'responsive-lg': ['1.125rem', {
          lineHeight: '1.75rem',
          '@media (min-width: 768px)': {
            fontSize: '1.25rem',
            lineHeight: '1.875rem',
          },
          '@media (min-width: 1024px)': {
            fontSize: '1.5rem',
            lineHeight: '2rem',
          },
        }],
        'responsive-xl': ['1.25rem', {
          lineHeight: '1.875rem',
          '@media (min-width: 768px)': {
            fontSize: '1.5rem',
            lineHeight: '2rem',
          },
          '@media (min-width: 1024px)': {
            fontSize: '1.875rem',
            lineHeight: '2.25rem',
          },
        }],
      },
      spacing: {
        // Mobile-first spacing
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        // Content max-widths for different breakpoints
        'content-sm': '640px',
        'content-md': '768px',
        'content-lg': '1024px',
        'content-xl': '1280px',
        'content-2xl': '1536px',
      },
      minHeight: {
        'touch': '44px',  // Minimum touch target size
        'touch-lg': '48px',  // Larger touch targets
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
