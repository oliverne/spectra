import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="empty" class="empty">
      <div id="icon" class="empty-icon">*</div>
      <p id="title" class="empty-title">Title</p>
      <p id="subtitle" class="empty-subtitle">Subtitle</p>
      <div id="action" class="empty-action">Action</div>
    </div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 480px; }
`;

const emptySelectors = ["#empty", "#icon", "#title", "#subtitle", "#action"];

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

async function emptyStyles(page: Page, selectors = emptySelectors) {
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
        margin: style.margin,
        marginBottom: style.marginBottom,
        marginTop: style.marginTop,
        padding: style.padding,
        textAlign: style.textAlign,
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

test("matches legacy empty state computed styles and representative pixels", async ({
  browser,
}) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await emptyStyles(spectra)).toEqual(await emptyStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy empty state spacing and colors", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#empty")).toHaveCSS("background-color", "rgb(247, 248, 249)");
  await expect(page.locator("#empty")).toHaveCSS("border-radius", "2px");
  await expect(page.locator("#empty")).toHaveCSS("color", "rgb(102, 117, 140)");
  await expect(page.locator("#empty")).toHaveCSS("padding", "64px 32px");
  await expect(page.locator("#empty")).toHaveCSS("text-align", "center");

  await expect(page.locator("#icon")).toHaveCSS("margin-bottom", "16px");
  await expect(page.locator("#title")).toHaveCSS("margin-top", "8px");
  await expect(page.locator("#title")).toHaveCSS("margin-bottom", "8px");
  await expect(page.locator("#subtitle")).toHaveCSS("margin-top", "8px");
  await expect(page.locator("#subtitle")).toHaveCSS("margin-bottom", "8px");
  await expect(page.locator("#action")).toHaveCSS("margin-top", "16px");
});

test("supports global and nested empty state token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-background-subtle: rgb(1 2 3);
        --spectra-color-text-muted: rgb(4 5 6);
        --spectra-border-radius: 7px;
        --spectra-space-2: 6px;
        --spectra-space-4: 11px;
      }
      .theme-a {
        --spectra-color-background-subtle: rgb(7 8 9);
        --spectra-color-text-muted: rgb(10 11 12);
        --spectra-border-radius: 13px;
        --spectra-space-2: 8px;
        --spectra-space-4: 15px;
      }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <div id="global" class="empty">
        <div id="global-icon" class="empty-icon">*</div>
        <p id="global-title" class="empty-title">Global</p>
      </div>
      <div class="theme-a">
        <div id="a" class="empty">
          <div id="a-icon" class="empty-icon">*</div>
          <p id="a-title" class="empty-title">Theme A</p>
        </div>
      </div>
      <div id="after" class="empty">
        <div id="after-icon" class="empty-icon">*</div>
        <p id="after-title" class="empty-title">After</p>
      </div>
    `;
  });

  await expect(page.locator("#global")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#global")).toHaveCSS("color", "rgb(4, 5, 6)");
  await expect(page.locator("#global")).toHaveCSS("border-top-left-radius", "7px");
  await expect(page.locator("#global")).toHaveCSS("padding", "44px 22px");
  await expect(page.locator("#global-icon")).toHaveCSS("margin-bottom", "11px");
  await expect(page.locator("#global-title")).toHaveCSS("margin-top", "6px");

  await expect(page.locator("#a")).toHaveCSS("background-color", "rgb(7, 8, 9)");
  await expect(page.locator("#a")).toHaveCSS("color", "rgb(10, 11, 12)");
  await expect(page.locator("#a")).toHaveCSS("border-top-left-radius", "13px");
  await expect(page.locator("#a")).toHaveCSS("padding", "60px 30px");
  await expect(page.locator("#a-icon")).toHaveCSS("margin-bottom", "15px");
  await expect(page.locator("#a-title")).toHaveCSS("margin-top", "8px");

  await expect(page.locator("#after")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#after")).toHaveCSS("padding", "44px 22px");
  await expect(page.locator("#after-title")).toHaveCSS("margin-top", "6px");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .empty { background: rgb(7 8 9); color: rgb(10 11 12); border-radius: 9px; }
      .empty .empty-title { margin: 5px auto; }
    `,
  );

  await expect(page.locator("#empty")).toHaveCSS("background-color", "rgb(7, 8, 9)");
  await expect(page.locator("#empty")).toHaveCSS("color", "rgb(10, 11, 12)");
  await expect(page.locator("#empty")).toHaveCSS("border-radius", "9px");
  await expect(page.locator("#title")).toHaveCSS("margin-top", "5px");
});
