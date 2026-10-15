import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <h1 id="h1">Heading 1</h1>
    <h2 id="h2">Heading 2</h2>
    <h3 id="h3">Heading 3</h3>
    <h4 id="h4">Heading 4</h4>
    <h5 id="h5">Heading 5</h5>
    <h6 id="h6">Heading 6</h6>
    <span id="h1-class" class="h1">H1 class</span>
    <p id="p">Paragraph</p>
    <a id="a" href="#">Link</a>
    <ins id="ins">Inserted</ins>
    <u id="u">Underline</u>
    <abbr id="abbr" title="abbreviation">abbr</abbr>
    <kbd id="kbd">Ctrl</kbd>
    <mark id="mark">mark</mark>
    <blockquote id="blockquote"><p id="blockquote-p">Quote</p></blockquote>
    <ul id="ul">
      <li id="ul-li">one</li>
      <li>two<ul id="ul-ul"><li>nested</li></ul></li>
    </ul>
    <ol id="ol">
      <li>one</li>
      <li>two<ol id="ol-ol"><li>nested</li></ol></li>
    </ol>
    <dl id="dl"><dt id="dt">term</dt><dd id="dd">definition</dd></dl>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 640px; }
`;

const typographySelectors = [
  "#h1",
  "#h2",
  "#h3",
  "#h4",
  "#h5",
  "#h6",
  "#h1-class",
  "#p",
  "#a",
  "#ins",
  "#u",
  "#abbr",
  "#kbd",
  "#mark",
  "#blockquote",
  "#blockquote-p",
  "#ul",
  "#ul-li",
  "#ul-ul",
  "#ol",
  "#ol-ol",
  "#dl",
  "#dt",
  "#dd",
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

async function typographyStyles(page: Page) {
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
        borderBottom: style.borderBottom,
        borderRadius: style.borderRadius,
        color: style.color,
        cursor: style.cursor,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        listStyle: style.listStyle,
        listStyleType: style.listStyleType,
        margin: style.margin,
        marginBottom: style.marginBottom,
        marginLeft: style.marginLeft,
        marginTop: style.marginTop,
        padding: style.padding,
        textDecoration: style.textDecoration,
      };
    }
    return snapshot;
  }, typographySelectors);
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 900 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy typography computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await typographyStyles(spectra)).toEqual(await typographyStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy heading sizes, emphasis, and list defaults", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#h1")).toHaveCSS("font-size", "40px");
  await expect(page.locator("#h2")).toHaveCSS("font-size", "32px");
  await expect(page.locator("#h3")).toHaveCSS("font-size", "28px");
  await expect(page.locator("#h4")).toHaveCSS("font-size", "24px");
  await expect(page.locator("#h5")).toHaveCSS("font-size", "20px");
  await expect(page.locator("#h6")).toHaveCSS("font-size", "16px");
  await expect(page.locator("#h1")).toHaveCSS("font-weight", "500");
  await expect(page.locator("#h1")).toHaveCSS("line-height", "48px");
  await expect(page.locator("#h1-class")).toHaveCSS("font-weight", "500");
  await expect(page.locator("#p")).toHaveCSS("margin-bottom", "24px");
  await expect(page.locator("#abbr")).toHaveCSS("cursor", "help");
  await expect(page.locator("#abbr")).toHaveCSS("border-bottom-style", "dotted");
  await expect(page.locator("#kbd")).toHaveCSS("background-color", "rgb(48, 55, 66)");
  await expect(page.locator("#kbd")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("#mark")).toHaveCSS("background-color", "rgb(255, 233, 179)");
  await expect(page.locator("#mark")).toHaveCSS("border-bottom-color", "rgb(255, 211, 103)");
  await expect(page.locator("#blockquote")).toHaveCSS("border-left-width", "2px");
  await expect(page.locator("#blockquote")).toHaveCSS("border-left-color", "rgb(218, 222, 228)");
  await expect(page.locator("#blockquote-p")).toHaveCSS("margin-bottom", "0px");
  await expect(page.locator("#ul")).toHaveCSS("list-style-type", "disc");
  await expect(page.locator("#ul-ul")).toHaveCSS("list-style-type", "circle");
  await expect(page.locator("#ol")).toHaveCSS("list-style-type", "decimal");
  await expect(page.locator("#ol-ol")).toHaveCSS("list-style-type", "lower-alpha");
  await expect(page.locator("#dt")).toHaveCSS("font-weight", "700");
});

test("supports global and nested typography token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root { --spectra-line-height: 9px; --spectra-kbd-bg: rgb(1 2 3); }
      .theme-a { --spectra-line-height: 14px; --spectra-kbd-bg: rgb(4 5 6); }
      .theme-b { --spectra-line-height: 18px; --spectra-kbd-bg: rgb(7 8 9); }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <p id="global-p">global</p>
      <kbd id="global-kbd">k</kbd>
      <div class="theme-a"><p id="a-p">a</p><kbd id="a-kbd">k</kbd></div>
      <div class="theme-b"><p id="b-p">b</p><kbd id="b-kbd">k</kbd></div>
      <p id="after-p">after</p>
      <kbd id="after-kbd">k</kbd>
    `;
  });

  await expect(page.locator("#global-p")).toHaveCSS("margin-bottom", "9px");
  await expect(page.locator("#a-p")).toHaveCSS("margin-bottom", "14px");
  await expect(page.locator("#b-p")).toHaveCSS("margin-bottom", "18px");
  await expect(page.locator("#after-p")).toHaveCSS("margin-bottom", "9px");
  await expect(page.locator("#global-kbd")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#a-kbd")).toHaveCSS("background-color", "rgb(4, 5, 6)");
  await expect(page.locator("#b-kbd")).toHaveCSS("background-color", "rgb(7, 8, 9)");
  await expect(page.locator("#after-kbd")).toHaveCSS("background-color", "rgb(1, 2, 3)");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .h1 { font-size: 3rem; }
      p { margin-bottom: 5px; }
      kbd { background: rgb(11 12 13); color: rgb(14 15 16); }
      ul { list-style: square outside; }
    `,
  );

  await expect(page.locator("#h1-class")).toHaveCSS("font-size", "60px");
  await expect(page.locator("#p")).toHaveCSS("margin-bottom", "5px");
  await expect(page.locator("#kbd")).toHaveCSS("background-color", "rgb(11, 12, 13)");
  await expect(page.locator("#kbd")).toHaveCSS("color", "rgb(14, 15, 16)");
  await expect(page.locator("#ul")).toHaveCSS("list-style-type", "square");
});
