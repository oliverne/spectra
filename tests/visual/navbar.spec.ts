import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="navbar" class="navbar">
      <div id="section-first" class="navbar-section">First</div>
      <div id="brand" class="navbar-brand">Spectra</div>
      <div id="center" class="navbar-center">Center</div>
      <div id="section-last" class="navbar-section">Last</div>
    </div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; width: 480px; }
  #fixture .navbar { background: rgb(87 85 217 / 8%); }
  #fixture .navbar-section, #fixture .navbar-center { background: rgb(59 67 81 / 12%); }
`;

const navbarSelectors = ["#navbar", "#section-first", "#brand", "#center", "#section-last"];

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

async function navbarStyles(page: Page) {
  return page.evaluate((selectors) => {
    const snapshot: Record<string, Record<string, string>> = {};
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) {
        snapshot[selector] = { missing: "true" };
        continue;
      }
      const style = getComputedStyle(element);
      snapshot[selector] = {
        alignItems: style.alignItems,
        display: style.display,
        flexBasis: style.flexBasis,
        flexGrow: style.flexGrow,
        flexShrink: style.flexShrink,
        flexWrap: style.flexWrap,
        fontSize: style.fontSize,
        justifyContent: style.justifyContent,
        textDecorationLine: style.textDecorationLine,
      };
    }
    return snapshot;
  }, navbarSelectors);
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy navbar computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await navbarStyles(spectra)).toEqual(await navbarStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy navbar layout and brand typography", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#navbar")).toHaveCSS("display", "flex");
  await expect(page.locator("#navbar")).toHaveCSS("flex-wrap", "wrap");
  await expect(page.locator("#navbar")).toHaveCSS("justify-content", "space-between");
  await expect(page.locator("#navbar")).toHaveCSS("align-items", "stretch");
  await expect(page.locator("#section-first")).toHaveCSS("display", "flex");
  await expect(page.locator("#section-first")).toHaveCSS("flex-grow", "1");
  await expect(page.locator("#section-first")).toHaveCSS("flex-shrink", "0");
  await expect(page.locator("#section-first")).toHaveCSS("flex-basis", "0px");
  await expect(page.locator("#section-first")).toHaveCSS("align-items", "center");
  await expect(page.locator("#section-first")).not.toHaveCSS("justify-content", "flex-end");
  await expect(page.locator("#section-last")).toHaveCSS("justify-content", "flex-end");
  await expect(page.locator("#center")).toHaveCSS("flex-grow", "0");
  await expect(page.locator("#center")).toHaveCSS("flex-shrink", "0");
  await expect(page.locator("#center")).toHaveCSS("flex-basis", "auto");
  await expect(page.locator("#center")).toHaveCSS("align-items", "center");
  await expect(page.locator("#brand")).toHaveCSS("font-size", "18px");
  await expect(page.locator("#brand")).toHaveCSS("text-decoration-line", "none");
});

test("supports global and nested navbar token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root { --spectra-font-size-lg: 23px; }
      .theme-a { --spectra-font-size-lg: 27px; }
      .theme-b { --spectra-font-size-lg: 31px; }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <div class="navbar"><span id="global-brand" class="navbar-brand">G</span></div>
      <div class="theme-a"><div class="navbar"><span id="a-brand" class="navbar-brand">A</span></div></div>
      <div class="theme-b"><div class="navbar"><span id="b-brand" class="navbar-brand">B</span></div></div>
      <div class="navbar"><span id="after-brand" class="navbar-brand">C</span></div>
    `;
  });

  await expect(page.locator("#global-brand")).toHaveCSS("font-size", "23px");
  await expect(page.locator("#a-brand")).toHaveCSS("font-size", "27px");
  await expect(page.locator("#b-brand")).toHaveCSS("font-size", "31px");
  await expect(page.locator("#after-brand")).toHaveCSS("font-size", "23px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .navbar { justify-content: flex-start; }
      .navbar .navbar-center { flex: 0 1 auto; }
      .navbar .navbar-brand { text-decoration: underline; }
    `,
  );

  await expect(page.locator("#navbar")).toHaveCSS("justify-content", "flex-start");
  await expect(page.locator("#center")).toHaveCSS("flex", "0 1 auto");
  await expect(page.locator("#brand")).toHaveCSS("text-decoration-line", "underline");
});
