const path = require('path');

function tryRequire(name) {
  try {
    // Prefer packages installed under client/node_modules when available
    const clientNodeModules = path.join(__dirname, 'client', 'node_modules');
    const resolved = require.resolve(name, { paths: [clientNodeModules, __dirname] });
    return require(resolved);
  } catch (e) {
    return null;
  }
}

const plugins = {};
// Prefer the new PostCSS adapter package when available
const tailwindPostcss = tryRequire('@tailwindcss/postcss') || tryRequire('tailwindcss');
const autoprefixer = tryRequire('autoprefixer');
if (tailwindPostcss) plugins['@tailwindcss/postcss'] = tailwindPostcss;
if (autoprefixer) plugins.autoprefixer = autoprefixer;

module.exports = { plugins };
