import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="zh" lang="zh">
      <span id="zh-span">zh</span>
      <ins id="zh-ins">inserted</ins>
      <u id="zh-u">under</u>
      <del id="zh-del-1">a</del><del id="zh-del-2">b</del>
    </div>
    <div id="ja" lang="ja">
      <ins id="ja-ins">inserted</ins>
      <u id="ja-u">under</u>
      <del id="ja-del-1">a</del><del id="ja-del-2">b</del>
    </div>
    <div id="ko" lang="ko"><span id="ko-span">ko</span></div>
    <div id="zh-hant" lang="zh-Hant"><span id="zh-hant-span">zh-Hant</span></div>
    <div id="zh-hans" lang="zh-Hans"><span id="zh-hans-span">zh-Hans</span></div>
    <span id="class-zh" class="lang-zh">zh</span>
    <span id="class-zh-hant" class="lang-zh-hant">zh-Hant</span>
    <span id="class-zh-hans" class="lang-zh-hans">zh-Hans</span>
    <span id="class-ja" class="lang-ja">ja</span>
    <span id="class-ko" class="lang-ko">ko</span>
    <div id="class-cjk" class="lang-cjk">
      <ins id="cjk-ins">inserted</ins>
      <del id="cjk-del-1">a</del><del id="cjk-del-2">b</del>
    </div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 640px; }
`;

const asianSelectors = [
  "#zh-span",
  "#zh-ins",
  "#zh-u",
  "#zh-del-2",
  "#ja-ins",
  "#ja-u",
  "#ja-del-2",
  "#ko-span",
  "#zh-hant-span",
  "#zh-hans-span",
  "#class-zh",
  "#class-zh-hant",
  "#class-zh-hans",
  "#class-ja",
  "#class-ko",
  "#cjk-ins",
  "#cjk-del-2",
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

async function asianStyles(page: Page) {
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
        borderBottomStyle: style.borderBottomStyle,
        borderBottomWidth: style.borderBottomWidth,
        fontFamily: style.fontFamily,
        marginLeft: style.marginLeft,
        textDecorationLine: style.textDecorationLine,
      };
    }
    return snapshot;
  }, asianSelectors);
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy CJK computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await asianStyles(spectra)).toEqual(await asianStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("applies language element font families from the root", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  await Promise.all([
    legacy.evaluate(() => {
      document.documentElement.lang = "ja";
    }),
    spectra.evaluate(() => {
      document.documentElement.lang = "ja";
    }),
  ]);

  const [legacyFont, spectraFont] = await Promise.all([
    legacy.evaluate(() => getComputedStyle(document.documentElement).fontFamily),
    spectra.evaluate(() => getComputedStyle(document.documentElement).fontFamily),
  ]);
  expect(spectraFont).toEqual(legacyFont);
  expect(spectraFont).toContain("Hiragino Sans");
  await context.close();
});

test("keeps CJK language classes and CJK punctuation rules", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#class-ja")).toHaveCSS("font-family", /Hiragino Sans/);
  await expect(page.locator("#class-ko")).toHaveCSS("font-family", /Malgun Gothic/);
  await expect(page.locator("#class-zh")).toHaveCSS("font-family", /PingFang SC/);
  await expect(page.locator("#class-zh-hant")).toHaveCSS("font-family", /PingFang TC/);
  await expect(page.locator("#class-zh-hans")).toHaveCSS("font-family", /PingFang SC/);
  await expect(page.locator("#ja-ins")).toHaveCSS("border-bottom-style", "solid");
  await expect(page.locator("#ja-ins")).toHaveCSS("border-bottom-width", "1px");
  await expect(page.locator("#ja-u")).toHaveCSS("text-decoration-line", "none");
  await expect(page.locator("#ja-del-2")).toHaveCSS("margin-left", "2px");
});

test("supports global and nested CJK font-family token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root { --spectra-font-family-cjk-ja: "Custom JA", sans-serif; }
      .theme-a { --spectra-font-family-cjk-ja: "Theme A JA", serif; }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <span id="global-ja" class="lang-ja">ja</span>
      <div class="theme-a"><span id="a-ja" class="lang-ja">ja</span></div>
      <span id="ko" class="lang-ko">ko</span>
      <span id="after-ja" class="lang-ja">ja</span>
    `;
  });

  await expect(page.locator("#global-ja")).toHaveCSS("font-family", /Custom JA/);
  await expect(page.locator("#a-ja")).toHaveCSS("font-family", /Theme A JA/);
  await expect(page.locator("#ko")).toHaveCSS("font-family", /Malgun Gothic/);
  await expect(page.locator("#after-ja")).toHaveCSS("font-family", /Custom JA/);
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .lang-ja { font-family: monospace; }
      :lang(ja) ins { border-bottom-width: 7px; }
    `,
  );

  await expect(page.locator("#class-ja")).toHaveCSS("font-family", "monospace");
  await expect(page.locator("#ja-ins")).toHaveCSS("border-bottom-width", "7px");
});
