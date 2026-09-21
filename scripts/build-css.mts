import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import browserslist from "browserslist";
import { browserslistToTargets, transform } from "lightningcss";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export type BuildOptions = {
  entry?: string;
  outputDirectory?: string;
};

type SourceUnit = {
  code: Buffer;
  filename: string;
};

const importPattern = /@import\s+["']([^"']+)["']\s*;/g;

async function collectSourceUnits(
  filename: string,
  ancestors: string[] = [],
): Promise<SourceUnit[]> {
  if (ancestors.includes(filename)) {
    throw new Error(`Circular CSS import: ${[...ancestors, filename].join(" -> ")}`);
  }

  const source = await readFile(filename, "utf8");
  const units: SourceUnit[] = [];
  let cursor = 0;

  for (const match of source.matchAll(importPattern)) {
    const precedingSource = source.slice(cursor, match.index);
    if (precedingSource.trim()) {
      units.push({ code: Buffer.from(precedingSource), filename });
    }

    const importPath = match[1];
    if (!importPath.startsWith(".")) {
      throw new Error(`Only relative CSS imports are supported in Phase 1: ${importPath}`);
    }
    const importedFilename = path.resolve(path.dirname(filename), importPath);
    units.push(...(await collectSourceUnits(importedFilename, [...ancestors, filename])));
    cursor = (match.index ?? 0) + match[0].length;
  }

  const remainingSource = source.slice(cursor);
  if (remainingSource.trim()) {
    units.push({ code: Buffer.from(remainingSource), filename });
  }

  return units;
}

export async function buildCss(options: BuildOptions = {}) {
  const entry = path.resolve(repositoryRoot, options.entry ?? "src/spectra.css");
  const outputDirectory = path.resolve(repositoryRoot, options.outputDirectory ?? "build/phase-01");
  const targets = browserslistToTargets(browserslist(undefined, { path: repositoryRoot }));

  await mkdir(outputDirectory, { recursive: true });

  const units = await collectSourceUnits(entry);
  const sections: Array<{ offset: { line: number; column: number }; map: object }> = [];
  const regularChunks: Buffer[] = [];
  let lineOffset = 0;

  for (const unit of units) {
    const result = transform({
      filename: unit.filename,
      code: unit.code,
      minify: false,
      sourceMap: true,
      targets,
    });
    const chunk =
      result.code.at(-1) === 10 ? result.code : Buffer.concat([result.code, Buffer.from("\n")]);
    sections.push({
      offset: { line: lineOffset, column: 0 },
      map: JSON.parse(result.map?.toString() ?? "{}"),
    });
    regularChunks.push(chunk);
    lineOffset += chunk.toString().split("\n").length - 1;
  }

  const bundledCss = Buffer.concat(regularChunks);
  const minified = transform({
    filename: entry,
    code: bundledCss,
    minify: true,
    sourceMap: false,
    targets,
  });
  const sourceMap = Buffer.from(JSON.stringify({ version: 3, sections }));

  const sourceMapName = "spectra.css.map";
  const regularCss = Buffer.concat([
    bundledCss,
    Buffer.from(`\n/*# sourceMappingURL=${sourceMapName} */\n`),
  ]);

  await Promise.all([
    writeFile(path.join(outputDirectory, "spectra.css"), regularCss),
    writeFile(path.join(outputDirectory, sourceMapName), sourceMap),
    writeFile(path.join(outputDirectory, "spectra.min.css"), minified.code),
  ]);

  return {
    css: regularCss,
    map: sourceMap,
    minifiedCss: minified.code,
  };
}

export async function buildEntry(entry: string, outputDirectory: string) {
  return buildCss({ entry, outputDirectory });
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;
if (invokedPath === import.meta.url) {
  await buildCss();
  const output = await readFile(path.join(repositoryRoot, "build/phase-01/spectra.css"));
  process.stdout.write(`Built build/phase-01/spectra.css (${output.byteLength} bytes)\n`);
}
