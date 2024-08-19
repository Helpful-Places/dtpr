import { darkMode } from '#tailwind-config'
import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        'dtpr-green': {
          DEFAULT: '#0f5153',
          '50': '#effefb',
          '100': '#c9fef8',
          '200': '#92fdf2',
          '300': '#54f4eb',
          '400': '#21e0db',
          '500': '#08c4c1',
          '600': '#039d9e',
          '700': '#087b7d',
          '800': '#0c6063',
          '900': '#0f5153',
          '950': '#012e32',
        },
        'dtpr-blue': {
          DEFAULT: '#002684',
          '50': '#e4f6ff',
          '100': '#cfeeff',
          '200': '#a8ddff',
          '300': '#74c5ff',
          '400': '#3e99ff',
          '500': '#136cff',
          '600': '#0059ff',
          '700': '#0059ff',
          '800': '#0050e4',
          '900': '#0038b0',
          '950': '#002684',
        },
        'dtpr-red': {
          DEFAULT: '#f04a4a',
          '50': '#fef2f2',
          '100': '#fee2e2',
          '200': '#fecaca',
          '300': '#fca5a5',
          '400': '#f87171',
          '500': '#f04a4a',
          '600': '#dc2626',
          '700': '#b91c1c',
          '800': '#991b1b',
          '900': '#7f1d1d',
          '950': '#450a0a',
        }
      },
    },
    fontFamily: {
      'sans': ['Red Hat Text', 'sans-serif'],
    },
  }
}