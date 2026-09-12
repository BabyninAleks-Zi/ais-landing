// Explicit source list for clean-copy verification; no Git mutation or upload.
export const sourceFiles = [
  '.gitignore', '.gitattributes', '.nvmrc', 'README.md',
  'package.json', 'package-lock.json',
  '.github/workflows/check.yml', '.github/workflows/pages.yml',
  'assets/ais-monogram.png', 'content/site.json', 'content/investor.json',
  'src/app.js', 'src/styles.css',
  'scripts/build.mjs', 'scripts/build-pages.mjs', 'scripts/render.mjs', 'scripts/serve.mjs',
  'scripts/source-files.mjs', 'scripts/check-clean.mjs',
  'tests/site.test.mjs', 'tests/browser_check.py'
];
