import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { buildCss, buildEntry } from "../../scripts/build-css.mts";

describe("Phase 1 CSS build", () => {
  test("bundles imports, preserves licenses, and maps to component sources", async () => {
    const result = await buildCss();
    const css = result.css.toString();
    const minified = result.minifiedCss.toString();
    const sourceMap = JSON.parse(result.map.toString()) as {
      sections: Array<{ map: { sources: string[] } }>;
    };

    expect(css).not.toMatch(/@import\s/);
    expect(minified).not.toMatch(/@import\s/);
    expect(css).toContain("Spectra v0.1.0-dev");
    expect(css).toContain("Derived from Spectre.css v0.5.9");
    expect(minified).toContain("MIT License");
    expect(
      sourceMap.sections.some((section) =>
        section.map.sources.some((source) => source.endsWith("src/components/buttons.css")),
      ),
    ).toBe(true);
  });

  test("produces byte-identical output from the same input", async () => {
    const first = await buildCss();
    const second = await buildCss();

    expect(second.css).toEqual(first.css);
    expect(second.map).toEqual(first.map);
    expect(second.minifiedCss).toEqual(first.minifiedCss);
  });

  test("rejects a missing import", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "spectra-missing-import-"));
    const entry = path.join(directory, "entry.css");
    await writeFile(entry, '@import "./missing.css";\n');

    await expect(buildEntry(entry, path.join(directory, "output"))).rejects.toThrow();
  });

  test("rejects invalid CSS", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "spectra-invalid-css-"));
    const entry = path.join(directory, "entry.css");
    await writeFile(entry, ".btn { color: rgb(1, 2; }\n");

    await expect(buildEntry(entry, path.join(directory, "output"))).rejects.toThrow();
  });

  test("keeps the legacy distribution baseline unchanged", async () => {
    const [distribution, documentationCopy] = await Promise.all([
      readFile("dist/spectre.css"),
      readFile("docs/dist/spectre.css"),
    ]);

    expect(documentationCopy).toEqual(distribution);
    expect(distribution.byteLength).toBe(62_359);
  });
});
