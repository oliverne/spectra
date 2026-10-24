import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <span id="label" class="label">default label</span>
    <span id="rounded" class="label label-rounded">rounded label</span>
    <span id="rounded-primary" class="label label-rounded label-primary">rounded primary</span>
    <span id="primary" class="label label-primary">primary</span>
    <span id="secondary" class="label label-secondary">secondary</span>
    <span id="success" class="label label-success">success</span>
    <span id="warning" class="label label-warning">warning</span>
    <span id="error" class="label label-error">error</span>
    <small id="small" class="label">small label</small>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 640px; }
  #fixture .label { margin: 0 4px 4px 0; }
`;

const labelSelectors = [
  "#label",
  "#rounded",
  "#rounded-primary",
  "#primary",
  "#secondary",
  "#success",
  "#warning",
  "#error",
  "#small",
];

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

async function labelStyles(page: Page, selectors = labelSelectors) {
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
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        padding: style.padding,
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

test("matches legacy label computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await labelStyles(spectra)).toEqual(await labelStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy label variants and size inheritance", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#label")).toHaveCSS("display", "inline-block");
  await expect(page.locator("#label")).toHaveCSS("background-color", "rgb(238, 240, 243)");
  await expect(page.locator("#label")).toHaveCSS("color", "rgb(69, 80, 96)");
  await expect(page.locator("#label")).toHaveCSS("border-radius", "2px");
  await expect(page.locator("#label")).toHaveCSS("padding", "2px 4px");
  await expect(page.locator("#label")).toHaveCSS("line-height", "20px");

  await expect(page.locator("#rounded")).toHaveCSS("border-radius", "100px");
  await expect(page.locator("#rounded")).toHaveCSS("padding-left", "8px");
  await expect(page.locator("#rounded")).toHaveCSS("padding-right", "8px");
  await expect(page.locator("#rounded-primary")).toHaveCSS("background-color", "rgb(87, 85, 217)");
  await expect(page.locator("#rounded-primary")).toHaveCSS("border-radius", "100px");

  await expect(page.locator("#primary")).toHaveCSS("background-color", "rgb(87, 85, 217)");
  await expect(page.locator("#primary")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("#secondary")).toHaveCSS("background-color", "rgb(241, 241, 252)");
  await expect(page.locator("#secondary")).toHaveCSS("color", "rgb(87, 85, 217)");
  await expect(page.locator("#success")).toHaveCSS("background-color", "rgb(50, 182, 67)");
  await expect(page.locator("#warning")).toHaveCSS("background-color", "rgb(255, 183, 0)");
  await expect(page.locator("#error")).toHaveCSS("background-color", "rgb(232, 86, 0)");
  await expect(page.locator("#warning")).toHaveCSS("color", "rgb(255, 255, 255)");

  expect(await numericStyle(page, "#label", "fontSize")).toBeCloseTo(16, 1);
  expect(await numericStyle(page, "#small", "fontSize")).toBeCloseTo(12.8, 1);
});

test("supports global and nested label token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-background-muted: rgb(1 2 3);
        --spectra-color-text-soft: rgb(4 5 6);
        --spectra-color-primary: rgb(7 8 9);
        --spectra-color-on-accent: rgb(10 11 12);
        --spectra-space-half: 5px;
        --spectra-space-1: 15px;
        --spectra-space-2: 25px;
      }
      .theme-a {
        --spectra-color-background-muted: rgb(20 21 22);
        --spectra-color-text-soft: rgb(23 24 25);
        --spectra-color-primary: rgb(26 27 28);
        --spectra-color-on-accent: rgb(29 30 31);
        --spectra-space-half: 35px;
        --spectra-space-1: 45px;
        --spectra-space-2: 55px;
      }
      #fixture { display: grid; gap: 4px; justify-items: start; }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <span id="global" class="label">Global</span>
      <span id="global-rounded" class="label label-rounded">Global rounded</span>
      <div class="theme-a">
        <span id="a" class="label">Theme A</span>
        <span id="a-primary" class="label label-primary">Theme A primary</span>
      </div>
      <span id="after" class="label">After</span>
    `;
  });

  await expect(page.locator("#global")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#global")).toHaveCSS("color", "rgb(4, 5, 6)");
  await expect(page.locator("#global")).toHaveCSS("padding", "5px 15px");
  await expect(page.locator("#global-rounded")).toHaveCSS("padding-left", "25px");

  await expect(page.locator("#a")).toHaveCSS("background-color", "rgb(20, 21, 22)");
  await expect(page.locator("#a")).toHaveCSS("color", "rgb(23, 24, 25)");
  await expect(page.locator("#a")).toHaveCSS("padding", "35px 45px");
  await expect(page.locator("#a-primary")).toHaveCSS("background-color", "rgb(26, 27, 28)");
  await expect(page.locator("#a-primary")).toHaveCSS("color", "rgb(29, 30, 31)");

  await expect(page.locator("#after")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#after")).toHaveCSS("padding", "5px 15px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .label { background: rgb(7 8 9); color: rgb(10 11 12); }
      .label.label-rounded { border-radius: 12px; }
    `,
  );

  await expect(page.locator("#label")).toHaveCSS("background-color", "rgb(7, 8, 9)");
  await expect(page.locator("#label")).toHaveCSS("color", "rgb(10, 11, 12)");
  await expect(page.locator("#rounded")).toHaveCSS("border-radius", "12px");
});
