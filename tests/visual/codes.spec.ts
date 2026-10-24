import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <p id="paragraph">Inline <code id="code">code sample</code> text</p>
    <pre id="block" class="code" data-lang="HTML"><code id="block-code">line one
line two</code></pre>
    <pre id="block-empty" class="code"><code id="block-empty-code">no lang</code></pre>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 640px; }
  #fixture .code { margin-bottom: 8px; }
`;

const codeSelectors = ["#code", "#block", "#block-code", "#block-empty", "#block-empty-code"];

let legacyCss: string;
let spectraCss: string;

test.beforeAll(async () => {
  [legacyCss, spectraCss] = await Promise.all([
    readFile("dist/spectre.css", "utf8"),
    readFile("build/phase-01/spectra.css", "utf8"),
  ]);
});

async function render(page: Page, css: string, additionalCss = "") {
  await page.setContent(`<style>${css}\n${fixtureCss}\n${additionalCss}</style>${fixture}`);
}

async function codeStyles(page: Page, selectors = codeSelectors) {
  return page.evaluate((targets) => {
    const snapshot: Record<string, Record<string, string>> = {};
    for (const selector of targets) {
      const element = document.querySelector(selector);
      if (!element) {
        snapshot[selector] = { missing: "true" };
        continue;
      }
      const style = getComputedStyle(element);
      snapshot[selector] = {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        color: style.color,
        display: style.display,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        overflowX: style.overflowX,
        padding: style.padding,
        position: style.position,
        width: style.width,
      };
    }
    return snapshot;
  }, selectors);
}

async function beforeStyles(page: Page, selectors: string[]) {
  return page.evaluate((targets) => {
    const snapshot: Record<string, Record<string, string>> = {};
    for (const selector of targets) {
      const element = document.querySelector(selector);
      if (!element) {
        snapshot[selector] = { missing: "true" };
        continue;
      }
      const style = getComputedStyle(element, "::before");
      snapshot[selector] = {
        color: style.color,
        content: style.content,
        fontSize: style.fontSize,
        position: style.position,
        right: style.right,
        top: style.top,
      };
    }
    return snapshot;
  }, selectors);
}

async function numericStyle(page: Page, selector: string, property: string) {
  return page
    .locator(selector)
    .evaluate(
      (element, name) => Number.parseFloat(getComputedStyle(element)[name as never] as string),
      property,
    );
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 900 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy code computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await codeStyles(spectra)).toEqual(await codeStyles(legacy));
  expect(await beforeStyles(spectra, ["#block", "#block-empty"])).toEqual(
    await beforeStyles(legacy, ["#block", "#block-empty"]),
  );

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy inline and block code contracts", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#code")).toHaveCSS("background-color", "rgb(252, 242, 242)");
  await expect(page.locator("#code")).toHaveCSS("color", "rgb(215, 62, 72)");
  await expect(page.locator("#code")).toHaveCSS("border-radius", "2px");
  const codeFontSize = await numericStyle(page, "#code", "fontSize");
  expect(codeFontSize).toBeCloseTo(13.6, 1);
  expect((await numericStyle(page, "#code", "lineHeight")) / codeFontSize).toBeCloseTo(1.25, 2);
  await expect(page.locator("#code")).toHaveCSS("padding", "2px 4px");
  const codeFontFamily = await page
    .locator("#code")
    .evaluate((element) => getComputedStyle(element).fontFamily);
  expect(codeFontFamily).toContain("monospace");

  await expect(page.locator("#block")).toHaveCSS("position", "relative");
  await expect(page.locator("#block")).toHaveCSS("border-radius", "2px");
  await expect(page.locator("#block")).toHaveCSS("color", "rgb(59, 67, 81)");

  await expect(page.locator("#block-code")).toHaveCSS("background-color", "rgb(247, 248, 249)");
  await expect(page.locator("#block-code")).toHaveCSS("color", "rgb(59, 67, 81)");
  await expect(page.locator("#block-code")).toHaveCSS("display", "block");
  const blockFontSize = await numericStyle(page, "#block-code", "fontSize");
  expect((await numericStyle(page, "#block-code", "lineHeight")) / blockFontSize).toBeCloseTo(
    1.5,
    2,
  );
  await expect(page.locator("#block-code")).toHaveCSS("overflow-x", "auto");
  await expect(page.locator("#block-code")).toHaveCSS("padding", "20px");
  expect(await numericStyle(page, "#block-code", "width")).toBeCloseTo(616, 0);

  const [lang, empty] = await Promise.all([
    beforeStyles(page, ["#block"]),
    beforeStyles(page, ["#block-empty"]),
  ]);
  expect(lang["#block"]).toEqual({
    color: "rgb(188, 195, 206)",
    content: '"HTML"',
    fontSize: "14px",
    position: "absolute",
    right: "8px",
    top: "2px",
  });
  expect(empty["#block-empty"].content).not.toContain("HTML");
});

test("supports global and nested code token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-code: rgb(1 2 3);
        --spectra-color-code-surface: rgb(4 5 6);
        --spectra-color-text: rgb(7 8 9);
        --spectra-color-text-subtle: rgb(10 11 12);
        --spectra-color-background-subtle: rgb(13 14 15);
        --spectra-space-half: 5px;
        --spectra-space-1: 15px;
        --spectra-space-2: 25px;
        --spectra-space-5: 35px;
        --spectra-font-size-sm: 33px;
      }
      .theme-a {
        --spectra-color-code: rgb(20 21 22);
        --spectra-color-code-surface: rgb(23 24 25);
        --spectra-color-text: rgb(26 27 28);
        --spectra-color-text-subtle: rgb(29 30 31);
        --spectra-color-background-subtle: rgb(32 33 34);
        --spectra-space-half: 45px;
        --spectra-space-1: 55px;
        --spectra-space-2: 65px;
        --spectra-space-5: 75px;
        --spectra-font-size-sm: 44px;
      }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <p><code id="global-code">global</code></p>
      <pre id="global-block" class="code" data-lang="HTML"><code id="global-block-code">global</code></pre>
      <div class="theme-a">
        <p><code id="a-code">theme a</code></p>
        <pre id="a-block" class="code" data-lang="HTML"><code id="a-block-code">theme a</code></pre>
      </div>
      <p><code id="after-code">after</code></p>
    `;
  });

  await expect(page.locator("#global-code")).toHaveCSS("background-color", "rgb(4, 5, 6)");
  await expect(page.locator("#global-code")).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(page.locator("#global-code")).toHaveCSS("padding", "5px 15px");
  await expect(page.locator("#global-block")).toHaveCSS("color", "rgb(7, 8, 9)");
  await expect(page.locator("#global-block-code")).toHaveCSS("background-color", "rgb(13, 14, 15)");
  await expect(page.locator("#global-block-code")).toHaveCSS("padding", "35px");

  const [globalBefore, aBefore] = await Promise.all([
    beforeStyles(page, ["#global-block"]),
    beforeStyles(page, ["#a-block"]),
  ]);
  expect(globalBefore["#global-block"].color).toBe("rgb(10, 11, 12)");
  expect(globalBefore["#global-block"].fontSize).toBe("33px");
  expect(globalBefore["#global-block"].right).toBe("25px");
  expect(globalBefore["#global-block"].top).toBe("5px");

  await expect(page.locator("#a-code")).toHaveCSS("background-color", "rgb(23, 24, 25)");
  await expect(page.locator("#a-code")).toHaveCSS("color", "rgb(20, 21, 22)");
  await expect(page.locator("#a-code")).toHaveCSS("padding", "45px 55px");
  await expect(page.locator("#a-block")).toHaveCSS("color", "rgb(26, 27, 28)");
  await expect(page.locator("#a-block-code")).toHaveCSS("background-color", "rgb(32, 33, 34)");
  await expect(page.locator("#a-block-code")).toHaveCSS("padding", "75px");
  expect(aBefore["#a-block"].color).toBe("rgb(29, 30, 31)");
  expect(aBefore["#a-block"].fontSize).toBe("44px");
  expect(aBefore["#a-block"].right).toBe("65px");
  expect(aBefore["#a-block"].top).toBe("45px");

  await expect(page.locator("#after-code")).toHaveCSS("background-color", "rgb(4, 5, 6)");
  await expect(page.locator("#after-code")).toHaveCSS("padding", "5px 15px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      code { background: rgb(1 2 3); color: rgb(4 5 6); }
      .code::before { color: rgb(7 8 9); }
      .code code { background: rgb(10 11 12); }
    `,
  );

  await expect(page.locator("#code")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#code")).toHaveCSS("color", "rgb(4, 5, 6)");
  await expect(page.locator("#block-code")).toHaveCSS("background-color", "rgb(10, 11, 12)");

  const [before] = await Promise.all([beforeStyles(page, ["#block"])]);
  expect(before["#block"].color).toBe("rgb(7, 8, 9)");
});
