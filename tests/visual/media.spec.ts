import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const transparentGif = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const fixture = `
  <div id="fixture">
    <img id="responsive" class="img-responsive" alt="" width="120" height="60" src="${transparentGif}" />
    <img id="cover" class="img-fit-cover" alt="" width="120" height="60" src="${transparentGif}" />
    <img id="contain" class="img-fit-contain" alt="" width="120" height="60" src="${transparentGif}" />
    <div id="video" class="video-responsive"><iframe id="video-frame" title="video"></iframe></div>
    <div id="video-4-3" class="video-responsive video-responsive-4-3"></div>
    <div id="video-1-1" class="video-responsive video-responsive-1-1"></div>
    <video id="video-tag" class="video-responsive" width="120"></video>
    <figure id="figure" class="figure">
      <figcaption id="caption" class="figure-caption">Caption</figcaption>
    </figure>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 640px; }
  #fixture #video, #fixture #video-4-3, #fixture #video-1-1 { background: rgb(87 85 217 / 8%); }
`;

const mediaSelectors = [
  "#responsive",
  "#cover",
  "#contain",
  "#video",
  "#video-frame",
  "#video-4-3",
  "#video-1-1",
  "#video-tag",
  "#figure",
  "#caption",
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

async function mediaStyles(page: Page) {
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
        borderWidth: style.borderWidth,
        bottom: style.bottom,
        color: style.color,
        display: style.display,
        height: style.height,
        left: style.left,
        margin: style.margin,
        marginTop: style.marginTop,
        maxWidth: style.maxWidth,
        objectFit: style.objectFit,
        overflow: style.overflow,
        padding: style.padding,
        position: style.position,
        right: style.right,
        top: style.top,
        width: style.width,
      };
    }
    return snapshot;
  }, mediaSelectors);
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
        content: style.content,
        display: style.display,
        paddingBottom: style.paddingBottom,
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

test("matches legacy media computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await mediaStyles(spectra)).toEqual(await mediaStyles(legacy));
  expect(await beforeStyles(spectra, ["#video", "#video-4-3", "#video-1-1", "#video-tag"])).toEqual(
    await beforeStyles(legacy, ["#video", "#video-4-3", "#video-1-1", "#video-tag"]),
  );

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy responsive image and video contracts", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#responsive")).toHaveCSS("display", "block");
  await expect(page.locator("#responsive")).toHaveCSS("max-width", "100%");
  await expect(page.locator("#cover")).toHaveCSS("object-fit", "cover");
  await expect(page.locator("#contain")).toHaveCSS("object-fit", "contain");
  await expect(page.locator("#video")).toHaveCSS("position", "relative");
  await expect(page.locator("#video")).toHaveCSS("overflow", "hidden");
  await expect(page.locator("#video-frame")).toHaveCSS("position", "absolute");
  await expect(page.locator("#video-frame")).toHaveCSS("border-width", "0px");
  await expect(page.locator("#video-tag")).toHaveCSS("max-width", "100%");
  await expect(page.locator("#figure")).toHaveCSS("margin-top", "0px");
  await expect(page.locator("#figure")).toHaveCSS("margin-bottom", "8px");
  await expect(page.locator("#caption")).toHaveCSS("color", "rgb(102, 117, 140)");
  await expect(page.locator("#caption")).toHaveCSS("margin-top", "8px");

  const [base, wide, square] = await Promise.all([
    beforeStyles(page, ["#video"]),
    beforeStyles(page, ["#video-4-3"]),
    beforeStyles(page, ["#video-1-1"]),
  ]);
  const baseRatio = Number.parseFloat(base["#video"].paddingBottom);
  expect(Number.parseFloat(wide["#video-4-3"].paddingBottom) / baseRatio).toBeCloseTo(
    75 / 56.25,
    3,
  );
  expect(Number.parseFloat(square["#video-1-1"].paddingBottom) / baseRatio).toBeCloseTo(
    100 / 56.25,
    3,
  );
});

test("supports global and nested media token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root { --spectra-space-2: 14px; --spectra-color-text-muted: rgb(1 2 3); }
      .theme-a { --spectra-space-2: 20px; --spectra-color-text-muted: rgb(4 5 6); }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <figure id="global-figure" class="figure"><figcaption id="global-caption" class="figure-caption">c</figcaption></figure>
      <div class="theme-a">
        <figure id="a-figure" class="figure"><figcaption id="a-caption" class="figure-caption">c</figcaption></figure>
      </div>
      <figure id="after-figure" class="figure"><figcaption id="after-caption" class="figure-caption">c</figcaption></figure>
    `;
  });

  await expect(page.locator("#global-figure")).toHaveCSS("margin-bottom", "14px");
  await expect(page.locator("#global-caption")).toHaveCSS("margin-top", "14px");
  await expect(page.locator("#global-caption")).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(page.locator("#a-figure")).toHaveCSS("margin-bottom", "20px");
  await expect(page.locator("#a-caption")).toHaveCSS("margin-top", "20px");
  await expect(page.locator("#a-caption")).toHaveCSS("color", "rgb(4, 5, 6)");
  await expect(page.locator("#after-figure")).toHaveCSS("margin-bottom", "14px");
  await expect(page.locator("#after-caption")).toHaveCSS("color", "rgb(1, 2, 3)");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .img-responsive { max-width: 50%; }
      .figure .figure-caption { color: rgb(7 8 9); margin-top: 9px; }
    `,
  );

  await expect(page.locator("#responsive")).toHaveCSS("max-width", "50%");
  await expect(page.locator("#caption")).toHaveCSS("color", "rgb(7, 8, 9)");
  await expect(page.locator("#caption")).toHaveCSS("margin-top", "9px");
});
