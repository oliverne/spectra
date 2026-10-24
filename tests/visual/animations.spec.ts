import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="loading" class="loading">Loading</div>
    <div id="loading-lg" class="loading loading-lg">Loading</div>
    <div id="probe-loading" class="probe" style="animation: loading 1s paused linear infinite; animation-delay: -0.5s;"></div>
    <div id="probe-slide" class="probe" style="animation: slide-down 1s paused linear; animation-delay: -0.5s;"></div>
    <div id="probe-slide-start" class="probe" style="animation: slide-down 1s paused linear; animation-delay: 0s;"></div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 480px; }
  #fixture .probe { background: rgb(0 0 0 / 10%); height: 10px; width: 40px; }
  #fixture .loading::after { animation-play-state: paused; }
`;

const loadingSelectors = ["#loading", "#loading-lg"];

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

async function loadingStyles(page: Page, selectors = loadingSelectors) {
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
        minHeight: style.minHeight,
        pointerEvents: style.pointerEvents,
        position: style.position,
      };
    }
    return snapshot;
  }, selectors);
}

async function afterStyles(page: Page, selectors = loadingSelectors) {
  return page.evaluate((targets) => {
    const snapshot: Record<string, Record<string, string>> = {};
    for (const selector of targets) {
      const element = document.querySelector(selector);
      if (!element) {
        snapshot[selector] = { missing: "true" };
        continue;
      }
      const style = getComputedStyle(element, "::after");
      snapshot[selector] = {
        animationDuration: style.animationDuration,
        animationIterationCount: style.animationIterationCount,
        animationName: style.animationName,
        animationTimingFunction: style.animationTimingFunction,
        backgroundColor: style.backgroundColor,
        borderBottomColor: style.borderBottomColor,
        borderLeftColor: style.borderLeftColor,
        borderRadius: style.borderRadius,
        borderRightColor: style.borderRightColor,
        borderTopColor: style.borderTopColor,
        borderTopWidth: style.borderTopWidth,
        content: style.content,
        display: style.display,
        height: style.height,
        left: style.left,
        marginLeft: style.marginLeft,
        marginTop: style.marginTop,
        opacity: style.opacity,
        padding: style.padding,
        position: style.position,
        top: style.top,
        width: style.width,
        zIndex: style.zIndex,
      };
    }
    return snapshot;
  }, selectors);
}

async function probeStyles(page: Page) {
  return page.evaluate(() => {
    const snapshot: Record<string, Record<string, string>> = {};
    for (const selector of ["#probe-loading", "#probe-slide", "#probe-slide-start"]) {
      const element = document.querySelector(selector);
      if (!element) {
        snapshot[selector] = { missing: "true" };
        continue;
      }
      const style = getComputedStyle(element);
      snapshot[selector] = {
        opacity: style.opacity,
        transform: style.transform,
      };
    }
    return snapshot;
  });
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 900 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy loading styles, keyframes, and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await loadingStyles(spectra)).toEqual(await loadingStyles(legacy));
  expect(await afterStyles(spectra)).toEqual(await afterStyles(legacy));
  expect(await probeStyles(spectra)).toEqual(await probeStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy loading geometry and animation contract", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#loading")).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  await expect(page.locator("#loading")).toHaveCSS("min-height", "16px");
  await expect(page.locator("#loading")).toHaveCSS("pointer-events", "none");
  await expect(page.locator("#loading")).toHaveCSS("position", "relative");
  await expect(page.locator("#loading-lg")).toHaveCSS("min-height", "40px");

  const [base, large] = await Promise.all([
    afterStyles(page, ["#loading"]),
    afterStyles(page, ["#loading-lg"]),
  ]);
  expect(base["#loading"]).toMatchObject({
    animationDuration: "0.5s",
    animationIterationCount: "infinite",
    animationName: "loading",
    animationTimingFunction: "linear",
    backgroundColor: "rgba(0, 0, 0, 0)",
    borderBottomColor: "rgb(87, 85, 217)",
    borderLeftColor: "rgb(87, 85, 217)",
    borderRadius: "50%",
    borderRightColor: "rgba(0, 0, 0, 0)",
    borderTopColor: "rgba(0, 0, 0, 0)",
    borderTopWidth: "2px",
    content: '""',
    display: "block",
    height: "16px",
    marginLeft: "-8px",
    marginTop: "-8px",
    opacity: "1",
    padding: "0px",
    position: "absolute",
    width: "16px",
    zIndex: "1",
  });
  const loadingBox = await page
    .locator("#loading")
    .evaluate((element) => ({ height: element.clientHeight, width: element.clientWidth }));
  expect(Number.parseFloat(base["#loading"].left)).toBeCloseTo(loadingBox.width / 2, 1);
  expect(Number.parseFloat(base["#loading"].top)).toBeCloseTo(loadingBox.height / 2, 1);
  expect(large["#loading-lg"]).toMatchObject({
    height: "32px",
    marginLeft: "-16px",
    marginTop: "-16px",
    width: "32px",
  });

  const probes = await probeStyles(page);
  expect(probes["#probe-loading"].transform).toBe("matrix(-1, 0, 0, -1, 0, 0)");
  expect(probes["#probe-slide-start"].transform).toBe("matrix(1, 0, 0, 1, 0, -32)");
  expect(probes["#probe-slide-start"].opacity).toBe("0");
  expect(probes["#probe-slide"].opacity).toBe("0.5");
  expect(probes["#probe-slide"].transform).toBe("matrix(1, 0, 0, 1, 0, -16)");
});

test("supports global and nested loading token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-primary: rgb(1 2 3);
        --spectra-border-width-lg: 3px;
        --spectra-space-2: 7px;
        --spectra-space-4: 9px;
        --spectra-space-5: 11px;
        --spectra-z-index-active: 7;
      }
      .theme-a {
        --spectra-color-primary: rgb(4 5 6);
        --spectra-border-width-lg: 4px;
        --spectra-space-2: 13px;
        --spectra-space-4: 15px;
        --spectra-space-5: 17px;
        --spectra-z-index-active: 8;
      }
      #fixture { display: grid; gap: 8px; justify-items: start; }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <div id="global" class="loading">Global</div>
      <div class="theme-a"><div id="a" class="loading loading-lg">Theme A</div></div>
      <div id="after" class="loading">After</div>
    `;
  });

  await expect(page.locator("#global")).toHaveCSS("min-height", "9px");
  const globalAfter = await afterStyles(page, ["#global"]);
  expect(globalAfter["#global"]).toMatchObject({
    borderTopWidth: "3px",
    borderBottomColor: "rgb(1, 2, 3)",
    height: "9px",
    marginLeft: "-7px",
    width: "9px",
    zIndex: "7",
  });

  await expect(page.locator("#a")).toHaveCSS("min-height", "34px");
  const themeAfter = await afterStyles(page, ["#a"]);
  expect(themeAfter["#a"]).toMatchObject({
    borderTopWidth: "4px",
    borderBottomColor: "rgb(4, 5, 6)",
    height: "30px",
    marginLeft: "-15px",
    width: "30px",
    zIndex: "8",
  });

  await expect(page.locator("#after")).toHaveCSS("min-height", "9px");
  const afterAfter = await afterStyles(page, ["#after"]);
  expect(afterAfter["#after"]).toMatchObject({
    borderTopWidth: "3px",
    borderBottomColor: "rgb(1, 2, 3)",
    zIndex: "7",
  });
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .loading::after { border-color: rgb(1 2 3); }
      .loading { color: rgb(4 5 6); }
    `,
  );

  const after = await afterStyles(page, ["#loading"]);
  expect(after["#loading"].borderTopColor).toBe("rgb(1, 2, 3)");
  expect(after["#loading"].borderBottomColor).toBe("rgb(1, 2, 3)");
  await expect(page.locator("#loading")).toHaveCSS("color", "rgba(0, 0, 0, 0)");
});
