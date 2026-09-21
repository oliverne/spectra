import { access, readFile } from 'node:fs/promises';

const outputs = [
  'dist/spectre.css', 'dist/spectre.min.css',
  'dist/spectre-exp.css', 'dist/spectre-exp.min.css',
  'dist/spectre-icons.css', 'dist/spectre-icons.min.css',
  'docs/dist/docs.css', 'docs/dist/docs.min.css',
  'docs/dist/spectre-rtl.css', 'docs/dist/spectre-rtl.min.css',
  'docs/index.html'
];

await Promise.all(outputs.map(file => access(file)));
for (const file of outputs.filter(file => file.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  if (!css.trim() || /\$[a-z-]+|@mixin|@include/.test(css)) {
    throw new Error(`${file} is empty or contains preprocessor syntax`);
  }
}
console.log(`Verified ${outputs.length} generated files.`);
