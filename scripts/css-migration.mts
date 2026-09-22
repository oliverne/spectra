import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "lightningcss";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repositoryRoot, "src");
const legacyBundlePath = path.join(repositoryRoot, "dist/spectre.css");
const baseEntryPath = path.join(sourceRoot, "spectre.scss");

type ConstructCounts = {
  colorFunctions: number;
  conditionals: number;
  extends: number;
  interpolations: number;
  loops: number;
  mixinIncludes: number;
  nestingReferences: number;
};

type LegacyInspection = {
  classes: string[];
  mediaQueries: string[];
  nextComponent: string | null;
  path: string;
  properties: string[];
  startSelector: string;
};

export type ComponentInspection = {
  component: string;
  legacy: LegacyInspection | null;
  legacyUnavailableReason: string | null;
  manualReview: string[];
  schemaVersion: 1;
  source: {
    classes: string[];
    counts: ConstructCounts;
    localVariables: string[];
    mixinIncludes: string[];
    path: string;
    variableReferences: string[];
  };
};

export type VerificationReport = {
  component: string;
  missingClasses: string[];
  missingMediaQueries: string[];
  missingProperties: string[];
  ok: boolean;
  syntaxError: string | null;
  target: string;
  unresolvedSass: string[];
  warnings: string[];
};

function relativeToRepository(filename: string) {
  return path.relative(repositoryRoot, filename).split(path.sep).join("/");
}

function sortedUnique(values: Iterable<string>) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function matches(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

function extractClasses(source: string) {
  const withoutComments = stripComments(source);
  const classes: string[] = [];
  const classPattern = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;

  for (const match of withoutComments.matchAll(classPattern)) {
    const end = (match.index ?? 0) + match[0].length;
    if (withoutComments.startsWith("#{", end)) {
      continue;
    }
    classes.push(match[1]);
  }

  return sortedUnique(classes);
}

function extractMediaQueries(source: string) {
  return sortedUnique(
    [...source.matchAll(/@media\s*\(([^)]+)\)/g)].map((match) =>
      match[1].replace(/\s+/g, " ").trim(),
    ),
  );
}

function extractProperties(source: string) {
  const properties = [...stripComments(source).matchAll(/^\s*([-A-Za-z][\w-]*)\s*:\s+/gm)]
    .map((match) => match[1])
    .filter((property) => !/^-(?:moz|ms|o|webkit)-/.test(property));
  return sortedUnique(properties);
}

function firstSelector(source: string) {
  const input = stripComments(source);
  let blockStart = 0;
  let depth = 0;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === "{" && input[index - 1] !== "#") {
      if (depth === 0) {
        const prelude = input.slice(blockStart, index).trim();
        if (prelude.startsWith("@")) {
          if (!/^@(?:function|mixin)\b/.test(prelude)) {
            return null;
          }
        } else if (prelude) {
          return prelude.split(",", 1)[0].trim();
        }
      }
      depth += 1;
      continue;
    }
    if (character === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0) blockStart = index + 1;
      continue;
    }
    if (character === ";" && depth === 0) {
      blockStart = index + 1;
    }
  }

  return null;
}

function selectorOffset(css: string, selector: string, from = 0) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|\\n)\\s*${escaped}(?=\\s*[,\\{.:#\\[])`, "gm");
  pattern.lastIndex = from;
  const match = pattern.exec(css);
  if (!match) {
    return -1;
  }
  return (match.index ?? 0) + (match[1] ? match[1].length : 0);
}

function assertComponentName(component: string) {
  if (!/^[a-z0-9][a-z0-9/-]*$/.test(component) || component.includes("..")) {
    throw new Error(`Invalid component name: ${component}`);
  }
}

async function resolveSourcePath(component: string) {
  assertComponentName(component);
  const parts = component.split("/");
  const basename = parts.pop();
  if (!basename) {
    throw new Error(`Invalid component name: ${component}`);
  }
  const directory = path.join(sourceRoot, ...parts);
  const candidates = [
    path.join(directory, `_${basename}.scss`),
    path.join(directory, `${basename}.scss`),
  ];

  for (const candidate of candidates) {
    try {
      await readFile(candidate);
      return candidate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error(`Sass source not found for component: ${component}`);
}

async function entryImports() {
  const entry = await readFile(baseEntryPath, "utf8");
  return [...entry.matchAll(/@import\s+["']([^"']+)["']\s*;/g)].map((match) => match[1]);
}

async function legacySlice(component: string) {
  const imports = await entryImports();
  const componentIndex = imports.indexOf(component);
  if (componentIndex === -1) {
    return null;
  }

  const legacyBundle = await readFile(legacyBundlePath, "utf8");
  let cursor = 0;
  let start = -1;
  let startSelector: string | null = null;
  let end = -1;
  let nextComponent: string | null = null;
  for (const [index, candidate] of imports.entries()) {
    const candidatePath = await resolveSourcePath(candidate);
    const candidateSource = await readFile(candidatePath, "utf8");
    const candidateSelector = firstSelector(candidateSource);
    if (!candidateSelector) {
      continue;
    }
    const candidateOffset = selectorOffset(legacyBundle, candidateSelector, cursor);
    if (candidateOffset === -1) {
      continue;
    }
    cursor = candidateOffset + 1;
    if (index === componentIndex) {
      start = candidateOffset;
      startSelector = candidateSelector;
      continue;
    }
    if (start !== -1 && index > componentIndex) {
      end = candidateOffset;
      nextComponent = candidate;
      break;
    }
  }

  if (start === -1 || !startSelector) {
    return null;
  }
  if (end === -1) end = legacyBundle.length;

  return {
    css: `${legacyBundle.slice(start, end).trim()}\n`,
    nextComponent,
    startSelector,
  };
}

function inspectCounts(source: string): ConstructCounts {
  return {
    colorFunctions: matches(source, /\b(?:darken|lighten|lightness|rgba)\s*\(/g),
    conditionals: matches(source, /@(?:if|else)\b/g),
    extends: matches(source, /@extend\b/g),
    interpolations: matches(source, /#\{/g),
    loops: matches(source, /@(?:each|for|while)\b/g),
    mixinIncludes: matches(source, /@include\b/g),
    nestingReferences: matches(source, /&/g),
  };
}

function manualReviewFor(counts: ConstructCounts) {
  const review = [
    "Replace themeable legacy values with approved --spectra-* tokens.",
    "Confirm selector order, specificity, states, and responsive boundaries against the legacy bundle.",
    "Use computed-style and visual tests as the final parity evidence.",
  ];
  if (counts.colorFunctions > 0) {
    review.push("Preserve Sass-computed colors with explicit state, contrast, or alpha tokens.");
  }
  if (counts.mixinIncludes > 0) {
    review.push("Confirm every included mixin declaration is represented in the candidate CSS.");
  }
  if (counts.loops > 0 || counts.extends > 0 || counts.interpolations > 0) {
    review.push("Confirm generated selectors retain the complete legacy range.");
  }
  if (counts.conditionals > 0) {
    review.push(
      "Resolve Sass conditionals from the active bundle contract, including RTL when applicable.",
    );
  }
  return review;
}

export async function inspectComponent(component: string): Promise<ComponentInspection> {
  const sourcePath = await resolveSourcePath(component);
  const source = await readFile(sourcePath, "utf8");
  const counts = inspectCounts(source);
  const legacy = await legacySlice(component);
  const imports = await entryImports();
  const legacyUnavailableReason = legacy
    ? null
    : imports.includes(component)
      ? "No unambiguous selector boundary is available; inspect this emitted at-rule or empty slice manually."
      : "The source is not a direct component import in src/spectre.scss.";

  return {
    component,
    legacy: legacy
      ? {
          classes: extractClasses(legacy.css),
          mediaQueries: extractMediaQueries(legacy.css),
          nextComponent: legacy.nextComponent,
          path: relativeToRepository(legacyBundlePath),
          properties: extractProperties(legacy.css),
          startSelector: legacy.startSelector,
        }
      : null,
    legacyUnavailableReason,
    manualReview: manualReviewFor(counts),
    schemaVersion: 1,
    source: {
      classes: extractClasses(source),
      counts,
      localVariables: sortedUnique(
        [...source.matchAll(/^\s*\$([A-Za-z_][\w-]*)\s*:/gm)].map((match) => match[1]),
      ),
      mixinIncludes: sortedUnique(
        [...source.matchAll(/@include\s+([A-Za-z_][\w-]*)/g)].map((match) => match[1]),
      ),
      path: relativeToRepository(sourcePath),
      variableReferences: sortedUnique(
        [...source.matchAll(/\$([A-Za-z_][\w-]*)/g)].map((match) => match[1]),
      ),
    },
  };
}

async function readLegacyComponentCss(component: string) {
  const legacy = await legacySlice(component);
  if (!legacy) {
    throw new Error(
      `Cannot scaffold ${component}: it is not a direct component slice in src/spectre.scss`,
    );
  }
  return legacy.css;
}

export async function scaffoldComponent(component: string, outputDirectory?: string) {
  const inspection = await inspectComponent(component);
  const legacyCss = await readLegacyComponentCss(component);
  const directory = path.resolve(
    repositoryRoot,
    outputDirectory ?? path.join("build/migration", component),
  );
  const inspectionPath = path.join(directory, "inspection.json");
  const legacyPath = path.join(directory, "legacy.css");
  const candidatePath = path.join(directory, "candidate.css");
  const candidateHeader = `/*\n * Migration scaffold for ${component}.\n * Generated from the checked-in legacy bundle; this is a review draft, not integration-ready CSS.\n * Replace themeable values with approved tokens and verify cascade and visual parity before copying it into src/.\n */\n`;

  await mkdir(directory, { recursive: true });
  for (const filename of [inspectionPath, legacyPath, candidatePath]) {
    try {
      await access(filename);
      throw new Error(`Migration packet already exists: ${relativeToRepository(filename)}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
  await Promise.all([
    writeFile(inspectionPath, `${JSON.stringify(inspection, null, 2)}\n`, { flag: "wx" }),
    writeFile(legacyPath, legacyCss, { flag: "wx" }),
    writeFile(candidatePath, `${candidateHeader}${legacyCss}`, { flag: "wx" }),
  ]);

  return { candidatePath, directory, inspectionPath, legacyPath };
}

function unresolvedSassConstructs(source: string) {
  const constructs = new Set<string>();
  if (/\$[A-Za-z_][\w-]*/.test(source)) constructs.add("variable");
  if (/@include\b/.test(source)) constructs.add("include");
  if (/@mixin\b/.test(source)) constructs.add("mixin");
  if (/@extend\b/.test(source)) constructs.add("extend");
  if (/@(?:each|for|if|while)\b/.test(source)) constructs.add("control-directive");
  if (/#\{/.test(source)) constructs.add("interpolation");
  if (/(?:^|[{;,])\s*&(?:[.:#[>+~]|\s)/m.test(source)) constructs.add("nesting-reference");
  return sortedUnique(constructs);
}

function difference(expected: string[], actual: string[]) {
  const actualSet = new Set(actual);
  return expected.filter((value) => !actualSet.has(value));
}

export async function verifyComponent(
  component: string,
  targetPath: string,
): Promise<VerificationReport> {
  const inspection = await inspectComponent(component);
  if (!inspection.legacy) {
    throw new Error(
      `Cannot verify ${component}: it is not a direct component slice in src/spectre.scss`,
    );
  }

  const resolvedTarget = path.resolve(repositoryRoot, targetPath);
  const target = await readFile(resolvedTarget, "utf8");
  let normalizedTarget = target;
  let syntaxError: string | null = null;
  try {
    normalizedTarget = transform({
      code: Buffer.from(target),
      filename: resolvedTarget,
      minify: false,
    }).code.toString();
  } catch (error) {
    syntaxError = error instanceof Error ? error.message : String(error);
  }

  const unresolvedSass = unresolvedSassConstructs(target);
  const missingClasses = difference(inspection.legacy.classes, extractClasses(target));
  const missingMediaQueries = difference(
    inspection.legacy.mediaQueries,
    extractMediaQueries(target),
  );
  const missingProperties = difference(
    inspection.legacy.properties,
    extractProperties(normalizedTarget),
  );

  return {
    component,
    missingClasses,
    missingMediaQueries,
    missingProperties,
    ok:
      syntaxError === null &&
      unresolvedSass.length === 0 &&
      missingClasses.length === 0 &&
      missingMediaQueries.length === 0 &&
      missingProperties.length === 0,
    syntaxError,
    target: relativeToRepository(resolvedTarget),
    unresolvedSass,
    warnings: inspection.manualReview,
  };
}

function optionValue(args: string[], option: string) {
  const index = args.indexOf(option);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
}

function usage() {
  return [
    "Usage:",
    "  pnpm migrate:css inspect <component>",
    "  pnpm migrate:css scaffold <component> [--output <directory>]",
    "  pnpm migrate:css verify <component> --target <css-file>",
  ].join("\n");
}

async function runCli() {
  const [command, component, ...args] = process.argv.slice(2);
  if (!command || !component) {
    throw new Error(usage());
  }

  if (command === "inspect") {
    process.stdout.write(`${JSON.stringify(await inspectComponent(component), null, 2)}\n`);
    return;
  }
  if (command === "scaffold") {
    const result = await scaffoldComponent(component, optionValue(args, "--output"));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command === "verify") {
    const target = optionValue(args, "--target");
    if (!target) {
      throw new Error(`Missing --target\n${usage()}`);
    }
    const report = await verifyComponent(component, target);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.ok) process.exitCode = 1;
    return;
  }

  throw new Error(`Unknown command: ${command}\n${usage()}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;
if (invokedPath === import.meta.url) {
  try {
    await runCli();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
