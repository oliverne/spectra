import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  inspectComponent,
  scaffoldComponent,
  verifyComponent,
} from "../../scripts/css-migration.mts";

describe("CSS migration helper", () => {
  test("inspects Sass constructs and the checked-in legacy slice", async () => {
    const inspection = await inspectComponent("layout");

    expect(inspection.source.path).toBe("src/_layout.scss");
    expect(inspection.source.variableReferences).toEqual(
      expect.arrayContaining(["layout-spacing", "size-xl", "size-xs"]),
    );
    expect(inspection.source.counts.nestingReferences).toBeGreaterThan(0);
    expect(inspection.legacy?.nextComponent).toBe("hero");
    expect(inspection.legacy?.classes).toEqual(
      expect.arrayContaining([
        "container",
        "grid-xl",
        "col-gapless",
        "col-xl-12",
        "col-xs-12",
        "show-xs",
      ]),
    );
  });

  test("keeps adjacent component boundaries separate", async () => {
    const buttons = await inspectComponent("buttons");
    const animations = await inspectComponent("animations");

    expect(buttons.legacy?.nextComponent).toBe("forms");
    expect(buttons.legacy?.classes).toContain("btn-primary");
    expect(buttons.legacy?.classes).not.toContain("form-input");
    expect(animations.legacy).toBeNull();
    expect(animations.legacyUnavailableReason).toContain("selector boundary");

    const forms = await inspectComponent("forms");
    expect(forms.legacy?.properties).not.toContain("input");
  });

  test("drops a trailing partial selector from the next component", async () => {
    const navbar = await inspectComponent("navbar");

    expect(navbar.legacy?.nextComponent).toBe("accordions");
    expect(navbar.legacy?.classes).toEqual([
      "navbar",
      "navbar-brand",
      "navbar-center",
      "navbar-section",
    ]);
  });

  test("scaffolds a reviewable layout packet without editing source files", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "spectra-migration-scaffold-"));
    const result = await scaffoldComponent("layout", directory);
    const [inspection, legacy, candidate] = await Promise.all([
      readFile(result.inspectionPath, "utf8"),
      readFile(result.legacyPath, "utf8"),
      readFile(result.candidatePath, "utf8"),
    ]);

    expect(JSON.parse(inspection).component).toBe("layout");
    expect(legacy).toContain(".container {");
    expect(legacy).toContain(".col-xs-12 {");
    expect(legacy).not.toContain(".hero {");
    expect(candidate).toContain("Migration scaffold for layout");
    expect(candidate).toContain(".container {");

    await expect(scaffoldComponent("layout", directory)).rejects.toThrow(
      "Migration packet already exists",
    );
    expect(await readFile(result.candidatePath, "utf8")).toBe(candidate);
  });

  test("verifies static coverage and rejects unresolved Sass", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "spectra-migration-verify-"));
    const scaffold = await scaffoldComponent("layout", directory);
    const passing = await verifyComponent("layout", scaffold.candidatePath);

    expect(passing.ok).toBe(true);
    expect(passing.missingClasses).toEqual([]);
    expect(passing.missingMediaQueries).toEqual([]);
    expect(passing.missingProperties).toEqual([]);

    const brokenTarget = path.join(directory, "broken.css");
    await writeFile(
      brokenTarget,
      ".container { padding-left: $layout-spacing; }\n@media (max-width: 1280px) {}\n",
    );
    const failing = await verifyComponent("layout", brokenTarget);

    expect(failing.ok).toBe(false);
    expect(failing.unresolvedSass).toContain("variable");
    expect(failing.missingClasses).toContain("col-xs-12");
    expect(failing.missingMediaQueries).toContain("max-width: 480px");
  });

  test("rejects paths outside the Sass source tree", async () => {
    await expect(inspectComponent("../package")).rejects.toThrow("Invalid component name");
  });
});
