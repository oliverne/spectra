import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <button class="btn">Default</button>
    <button class="btn btn-primary">Primary</button>
    <button class="btn btn-success">Success</button>
    <button class="btn btn-error">Error</button>
    <button class="btn active">Active</button>
    <button class="btn" disabled>Disabled</button>
    <button class="btn btn-sm">Small</button>
    <button class="btn btn-lg">Large</button>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; box-sizing: border-box; padding: 20px; width: 720px; }
  #fixture .btn { margin: 4px; transition: none !important; }
`;

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

async function buttonStyles(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      color: style.color,
      cursor: style.cursor,
      fontSize: style.fontSize,
      height: style.height,
      lineHeight: style.lineHeight,
      opacity: style.opacity,
      padding: style.padding,
      pointerEvents: style.pointerEvents,
    };
  });
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy button computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);
  const selectors = [
    ".btn:not([class*=btn-]):not(.active):not([disabled])",
    ".btn-primary",
    ".btn-success",
    ".btn-error",
    ".btn.active",
    ".btn[disabled]",
    ".btn-sm",
    ".btn-lg",
  ];

  for (const selector of selectors) {
    expect(await buttonStyles(spectra, selector)).toEqual(await buttonStyles(legacy, selector));
  }

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("matches legacy hover and focus states", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  await Promise.all([
    legacy.locator(".btn-primary").hover(),
    spectra.locator(".btn-primary").hover(),
  ]);
  expect(await buttonStyles(spectra, ".btn-primary")).toEqual(
    await buttonStyles(legacy, ".btn-primary"),
  );

  await Promise.all([
    legacy.locator(".btn-success").focus(),
    spectra.locator(".btn-success").focus(),
  ]);
  expect(await buttonStyles(spectra, ".btn-success")).toEqual(
    await buttonStyles(legacy, ".btn-success"),
  );
  await context.close();
});

test("supports global and isolated container token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root { --spectra-color-primary: #123456; --spectra-space-2: 9px; }
      #fixture { display: grid; }
      .theme-a { --spectra-color-primary: #a00000; --spectra-space-2: 11px; }
      .theme-b { --spectra-color-primary: #006000; --spectra-space-2: 13px; }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <button id="global" class="btn">Global</button>
      <div class="theme-a"><button id="a" class="btn">A</button></div>
      <div class="theme-b"><button id="b" class="btn">B</button></div>
      <button id="after" class="btn">After</button>
    `;
  });

  await expect(page.locator("#global")).toHaveCSS("color", "rgb(18, 52, 86)");
  await expect(page.locator("#global")).toHaveCSS("padding-right", "9px");
  await expect(page.locator("#a")).toHaveCSS("color", "rgb(160, 0, 0)");
  await expect(page.locator("#a")).toHaveCSS("padding-right", "11px");
  await expect(page.locator("#b")).toHaveCSS("color", "rgb(0, 96, 0)");
  await expect(page.locator("#b")).toHaveCSS("padding-right", "13px");
  await expect(page.locator("#after")).toHaveCSS("color", "rgb(18, 52, 86)");
  await expect(page.locator("#after")).toHaveCSS("padding-right", "9px");
});

test("preserves a later external override", async ({ page }) => {
  await render(page, spectraCss, ".btn { background: rgb(1 2 3); color: rgb(4 5 6); }");
  await expect(page.locator(".btn").first()).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator(".btn").first()).toHaveCSS("color", "rgb(4, 5, 6)");
});
