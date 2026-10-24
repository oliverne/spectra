import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const transparentGif = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const fixture = `
  <div id="fixture">
    <div id="card" class="card">
      <div id="header" class="card-header">Header</div>
      <div id="body" class="card-body">Body</div>
      <div id="footer" class="card-footer">Footer</div>
    </div>
    <div id="card-image-first" class="card">
      <div id="image-first" class="card-image"><img id="img-first" alt="" width="120" height="60" src="${transparentGif}" /></div>
      <div id="body-first" class="card-body">Body</div>
    </div>
    <div id="card-image-last" class="card">
      <div id="body-last" class="card-body">Body</div>
      <div id="image-last" class="card-image"><img id="img-last" alt="" width="120" height="60" src="${transparentGif}" /></div>
    </div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 480px; }
  #fixture > div { margin-bottom: 8px; }
  #fixture img { background: rgb(0 0 0 / 8%); display: block; }
`;

const cardSelectors = [
  "#card",
  "#header",
  "#body",
  "#footer",
  "#card-image-first",
  "#image-first",
  "#img-first",
  "#card-image-last",
  "#image-last",
  "#img-last",
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

async function cardStyles(page: Page, selectors = cardSelectors) {
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
        borderBottomLeftRadius: style.borderBottomLeftRadius,
        borderBottomRightRadius: style.borderBottomRightRadius,
        borderTopColor: style.borderTopColor,
        borderTopLeftRadius: style.borderTopLeftRadius,
        borderTopRightRadius: style.borderTopRightRadius,
        borderTopWidth: style.borderTopWidth,
        display: style.display,
        flex: style.flex,
        flexDirection: style.flexDirection,
        height: style.height,
        padding: style.padding,
        width: style.width,
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

test("matches legacy card computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await cardStyles(spectra)).toEqual(await cardStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy card sections and image corners", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#card")).toHaveCSS("display", "flex");
  await expect(page.locator("#card")).toHaveCSS("flex-direction", "column");
  await expect(page.locator("#card")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator("#card")).toHaveCSS("border-top-width", "1px");
  await expect(page.locator("#card")).toHaveCSS("border-top-color", "rgb(218, 222, 228)");
  await expect(page.locator("#card")).toHaveCSS("border-radius", "2px");

  await expect(page.locator("#header")).toHaveCSS("padding", "16px 16px 0px");
  await expect(page.locator("#body")).toHaveCSS("padding", "16px 16px 0px");
  await expect(page.locator("#footer")).toHaveCSS("padding", "16px");
  await expect(page.locator("#body")).toHaveCSS("flex", "1 1 auto");

  await expect(page.locator("#image-first")).toHaveCSS("padding-top", "0px");
  await expect(page.locator("#image-last")).toHaveCSS("padding-top", "16px");
  await expect(page.locator("#img-first")).toHaveCSS("border-top-left-radius", "2px");
  await expect(page.locator("#img-first")).toHaveCSS("border-top-right-radius", "2px");
  await expect(page.locator("#img-first")).toHaveCSS("border-bottom-left-radius", "0px");
  await expect(page.locator("#img-last")).toHaveCSS("border-bottom-left-radius", "2px");
  await expect(page.locator("#img-last")).toHaveCSS("border-bottom-right-radius", "2px");
  await expect(page.locator("#img-last")).toHaveCSS("border-top-left-radius", "0px");
});

test("supports global and nested card token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-background: rgb(1 2 3);
        --spectra-color-border: rgb(4 5 6);
        --spectra-border-width: 3px;
        --spectra-border-radius: 7px;
        --spectra-space-4: 11px;
      }
      .theme-a {
        --spectra-color-background: rgb(7 8 9);
        --spectra-color-border: rgb(10 11 12);
        --spectra-border-width: 4px;
        --spectra-border-radius: 13px;
        --spectra-space-4: 15px;
      }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <div id="global" class="card"><div id="global-body" class="card-body">Global</div></div>
      <div class="theme-a"><div id="a" class="card"><div id="a-body" class="card-body">Theme A</div></div></div>
      <div id="after" class="card"><div id="after-body" class="card-body">After</div></div>
    `;
  });

  await expect(page.locator("#global")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#global")).toHaveCSS("border-top-color", "rgb(4, 5, 6)");
  await expect(page.locator("#global")).toHaveCSS("border-top-width", "3px");
  await expect(page.locator("#global")).toHaveCSS("border-top-left-radius", "7px");
  await expect(page.locator("#global-body")).toHaveCSS("padding", "11px");

  await expect(page.locator("#a")).toHaveCSS("background-color", "rgb(7, 8, 9)");
  await expect(page.locator("#a")).toHaveCSS("border-top-color", "rgb(10, 11, 12)");
  await expect(page.locator("#a")).toHaveCSS("border-top-width", "4px");
  await expect(page.locator("#a")).toHaveCSS("border-top-left-radius", "13px");
  await expect(page.locator("#a-body")).toHaveCSS("padding", "15px");

  await expect(page.locator("#after")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#after-body")).toHaveCSS("padding", "11px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .card { border-color: rgb(7 8 9); border-radius: 9px; }
      .card .card-body { padding: 5px; }
    `,
  );

  await expect(page.locator("#card")).toHaveCSS("border-top-color", "rgb(7, 8, 9)");
  await expect(page.locator("#card")).toHaveCSS("border-radius", "9px");
  await expect(page.locator("#body")).toHaveCSS("padding", "5px");
});
