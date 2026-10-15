import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="hero" class="hero">
      <div id="hero-body" class="hero-body">Hero body</div>
      <div class="hero-body">Second body</div>
    </div>
    <div id="hero-sm" class="hero hero-sm">
      <div class="hero-body">Small hero</div>
    </div>
    <div id="hero-lg" class="hero hero-lg">
      <div class="hero-body">Large hero</div>
    </div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; width: 480px; }
  #fixture .hero { background: rgb(87 85 217 / 8%); }
  #fixture .hero-body { background: rgb(59 67 81 / 12%); }
`;

const heroSelectors = ["#hero", "#hero-sm", "#hero-lg", "#hero-body"];

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

async function heroStyles(page: Page) {
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
        display: style.display,
        flexDirection: style.flexDirection,
        justifyContent: style.justifyContent,
        padding: style.padding,
        paddingBottom: style.paddingBottom,
        paddingTop: style.paddingTop,
      };
    }
    return snapshot;
  }, heroSelectors);
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy hero computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await heroStyles(spectra)).toEqual(await heroStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy hero sizes and default body spacing", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#hero")).toHaveCSS("display", "flex");
  await expect(page.locator("#hero")).toHaveCSS("flex-direction", "column");
  await expect(page.locator("#hero")).toHaveCSS("justify-content", "space-between");
  await expect(page.locator("#hero")).toHaveCSS("padding-top", "80px");
  await expect(page.locator("#hero")).toHaveCSS("padding-bottom", "80px");
  await expect(page.locator("#hero-sm")).toHaveCSS("padding-top", "40px");
  await expect(page.locator("#hero-sm")).toHaveCSS("padding-bottom", "40px");
  await expect(page.locator("#hero-lg")).toHaveCSS("padding-top", "160px");
  await expect(page.locator("#hero-lg")).toHaveCSS("padding-bottom", "160px");
  await expect(page.locator("#hero-body")).toHaveCSS("padding", "8px");
});

test("supports global and nested hero token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root { --spectra-space-2: 10px; }
      .theme-a { --spectra-space-2: 14px; }
      .theme-b { --spectra-space-2: 18px; }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <div class="hero"><div id="global-body" class="hero-body"></div></div>
      <div class="theme-a"><div class="hero"><div id="a-body" class="hero-body"></div></div></div>
      <div class="theme-b"><div class="hero"><div id="b-body" class="hero-body"></div></div></div>
      <div id="after-hero" class="hero"><div id="after-body" class="hero-body"></div></div>
    `;
  });

  await expect(page.locator("#global-body")).toHaveCSS("padding-top", "10px");
  await expect(page.locator("#a-body")).toHaveCSS("padding-top", "14px");
  await expect(page.locator("#b-body")).toHaveCSS("padding-top", "18px");
  await expect(page.locator("#after-body")).toHaveCSS("padding-top", "10px");
  await expect(page.locator("#after-hero")).toHaveCSS("padding-top", "80px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .hero { padding-top: 11px; }
      .hero.hero-sm { padding-bottom: 7px; }
      .hero .hero-body { padding: 3px 5px; }
    `,
  );

  await expect(page.locator("#hero")).toHaveCSS("padding-top", "11px");
  await expect(page.locator("#hero-sm")).toHaveCSS("padding-bottom", "7px");
  await expect(page.locator("#hero-body")).toHaveCSS("padding-top", "3px");
  await expect(page.locator("#hero-body")).toHaveCSS("padding-right", "5px");
});
