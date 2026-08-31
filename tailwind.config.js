/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        carvao: {
          DEFAULT: '#12181F',
          light: '#1B242F',
          lighter: '#242F3D',
        },
        metal: {
          DEFAULT: '#3A4552',
          light: '#4E5B6B',
          dark: '#2A323C',
        },
        marfim: {
          DEFAULT: '#E7E0CF',
          dim: '#C9C0A9',
        },
        ambar: {
          DEFAULT: '#D88A32',
          light: '#EDA654',
          dark: '#A96A22',
        },
        ciano: {
          DEFAULT: '#6FA8B5',
          light: '#8FC2CE',
          dim: '#4C7885',
        },
        ferrugem: {
          DEFAULT: '#B23A2E',
          light: '#D14F3F',
          dark: '#7E281F',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Oswald"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(111,168,181,0.08), 0 8px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(111,168,181,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(111,168,181,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '24px 24px',
      },
    },
  },
  plugins: [],
}
