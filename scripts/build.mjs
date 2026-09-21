import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { watch } from 'chokidar';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import pug from 'pug';

const root = new URL('../', import.meta.url).pathname;
const cssEntries = [
  ['src/spectre.css', 'dist/spectre.css'],
  ['src/spectre-exp.css', 'dist/spectre-exp.css'],
  ['src/spectre-icons.css', 'dist/spectre-icons.css'],
  ['docs/src/css/docs.css', 'docs/dist/docs.css'],
  ['docs/src/css/spectre-rtl.css', 'docs/dist/spectre-rtl.css']
];

async function buildCss() {
  for (const [input, output] of cssEntries) {
    const source = await readFile(join(root, input), 'utf8');
    const prefixed = await postcss([autoprefixer]).process(source, { from: input, to: output });
    await mkdir(join(root, output, '..'), { recursive: true });
    await writeFile(join(root, output), prefixed.css);

    const minified = await postcss([autoprefixer, cssnano({ preset: 'default' })])
      .process(source, { from: input, to: output.replace('.css', '.min.css') });
    await writeFile(join(root, output.replace('.css', '.min.css')), minified.css);
  }

  // The documentation serves its own copies of the distributable styles.
  for (const name of ['spectre.css', 'spectre-exp.css', 'spectre-icons.css']) {
    await writeFile(join(root, 'docs/dist', name), await readFile(join(root, 'dist', name)));
    await writeFile(join(root, 'docs/dist', name.replace('.css', '.min.css')), await readFile(join(root, 'dist', name.replace('.css', '.min.css'))));
  }
}

async function* files(directory) {
  const { readdir } = await import('node:fs/promises');
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else yield path;
  }
}

async function buildDocs() {
  const sourceRoot = join(root, 'docs/src');
  for await (const input of files(sourceRoot)) {
    if (extname(input) !== '.pug' || input.split('/').pop().startsWith('_')) continue;
    const output = join(root, 'docs', relative(sourceRoot, input).replace(/\.pug$/, '.html'));
    await mkdir(join(output, '..'), { recursive: true });
    await writeFile(output, pug.renderFile(input, { pretty: true, basedir: sourceRoot }));
  }
}

async function buildAll() {
  await Promise.all([buildCss(), buildDocs()]);
}

const command = process.argv[2];
if (command === 'css') await buildCss();
else if (command === 'docs') await Promise.all([buildCss(), buildDocs()]);
else if (command === 'watch') {
  await buildAll();
  console.log('Watching CSS and Pug sources…');
  let queue = Promise.resolve();
  watch(['src/**/*.css', 'docs/src/css/**/*.css', 'docs/src/**/*.pug'], { cwd: root, ignoreInitial: true })
    .on('all', (_event, path) => {
      queue = queue.then(() => path.endsWith('.pug') ? buildDocs() : buildCss())
        .then(() => console.log(`Rebuilt after ${path}`))
        .catch(error => console.error(error));
    });
} else await buildAll();
