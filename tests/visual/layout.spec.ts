import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="container" class="container"></div>
    <div id="grid-xs" class="container grid-xs"></div>
    <div id="grid-sm" class="container grid-sm"></div>
    <div id="grid-md" class="container grid-md"></div>
    <div id="grid-lg" class="container grid-lg"></div>
    <div id="grid-xl" class="container grid-xl"></div>
    <div id="columns" class="columns">
      <div id="col-1" class="column col-1"></div>
      <div id="col-2" class="column col-2"></div>
      <div id="col-3" class="column col-3"></div>
      <div id="col-4" class="column col-4"></div>
      <div id="col-5" class="column col-5"></div>
      <div id="col-6" class="column col-6"></div>
      <div id="col-7" class="column col-7"></div>
      <div id="col-8" class="column col-8"></div>
      <div id="col-9" class="column col-9"></div>
      <div id="col-10" class="column col-10"></div>
      <div id="col-11" class="column col-11"></div>
      <div id="col-12" class="column col-12"></div>
      <div id="col-auto" class="column col-auto"></div>
      <div id="column" class="column"></div>
      <div id="col-xl-6" class="column col-xl-6"></div>
      <div id="col-lg-6" class="column col-lg-6"></div>
      <div id="col-md-6" class="column col-md-6"></div>
      <div id="col-sm-6" class="column col-sm-6"></div>
      <div id="col-xs-6" class="column col-xs-6"></div>
    </div>
    <div id="cols" class="cols">
      <div class="column col-6"></div>
    </div>
    <div id="gapless" class="cols col-gapless">
      <div id="gapless-column" class="column"></div>
    </div>
    <div id="oneline" class="cols col-oneline">
      <div class="column col-6"></div>
      <div class="column col-6"></div>
    </div>
    <div id="mx-auto" class="column col-mx-auto"></div>
    <div id="ml-auto" class="column col-ml-auto"></div>
    <div id="mr-auto" class="column col-mr-auto"></div>
    <div id="show-xs" class="show-xs"></div>
    <div id="show-sm" class="show-sm"></div>
    <div id="show-md" class="show-md"></div>
    <div id="show-lg" class="show-lg"></div>
    <div id="show-xl" class="show-xl"></div>
    <div id="hide-xs" class="hide-xs"></div>
    <div id="hide-sm" class="hide-sm"></div>
    <div id="hide-md" class="hide-md"></div>
    <div id="hide-lg" class="hide-lg"></div>
    <div id="hide-xl" class="hide-xl"></div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; overflow: hidden; width: 100%; }
  #fixture .container { height: 12px; }
  #fixture .column { background: rgb(59 67 81 / 12%); height: 8px; }
  #fixture .columns, #fixture .cols { background: rgb(87 85 217 / 8%); }
  #fixture #mx-auto, #fixture #ml-auto, #fixture #mr-auto { flex: none; width: 40px; }
`;

const layoutSelectors = [
  "#container",
  "#grid-xs",
  "#grid-sm",
  "#grid-md",
  "#grid-lg",
  "#grid-xl",
  "#columns",
  "#cols",
  "#gapless",
  "#gapless-column",
  "#oneline",
  "#column",
  "#col-1",
  "#col-2",
  "#col-3",
  "#col-4",
  "#col-5",
  "#col-6",
  "#col-7",
  "#col-8",
  "#col-9",
  "#col-10",
  "#col-11",
  "#col-12",
  "#col-auto",
  "#col-xl-6",
  "#col-lg-6",
  "#col-md-6",
  "#col-sm-6",
  "#col-xs-6",
  "#mx-auto",
  "#ml-auto",
  "#mr-auto",
  "#show-xs",
  "#show-sm",
  "#show-md",
  "#show-lg",
  "#show-xl",
  "#hide-xs",
  "#hide-sm",
  "#hide-md",
  "#hide-lg",
  "#hide-xl",
];

const responsiveBreakpoints = [
  ["xs", 480],
  ["sm", 600],
  ["md", 840],
  ["lg", 960],
  ["xl", 1280],
] as const;

const breakpointViewports = responsiveBreakpoints.flatMap(([, breakpoint]) => [
  breakpoint - 1,
  breakpoint,
  breakpoint + 1,
]);

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

async function layoutStyles(page: Page) {
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
        flexBasis: style.flexBasis,
        flexGrow: style.flexGrow,
        flexShrink: style.flexShrink,
        flexWrap: style.flexWrap,
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
        maxWidth: style.maxWidth,
        overflowX: style.overflowX,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        width: style.width,
      };
    }
    return snapshot;
  }, layoutSelectors);
}

function expectedVisibility(width: number) {
  const expected: Record<string, string> = {};
  for (const [suffix, breakpoint] of responsiveBreakpoints) {
    const visible = width <= breakpoint;
    expected[`#show-${suffix}`] = visible ? "block" : "none";
    expected[`#hide-${suffix}`] = visible ? "none" : "block";
  }
  return expected;
}

// Lightning CSS stores numbers as float32 and serializes six significant digits, so legacy
// percentages such as 8.33333333% arrive as 8.33333% in the new bundle. Affected column widths can
// land one layout unit away from the legacy bundle once the browser snaps to its own 1/60px or
// 1/64px grid, and the serialized computed values are rounded again. Compare resolved lengths with
// this documented tolerance while keeping every other value exact.
const layoutUnitTolerance = 0.05;

function pixelValue(value: string | undefined) {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value ?? "");
  return match ? Number(match[1]) : null;
}

function expectComputedStylesToMatch(
  spectraStyles: Record<string, Record<string, string>>,
  legacyStyles: Record<string, Record<string, string>>,
  label: string,
) {
  expect(Object.keys(spectraStyles).sort(), label).toEqual(Object.keys(legacyStyles).sort());
  for (const selector of Object.keys(legacyStyles)) {
    for (const [property, legacyValue] of Object.entries(legacyStyles[selector])) {
      const spectraValue = spectraStyles[selector]?.[property];
      const legacyPixels = pixelValue(legacyValue);
      const spectraPixels = pixelValue(spectraValue);
      if (legacyPixels === null || spectraPixels === null) {
        expect(spectraValue, `${label} ${selector} ${property}`).toBe(legacyValue);
      } else {
        expect(
          Math.abs(spectraPixels - legacyPixels),
          `${label} ${selector} ${property}: ${spectraValue} vs ${legacyValue}`,
        ).toBeLessThanOrEqual(layoutUnitTolerance);
      }
    }
  }
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy layout computed styles at responsive boundaries", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  for (const width of breakpointViewports) {
    await Promise.all([
      legacy.setViewportSize({ width, height: 720 }),
      spectra.setViewportSize({ width, height: 720 }),
    ]);
    const [legacyStyles, spectraStyles] = await Promise.all([
      layoutStyles(legacy),
      layoutStyles(spectra),
    ]);

    expectComputedStylesToMatch(spectraStyles, legacyStyles, `computed styles at ${width}px`);

    for (const [selector, display] of Object.entries(expectedVisibility(width))) {
      expect(spectraStyles[selector]?.display, `${selector} at ${width}px`).toBe(display);
    }
  }

  await context.close();
});

test("matches legacy layout pixels at responsive boundaries", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  for (const width of [480, 600, 840, 960, 1280, 1281]) {
    await Promise.all([
      legacy.setViewportSize({ width, height: 720 }),
      spectra.setViewportSize({ width, height: 720 }),
    ]);
    const [legacyScreenshot, spectraScreenshot] = await Promise.all([
      legacy.locator("#fixture").screenshot(),
      spectra.locator("#fixture").screenshot(),
    ]);

    expect(spectraScreenshot, `pixels at ${width}px`).toEqual(legacyScreenshot);
  }

  await context.close();
});

test("keeps legacy container sizes and default gutter", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#container")).toHaveCSS("padding-left", "8px");
  await expect(page.locator("#container")).toHaveCSS("padding-right", "8px");
  await expect(page.locator("#columns")).toHaveCSS("margin-left", "-8px");
  await expect(page.locator("#columns")).toHaveCSS("margin-right", "-8px");
  await expect(page.locator("#col-6")).toHaveCSS("padding-left", "8px");
  await expect(page.locator("#grid-xs")).toHaveCSS("max-width", "496px");
  await expect(page.locator("#grid-sm")).toHaveCSS("max-width", "616px");
  await expect(page.locator("#grid-md")).toHaveCSS("max-width", "856px");
  await expect(page.locator("#grid-lg")).toHaveCSS("max-width", "976px");
  await expect(page.locator("#grid-xl")).toHaveCSS("max-width", "1296px");
});

test("supports global and nested container token overrides", async ({ page }) => {
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
      <div id="global-container" class="container"></div>
      <div id="global" class="columns"><div id="global-column" class="column"></div></div>
      <div class="theme-a">
        <div id="a-container" class="container"></div>
        <div id="a" class="columns"><div id="a-column" class="column"></div></div>
      </div>
      <div class="theme-b">
        <div id="b-container" class="container"></div>
        <div id="b" class="columns"><div id="b-column" class="column"></div></div>
      </div>
      <div id="after" class="columns"><div id="after-column" class="column"></div></div>
    `;
  });

  await expect(page.locator("#global-container")).toHaveCSS("padding-left", "10px");
  await expect(page.locator("#global")).toHaveCSS("margin-left", "-10px");
  await expect(page.locator("#global-column")).toHaveCSS("padding-left", "10px");
  await expect(page.locator("#a-container")).toHaveCSS("padding-left", "14px");
  await expect(page.locator("#a")).toHaveCSS("margin-left", "-14px");
  await expect(page.locator("#a-column")).toHaveCSS("padding-left", "14px");
  await expect(page.locator("#b-container")).toHaveCSS("padding-left", "18px");
  await expect(page.locator("#b")).toHaveCSS("margin-left", "-18px");
  await expect(page.locator("#b-column")).toHaveCSS("padding-left", "18px");
  await expect(page.locator("#after")).toHaveCSS("margin-left", "-10px");
  await expect(page.locator("#after-column")).toHaveCSS("padding-left", "10px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .container { padding-left: 3px; padding-right: 5px; }
      .columns { margin-left: -3px; margin-right: -5px; }
      .column { padding-left: 7px; }
    `,
  );

  await expect(page.locator("#container")).toHaveCSS("padding-left", "3px");
  await expect(page.locator("#container")).toHaveCSS("padding-right", "5px");
  await expect(page.locator("#columns")).toHaveCSS("margin-left", "-3px");
  await expect(page.locator("#col-6")).toHaveCSS("padding-left", "7px");
});
