/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{html,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
