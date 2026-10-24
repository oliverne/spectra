import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="panel" class="panel">
      <div id="header" class="panel-header">Header</div>
      <div id="nav" class="panel-nav">Nav</div>
      <div id="body" class="panel-body">Body</div>
      <div id="footer" class="panel-footer">Footer</div>
    </div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 480px; }
  #fixture #panel { height: 200px; }
`;

const panelSelectors = ["#panel", "#header", "#nav", "#body", "#footer"];

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

async function panelStyles(page: Page, selectors = panelSelectors) {
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
        borderTopColor: style.borderTopColor,
        borderTopWidth: style.borderTopWidth,
        borderRadius: style.borderRadius,
        display: style.display,
        flex: style.flex,
        flexDirection: style.flexDirection,
        height: style.height,
        overflowY: style.overflowY,
        padding: style.padding,
      };
    }
    return snapshot;
  }, selectors);
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 900 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy panel computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await panelStyles(spectra)).toEqual(await panelStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy panel layout and scrolling", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#panel")).toHaveCSS("display", "flex");
  await expect(page.locator("#panel")).toHaveCSS("flex-direction", "column");
  await expect(page.locator("#panel")).toHaveCSS("border-top-width", "1px");
  await expect(page.locator("#panel")).toHaveCSS("border-top-color", "rgb(218, 222, 228)");
  await expect(page.locator("#panel")).toHaveCSS("border-radius", "2px");

  await expect(page.locator("#header")).toHaveCSS("flex", "0 0 auto");
  await expect(page.locator("#header")).toHaveCSS("padding", "16px");
  await expect(page.locator("#footer")).toHaveCSS("flex", "0 0 auto");
  await expect(page.locator("#footer")).toHaveCSS("padding", "16px");
  await expect(page.locator("#nav")).toHaveCSS("flex", "0 0 auto");
  await expect(page.locator("#body")).toHaveCSS("flex", "1 1 auto");
  await expect(page.locator("#body")).toHaveCSS("overflow-y", "auto");
  await expect(page.locator("#body")).toHaveCSS("padding", "0px 16px");
});

test("supports global and nested panel token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-border: rgb(1 2 3);
        --spectra-border-width: 3px;
        --spectra-border-radius: 7px;
        --spectra-space-4: 11px;
      }
      .theme-a {
        --spectra-color-border: rgb(4 5 6);
        --spectra-border-width: 4px;
        --spectra-border-radius: 13px;
        --spectra-space-4: 15px;
      }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <div id="global" class="panel"><div id="global-body" class="panel-body">Global</div></div>
      <div class="theme-a"><div id="a" class="panel"><div id="a-body" class="panel-body">Theme A</div></div></div>
      <div id="after" class="panel"><div id="after-body" class="panel-body">After</div></div>
    `;
  });

  await expect(page.locator("#global")).toHaveCSS("border-top-color", "rgb(1, 2, 3)");
  await expect(page.locator("#global")).toHaveCSS("border-top-width", "3px");
  await expect(page.locator("#global")).toHaveCSS("border-top-left-radius", "7px");
  await expect(page.locator("#global-body")).toHaveCSS("padding", "0px 11px");

  await expect(page.locator("#a")).toHaveCSS("border-top-color", "rgb(4, 5, 6)");
  await expect(page.locator("#a")).toHaveCSS("border-top-width", "4px");
  await expect(page.locator("#a")).toHaveCSS("border-top-left-radius", "13px");
  await expect(page.locator("#a-body")).toHaveCSS("padding", "0px 15px");

  await expect(page.locator("#after")).toHaveCSS("border-top-color", "rgb(1, 2, 3)");
  await expect(page.locator("#after-body")).toHaveCSS("padding", "0px 11px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .panel { border-color: rgb(7 8 9); border-radius: 9px; }
      .panel .panel-body { padding: 5px; }
    `,
  );

  await expect(page.locator("#panel")).toHaveCSS("border-top-color", "rgb(7, 8, 9)");
  await expect(page.locator("#panel")).toHaveCSS("border-radius", "9px");
  await expect(page.locator("#body")).toHaveCSS("padding", "5px");
});
