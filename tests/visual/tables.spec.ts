import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <table id="plain" class="table">
      <tbody>
        <tr id="plain-row"><td id="plain-td">a</td><th id="plain-th">b</th></tr>
      </tbody>
    </table>
    <table id="striped" class="table table-striped">
      <tbody>
        <tr id="striped-odd"><td>odd</td></tr>
        <tr id="striped-even"><td>even</td></tr>
        <tr id="striped-odd-2"><td>odd</td></tr>
      </tbody>
    </table>
    <table id="active" class="table">
      <tbody>
        <tr id="active-row" class="active"><td>active</td></tr>
      </tbody>
    </table>
    <table id="active-striped" class="table table-striped">
      <tbody>
        <tr id="active-striped-row" class="active"><td>active</td></tr>
      </tbody>
    </table>
    <table id="hover" class="table table-hover">
      <tbody>
        <tr id="hover-row"><td>hover</td></tr>
      </tbody>
    </table>
    <table id="scroll" class="table table-scroll">
      <tbody>
        <tr><td>scroll</td></tr>
      </tbody>
    </table>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 640px; }
  #fixture .table { margin-bottom: 8px; }
  #fixture .table td, #fixture .table th { background: transparent; }
`;

const tableSelectors = [
  "#plain",
  "#plain-td",
  "#plain-th",
  "#striped",
  "#striped-odd",
  "#striped-even",
  "#striped-odd-2",
  "#active-row",
  "#active-striped-row",
  "#hover-row",
  "#scroll",
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

async function tableStyles(page: Page) {
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
        backgroundColor: style.backgroundColor,
        borderBottomColor: style.borderBottomColor,
        borderBottomStyle: style.borderBottomStyle,
        borderBottomWidth: style.borderBottomWidth,
        borderCollapse: style.borderCollapse,
        borderSpacing: style.borderSpacing,
        display: style.display,
        overflowX: style.overflowX,
        padding: style.padding,
        paddingBottom: style.paddingBottom,
        textAlign: style.textAlign,
        whiteSpace: style.whiteSpace,
        width: style.width,
      };
    }
    return snapshot;
  }, tableSelectors);
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 900 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy table computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await tableStyles(spectra)).toEqual(await tableStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("matches legacy striped, active, and hover row backgrounds", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  await expect(spectra.locator("#striped-odd")).toHaveCSS("background-color", "rgb(247, 248, 249)");
  await expect(spectra.locator("#striped-even")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(spectra.locator("#active-row")).toHaveCSS("background-color", "rgb(238, 240, 243)");
  await expect(spectra.locator("#active-striped-row")).toHaveCSS(
    "background-color",
    "rgb(238, 240, 243)",
  );

  await Promise.all([legacy.locator("#hover-row").hover(), spectra.locator("#hover-row").hover()]);
  expect(await tableStyles(spectra)).toEqual(await tableStyles(legacy));
  await expect(spectra.locator("#hover-row")).toHaveCSS("background-color", "rgb(238, 240, 243)");
  await context.close();
});

test("keeps legacy table borders, padding, and scroll behavior", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#plain")).toHaveCSS("border-collapse", "collapse");
  await expect(page.locator("#plain")).toHaveCSS("text-align", "left");
  await expect(page.locator("#plain")).toHaveCSS("width", "616px");
  await expect(page.locator("#plain-td")).toHaveCSS("padding", "12px 8px");
  await expect(page.locator("#plain-td")).toHaveCSS("border-bottom-width", "1px");
  await expect(page.locator("#plain-td")).toHaveCSS("border-bottom-color", "rgb(218, 222, 228)");
  await expect(page.locator("#plain-th")).toHaveCSS("border-bottom-width", "2px");
  await expect(page.locator("#scroll")).toHaveCSS("display", "block");
  await expect(page.locator("#scroll")).toHaveCSS("overflow-x", "auto");
  await expect(page.locator("#scroll")).toHaveCSS("padding-bottom", "15px");
  await expect(page.locator("#scroll")).toHaveCSS("white-space", "nowrap");
});

test("supports global and nested table token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-background-subtle: rgb(1 2 3);
        --spectra-color-background-muted: rgb(4 5 6);
        --spectra-border-width-lg: 5px;
      }
      .theme-a {
        --spectra-color-background-subtle: rgb(7 8 9);
        --spectra-color-background-muted: rgb(10 11 12);
      }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <table class="table table-striped"><tbody><tr id="global-striped"><td>a</td></tr></tbody></table>
      <table class="table"><tbody><tr><th id="global-th">b</th></tr></tbody></table>
      <div class="theme-a">
        <table class="table table-striped"><tbody><tr id="a-striped"><td>a</td></tr></tbody></table>
        <table class="table"><tbody><tr><th id="a-th">b</th></tr></tbody></table>
      </div>
      <table class="table table-striped"><tbody><tr id="after-striped"><td>a</td></tr></tbody></table>
    `;
  });

  await expect(page.locator("#global-striped")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#a-striped")).toHaveCSS("background-color", "rgb(7, 8, 9)");
  await expect(page.locator("#after-striped")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#global-th")).toHaveCSS("border-bottom-width", "5px");
  await expect(page.locator("#a-th")).toHaveCSS("border-bottom-width", "5px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .table.table-striped tbody tr:nth-of-type(odd) { background: rgb(1 2 3); }
      .table td, .table th { padding: 3px 5px; }
    `,
  );

  await expect(page.locator("#striped-odd")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#plain-td")).toHaveCSS("padding", "3px 5px");
});
