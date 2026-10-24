import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="tile" class="tile">
      <div id="icon" class="tile-icon">I</div>
      <div id="content" class="tile-content">
        <div id="title" class="tile-title">Title</div>
        <div id="subtitle" class="tile-subtitle">Subtitle</div>
      </div>
      <div id="action" class="tile-action">A</div>
    </div>
    <div id="centered" class="tile tile-centered">
      <div id="centered-icon" class="tile-icon">I</div>
      <div id="centered-content" class="tile-content">
        <div id="centered-title" class="tile-title">A very long tile title that must be truncated</div>
        <div id="centered-subtitle" class="tile-subtitle">A very long tile subtitle that must be truncated</div>
      </div>
    </div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 480px; }
  #fixture #tile, #fixture #centered { margin-bottom: 12px; }
  #fixture #centered, #fixture #centered .tile-content { min-width: 0; }
`;

const tileSelectors = [
  "#tile",
  "#icon",
  "#content",
  "#title",
  "#subtitle",
  "#action",
  "#centered",
  "#centered-content",
  "#centered-title",
  "#centered-subtitle",
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

async function tileStyles(page: Page, selectors = tileSelectors) {
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
        alignContent: style.alignContent,
        alignItems: style.alignItems,
        display: style.display,
        flex: style.flex,
        lineHeight: style.lineHeight,
        marginBottom: style.marginBottom,
        overflow: style.overflow,
        padding: style.padding,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
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

test("matches legacy tile computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await tileStyles(spectra)).toEqual(await tileStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy tile content spacing and centering", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#tile")).toHaveCSS("display", "flex");
  await expect(page.locator("#tile")).toHaveCSS("align-content", "space-between");
  await expect(page.locator("#tile")).toHaveCSS("align-items", "flex-start");
  await expect(page.locator("#icon")).toHaveCSS("flex", "0 0 auto");
  await expect(page.locator("#action")).toHaveCSS("flex", "0 0 auto");
  await expect(page.locator("#content")).toHaveCSS("flex", "1 1 auto");
  await expect(page.locator("#content")).toHaveCSS("padding", "0px 8px");
  await expect(page.locator("#title")).toHaveCSS("line-height", "24px");
  await expect(page.locator("#subtitle")).toHaveCSS("line-height", "24px");

  await expect(page.locator("#centered")).toHaveCSS("align-items", "center");
  await expect(page.locator("#centered-content")).toHaveCSS("overflow", "hidden");
  await expect(page.locator("#centered-content")).toHaveCSS("padding", "0px 0px 0px 8px");
  await expect(page.locator("#centered-title")).toHaveCSS("overflow", "hidden");
  await expect(page.locator("#centered-title")).toHaveCSS("text-overflow", "ellipsis");
  await expect(page.locator("#centered-title")).toHaveCSS("white-space", "nowrap");
  await expect(page.locator("#centered-title")).toHaveCSS("margin-bottom", "0px");
  await expect(page.locator("#centered-subtitle")).toHaveCSS("text-overflow", "ellipsis");
});

test("supports global and nested tile token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root { --spectra-space-2: 11px; --spectra-line-height: 3rem; }
      .theme-a { --spectra-space-2: 15px; --spectra-line-height: 4rem; }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <div id="global" class="tile">
        <div class="tile-icon">I</div>
        <div id="global-content" class="tile-content"><div id="global-title" class="tile-title">Global</div></div>
      </div>
      <div class="theme-a">
        <div id="a" class="tile">
          <div class="tile-icon">I</div>
          <div id="a-content" class="tile-content"><div id="a-title" class="tile-title">Theme A</div></div>
        </div>
      </div>
      <div id="after" class="tile">
        <div class="tile-icon">I</div>
        <div id="after-content" class="tile-content"><div id="after-title" class="tile-title">After</div></div>
      </div>
    `;
  });

  await expect(page.locator("#global-content")).toHaveCSS("padding-left", "11px");
  await expect(page.locator("#global-content")).toHaveCSS("padding-right", "0px");
  await expect(page.locator("#global-title")).toHaveCSS("line-height", "60px");

  await expect(page.locator("#a-content")).toHaveCSS("padding-left", "15px");
  await expect(page.locator("#a-title")).toHaveCSS("line-height", "80px");

  await expect(page.locator("#after-content")).toHaveCSS("padding-left", "11px");
  await expect(page.locator("#after-title")).toHaveCSS("line-height", "60px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .tile { align-items: stretch; }
      .tile .tile-content:not(:first-child) { padding-left: 9px; }
      .tile .tile-title { line-height: 30px; }
    `,
  );

  await expect(page.locator("#tile")).toHaveCSS("align-items", "stretch");
  await expect(page.locator("#content")).toHaveCSS("padding-left", "9px");
  await expect(page.locator("#title")).toHaveCSS("line-height", "30px");
});
