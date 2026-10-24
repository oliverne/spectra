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

  test("ends the last component slice at the following keyframes block", async () => {
    const tooltips = await inspectComponent("tooltips");

    expect(tooltips.legacy?.nextComponent).toBe("animations");
    expect(tooltips.legacy?.classes).toEqual([
      "disabled",
      "tooltip",
      "tooltip-bottom",
      "tooltip-left",
      "tooltip-right",
    ]);
    expect(tooltips.legacy?.properties).toContain("white-space");
    expect(tooltips.legacy?.properties).not.toContain("text-align");

    const directory = await mkdtemp(path.join(tmpdir(), "spectra-migration-tooltips-"));
    const result = await scaffoldComponent("tooltips", directory);
    const legacy = await readFile(result.legacyPath, "utf8");
    expect(legacy).toContain(".tooltip {");
    expect(legacy).not.toContain("@keyframes");
    expect(legacy).not.toContain(".m-1");
    expect(legacy).not.toContain(".text-primary");
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

  test("treats the inset shorthand as coverage for its physical longhands", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "spectra-migration-inset-"));
    const scaffold = await scaffoldComponent("media", directory);
    const report = await verifyComponent("media", scaffold.candidatePath);

    expect(report.ok).toBe(true);
    expect(report.missingProperties).toEqual([]);
  });

  test("verifies an explicit legacy range for at-rule and aggregator components", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "spectra-migration-range-"));

    const animationsTarget = path.join(directory, "animations.css");
    await writeFile(
      animationsTarget,
      "@keyframes loading { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n",
    );
    const animations = await verifyComponent("animations", animationsTarget, {
      legacyStart: "@keyframes loading",
      legacyEnd: ".text-primary",
    });
    expect(animations.missingKeyframes).toEqual(["slide-down"]);
    expect(animations.ok).toBe(false);

    const slideTarget = path.join(directory, "slide-down.css");
    await writeFile(
      slideTarget,
      "@keyframes slide-down { 0% { opacity: 0; transform: translateY(-1.6rem); } 100% { opacity: 1; transform: translateY(0); } }\n",
    );
    const combined = await verifyComponent("animations", [animationsTarget, slideTarget], {
      legacyStart: "@keyframes loading",
      legacyEnd: ".text-primary",
    });
    expect(combined.missingKeyframes).toEqual([]);
    expect(combined.targets).toHaveLength(2);
    expect(combined.ok).toBe(true);

    const utilitiesTarget = path.join(directory, "utilities.css");
    await writeFile(utilitiesTarget, ".text-primary { color: #5755d9 !important; }\n");
    const utilities = await verifyComponent("utilities", utilitiesTarget, {
      legacyStart: ".text-primary",
    });
    expect(utilities.missingClasses).toEqual(expect.arrayContaining(["bg-primary", "loading"]));
    expect(utilities.missingKeyframes).toEqual([]);
    expect(utilities.ok).toBe(false);

    await expect(
      verifyComponent("utilities", utilitiesTarget, { legacyStart: ".does-not-exist" }),
    ).rejects.toThrow("Legacy start selector not found");
  });

  test("rejects paths outside the Sass source tree", async () => {
    await expect(inspectComponent("../package")).rejects.toThrow("Invalid component name");
  });
});
