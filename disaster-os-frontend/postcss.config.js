/**
 * PostCSS configuration.
 *
 * Required for Tailwind CSS v3 to actually work: the `@tailwind base;`
 * etc. directives in app/globals.css are not valid CSS on their own -
 * they're instructions for this PostCSS pipeline to expand into real
 * generated utility classes. Without this file, those directives pass
 * through unprocessed and the browser silently ignores them, which is
 * exactly the "page renders but has zero styling" symptom this file fixes.
 *
 * Using .js with module.exports (CommonJS) rather than .mjs, since this
 * project's package.json does not set `"type": "module"` - matching the
 * file extension to the actual module system Node expects here avoids a
 * separate "exports is not defined" class of error.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
