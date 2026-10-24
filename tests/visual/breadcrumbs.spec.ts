import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <ul id="breadcrumb" class="breadcrumb">
      <li id="item-1" class="breadcrumb-item"><a id="link-1" href="#breadcrumbs">Home</a></li>
      <li id="item-2" class="breadcrumb-item"><a id="link-2" href="#breadcrumbs">Library</a></li>
      <li id="item-3" class="breadcrumb-item">Data</li>
    </ul>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 480px; }
`;

const itemSelectors = ["#breadcrumb", "#item-1", "#item-2", "#item-3", "#link-1", "#link-2"];

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

async function breadcrumbStyles(page: Page, selectors = itemSelectors) {
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
        color: style.color,
        display: style.display,
        listStyleType: style.listStyleType,
        margin: style.margin,
        marginRight: style.marginRight,
        padding: style.padding,
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
        paddingRight: style.paddingRight,
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

test("matches legacy breadcrumb computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await breadcrumbStyles(spectra)).toEqual(await breadcrumbStyles(legacy));
  expect(await beforeStyles(spectra, ["#item-2", "#item-3"])).toEqual(
    await beforeStyles(legacy, ["#item-2", "#item-3"]),
  );

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy breadcrumb separators and link colors", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#breadcrumb")).toHaveCSS("list-style-type", "none");
  await expect(page.locator("#breadcrumb")).toHaveCSS("margin", "4px 0px");
  await expect(page.locator("#breadcrumb")).toHaveCSS("padding", "4px 0px");

  await expect(page.locator("#item-1")).toHaveCSS("color", "rgb(102, 117, 140)");
  await expect(page.locator("#item-1")).toHaveCSS("display", "inline-block");
  await expect(page.locator("#item-1")).toHaveCSS("margin-top", "0px");
  await expect(page.locator("#item-1")).toHaveCSS("padding", "4px 0px");
  await expect(page.locator("#item-1")).toHaveCSS("margin-right", "4px");
  await expect(page.locator("#item-3")).toHaveCSS("margin-right", "0px");
  await expect(page.locator("#link-1")).toHaveCSS("color", "rgb(102, 117, 140)");

  const before = await beforeStyles(page, ["#item-2", "#item-3"]);
  expect(before["#item-2"]).toEqual({
    color: "rgb(102, 117, 140)",
    content: '"/"',
    paddingRight: "8px",
  });
  expect(before["#item-3"]).toEqual(before["#item-2"]);
});

test("supports global and nested breadcrumb token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-text-muted: rgb(1 2 3);
        --spectra-space-1: 11px;
        --spectra-space-2: 22px;
      }
      .theme-a {
        --spectra-color-text-muted: rgb(4 5 6);
        --spectra-space-1: 33px;
        --spectra-space-2: 44px;
      }
      #fixture { display: grid; gap: 4px; justify-items: start; }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <ul id="global" class="breadcrumb">
        <li id="global-first" class="breadcrumb-item">One</li>
        <li id="global-last" class="breadcrumb-item">Two</li>
      </ul>
      <div class="theme-a">
        <ul id="a" class="breadcrumb">
          <li id="a-first" class="breadcrumb-item">One</li>
          <li id="a-last" class="breadcrumb-item">Two</li>
        </ul>
      </div>
      <ul id="after" class="breadcrumb">
        <li id="after-first" class="breadcrumb-item">One</li>
        <li id="after-last" class="breadcrumb-item">Two</li>
      </ul>
    `;
  });

  await expect(page.locator("#global-first")).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(page.locator("#global-first")).toHaveCSS("padding", "11px 0px");
  await expect(page.locator("#global")).toHaveCSS("margin", "11px 0px");
  await expect(page.locator("#global-first")).toHaveCSS("margin-right", "11px");

  await expect(page.locator("#a-first")).toHaveCSS("color", "rgb(4, 5, 6)");
  await expect(page.locator("#a-first")).toHaveCSS("padding", "33px 0px");
  await expect(page.locator("#a")).toHaveCSS("margin", "33px 0px");

  await expect(page.locator("#after-first")).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(page.locator("#after-first")).toHaveCSS("padding", "11px 0px");

  const before = await beforeStyles(page, ["#global-last"]);
  expect(before["#global-last"].paddingRight).toBe("22px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .breadcrumb .breadcrumb-item { color: rgb(7 8 9); padding: 9px 0; }
      .breadcrumb .breadcrumb-item:not(:first-child)::before { color: rgb(10 11 12); }
    `,
  );

  await expect(page.locator("#item-1")).toHaveCSS("color", "rgb(7, 8, 9)");
  await expect(page.locator("#item-1")).toHaveCSS("padding", "9px 0px");
  const before = await beforeStyles(page, ["#item-2"]);
  expect(before["#item-2"].color).toBe("rgb(10, 11, 12)");
});
