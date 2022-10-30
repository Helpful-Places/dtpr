// $blue: #002684;
// $lightblue: #bae6ed;
// $red: #f04a4a;
// $lightred: #fee4e0;
// $green: #0f5153;
// $lightgreen: #bfeedb;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        'dtpr-green': {
          'lighter': '#bfeedb',
          DEFAULT: '#0f5153'
        },
        'dtpr-blue': {
          'lighter': '#bae6ed',
          DEFAULT: '#002684'
        },
        'dtpr-red': {
          'lighter': '#fee4e0',
          DEFAULT: '#f04a4a'
        }
      },
    },
    fontFamily: {
      'sans': ['Red Hat Text', 'sans-serif'],
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
