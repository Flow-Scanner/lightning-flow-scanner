const production = !process.env.ROLLUP_WATCH;
module.exports = {
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  },
  theme: {
    extend: {
      colors: {
        primary: '#0e639c',
        highlight: '#3794ff',
        screen: '#1e1e1e',
      },
    },
  },
  plugins: [],
  content: ['./webviews/**/*.svelte'],
};