import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <p><span id="text-primary" class="text-primary">primary</span></p>
    <p><span id="text-secondary" class="text-secondary">secondary</span></p>
    <p><span id="text-gray" class="text-gray">gray</span></p>
    <p><span id="text-light" class="text-light bg-dark">light</span></p>
    <p><span id="text-dark" class="text-dark">dark</span></p>
    <p><span id="text-success" class="text-success">success</span></p>
    <p><span id="text-warning" class="text-warning">warning</span></p>
    <p><span id="text-error" class="text-error">error</span></p>
    <p><a id="link-primary" class="text-primary" href="#colors">primary link</a></p>
    <p><a id="link-secondary" class="text-secondary" href="#colors">secondary link</a></p>
    <p><a id="link-success" class="text-success" href="#colors">success link</a></p>
    <div id="bg-primary" class="bg-primary">bg primary</div>
    <div id="bg-secondary" class="bg-secondary">bg secondary</div>
    <div id="bg-dark" class="bg-dark">bg dark</div>
    <div id="bg-gray" class="bg-gray">bg gray</div>
    <div id="bg-success" class="bg-success">bg success</div>
    <div id="bg-warning" class="bg-warning">bg warning</div>
    <div id="bg-error" class="bg-error">bg error</div>
    <span id="cursor-hand" class="c-hand">hand</span>
    <span id="cursor-move" class="c-move">move</span>
    <span id="cursor-zoom-in" class="c-zoom-in">zoom in</span>
    <span id="cursor-zoom-out" class="c-zoom-out">zoom out</span>
    <span id="cursor-not-allowed" class="c-not-allowed">not allowed</span>
    <span id="cursor-auto" class="c-auto">auto</span>
    <div id="display-block" class="d-block">block</div>
    <span id="display-inline" class="d-inline">inline</span>
    <div id="display-inline-block" class="d-inline-block">inline block</div>
    <div id="display-flex" class="d-flex">flex</div>
    <div id="display-inline-flex" class="d-inline-flex">inline flex</div>
    <div id="display-none" class="d-none">none</div>
    <div id="display-hide" class="d-hide">hide</div>
    <div id="display-visible" class="d-visible">visible</div>
    <div id="display-invisible" class="d-invisible">invisible</div>
    <div id="divider-wrap">
      <div id="divider" class="divider"></div>
      <div id="divider-content" class="divider" data-content="OR"></div>
      <div id="divider-vert" class="divider-vert"></div>
      <div id="divider-vert-content" class="divider-vert" data-content="OR"></div>
    </div>
    <div id="clearfix" class="clearfix">
      <span id="float-left" class="float-left">left</span>
      <span id="float-right" class="float-right">right</span>
    </div>
    <div id="pos-relative" class="p-relative">relative</div>
    <div id="pos-absolute" class="p-absolute">absolute</div>
    <div id="pos-fixed" class="p-fixed">fixed</div>
    <div id="pos-sticky" class="p-sticky">sticky</div>
    <div id="centered" class="p-centered">centered</div>
    <div id="flex-centered" class="flex-centered">flex centered</div>
    <div id="m-0" class="m-0">m-0</div>
    <div id="m-1" class="m-1">m-1</div>
    <div id="m-2" class="m-2">m-2</div>
    <div id="mb-1" class="mb-1">mb-1</div>
    <div id="ml-1" class="ml-1">ml-1</div>
    <div id="mr-1" class="mr-1">mr-1</div>
    <div id="mt-1" class="mt-1">mt-1</div>
    <div id="mx-1" class="mx-1">mx-1</div>
    <div id="my-1" class="my-1">my-1</div>
    <div id="mx-2" class="mx-2">mx-2</div>
    <div id="p-0" class="p-0">p-0</div>
    <div id="p-1" class="p-1">p-1</div>
    <div id="p-2" class="p-2">p-2</div>
    <div id="pb-1" class="pb-1">pb-1</div>
    <div id="pl-1" class="pl-1">pl-1</div>
    <div id="pr-1" class="pr-1">pr-1</div>
    <div id="pt-1" class="pt-1">pt-1</div>
    <div id="px-1" class="px-1">px-1</div>
    <div id="py-1" class="py-1">py-1</div>
    <div id="px-2" class="px-2">px-2</div>
    <div id="rounded" class="s-rounded">rounded</div>
    <div id="circle" class="s-circle">circle</div>
    <p id="text-left" class="text-left">left</p>
    <p id="text-right" class="text-right">right</p>
    <p id="text-center" class="text-center">center</p>
    <p id="text-justify" class="text-justify">justify</p>
    <p id="text-lowercase" class="text-lowercase">LOWERCASE</p>
    <p id="text-uppercase" class="text-uppercase">uppercase</p>
    <p id="text-capitalize" class="text-capitalize">capitalize</p>
    <p id="text-normal" class="text-normal">normal</p>
    <p id="text-bold" class="text-bold">bold</p>
    <p id="text-italic" class="text-italic">italic</p>
    <p><span id="text-large" class="text-large">large</span></p>
    <p><span id="text-small" class="text-small">small</span></p>
    <p><span id="text-tiny" class="text-tiny">tiny</span></p>
    <p id="text-muted" class="text-muted">muted</p>
    <div id="text-ellipsis" class="text-ellipsis" style="width: 160px;">ellipsis ellipsis ellipsis ellipsis</div>
    <div id="text-clip" class="text-clip" style="width: 160px;">clip clip clip clip clip</div>
    <p id="text-break" class="text-break" style="width: 160px;">averylongwordthatmustbreak</p>
    <span id="text-assistive" class="text-assistive">assistive</span>
    <span id="text-hide" class="text-hide">hidden</span>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; padding: 12px; width: 720px; }
  #fixture #divider-wrap { width: 320px; }
  #fixture #clearfix { background: rgb(0 0 0 / 6%); }
  #fixture #centered { width: 400px; }
`;

const utilitySelectors = [
  "#text-primary",
  "#text-secondary",
  "#text-gray",
  "#text-light",
  "#text-dark",
  "#text-success",
  "#text-warning",
  "#text-error",
  "#bg-primary",
  "#bg-secondary",
  "#bg-dark",
  "#bg-gray",
  "#bg-success",
  "#bg-warning",
  "#bg-error",
  "#cursor-hand",
  "#cursor-move",
  "#cursor-zoom-in",
  "#cursor-zoom-out",
  "#cursor-not-allowed",
  "#cursor-auto",
  "#display-block",
  "#display-inline",
  "#display-inline-block",
  "#display-flex",
  "#display-inline-flex",
  "#display-none",
  "#display-hide",
  "#display-visible",
  "#display-invisible",
  "#divider",
  "#divider-content",
  "#divider-vert",
  "#divider-vert-content",
  "#float-left",
  "#float-right",
  "#pos-relative",
  "#pos-absolute",
  "#pos-fixed",
  "#pos-sticky",
  "#centered",
  "#flex-centered",
  "#m-0",
  "#m-1",
  "#m-2",
  "#mb-1",
  "#ml-1",
  "#mr-1",
  "#mt-1",
  "#mx-1",
  "#my-1",
  "#mx-2",
  "#p-0",
  "#p-1",
  "#p-2",
  "#pb-1",
  "#pl-1",
  "#pr-1",
  "#pt-1",
  "#px-1",
  "#py-1",
  "#px-2",
  "#rounded",
  "#circle",
  "#text-left",
  "#text-right",
  "#text-center",
  "#text-justify",
  "#text-lowercase",
  "#text-uppercase",
  "#text-capitalize",
  "#text-normal",
  "#text-bold",
  "#text-italic",
  "#text-large",
  "#text-small",
  "#text-tiny",
  "#text-muted",
  "#text-ellipsis",
  "#text-clip",
  "#text-break",
  "#text-assistive",
  "#text-hide",
];

const pseudoSelectors = [
  ["#divider-content", "::after"],
  ["#divider-vert", "::before"],
  ["#divider-vert-content", "::after"],
  ["#clearfix", "::after"],
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

async function utilityStyles(page: Page, selectors = utilitySelectors) {
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
        alignItems: style.alignItems,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        borderTopColor: style.borderTopColor,
        borderTopWidth: style.borderTopWidth,
        clear: style.clear,
        clip: style.clip,
        color: style.color,
        cssFloat: style.cssFloat,
        cursor: style.cursor,
        display: style.display,
        fontSize: style.fontSize,
        fontStyle: style.fontStyle,
        fontWeight: style.fontWeight,
        height: style.height,
        hyphens: style.hyphens,
        justifyContent: style.justifyContent,
        lineHeight: style.lineHeight,
        margin: style.margin,
        marginLeft: style.marginLeft,
        marginTop: style.marginTop,
        opacity: style.opacity,
        overflow: style.overflow,
        overflowWrap: style.overflowWrap,
        padding: style.padding,
        paddingLeft: style.paddingLeft,
        paddingTop: style.paddingTop,
        position: style.position,
        textAlign: style.textAlign,
        textOverflow: style.textOverflow,
        textShadow: style.textShadow,
        textTransform: style.textTransform,
        visibility: style.visibility,
        whiteSpace: style.whiteSpace,
        width: style.width,
        wordBreak: style.wordBreak,
      };
    }
    return snapshot;
  }, selectors);
}

async function pseudoStyles(page: Page, selectors = pseudoSelectors) {
  return page.evaluate((targets) => {
    const snapshot: Record<string, Record<string, string>> = {};
    for (const [selector, pseudo] of targets) {
      const element = document.querySelector(selector);
      if (!element) {
        snapshot[`${selector}${pseudo}`] = { missing: "true" };
        continue;
      }
      const style = getComputedStyle(element, pseudo);
      snapshot[`${selector}${pseudo}`] = {
        backgroundColor: style.backgroundColor,
        borderLeftColor: style.borderLeftColor,
        borderLeftWidth: style.borderLeftWidth,
        bottom: style.bottom,
        clear: style.clear,
        color: style.color,
        content: style.content,
        display: style.display,
        fontSize: style.fontSize,
        left: style.left,
        padding: style.padding,
        position: style.position,
        top: style.top,
        transform: style.transform,
      };
    }
    return snapshot;
  }, selectors);
}

async function numericStyle(page: Page, selector: string, property: string) {
  return page
    .locator(selector)
    .evaluate(
      (element, name) => Number.parseFloat(getComputedStyle(element)[name as never] as string),
      property,
    );
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 900 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy utility computed styles and representative pixels", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  expect(await utilityStyles(spectra)).toEqual(await utilityStyles(legacy));
  expect(await pseudoStyles(spectra)).toEqual(await pseudoStyles(legacy));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("keeps legacy color, cursor, display, and divider contracts", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#text-primary")).toHaveCSS("color", "rgb(87, 85, 217)");
  await expect(page.locator("#text-secondary")).toHaveCSS("color", "rgb(229, 229, 249)");
  await expect(page.locator("#text-gray")).toHaveCSS("color", "rgb(188, 195, 206)");
  await expect(page.locator("#text-light")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("#text-dark")).toHaveCSS("color", "rgb(59, 67, 81)");
  await expect(page.locator("#text-success")).toHaveCSS("color", "rgb(50, 182, 67)");
  await expect(page.locator("#text-warning")).toHaveCSS("color", "rgb(255, 183, 0)");
  await expect(page.locator("#text-error")).toHaveCSS("color", "rgb(232, 86, 0)");

  await expect(page.locator("#bg-primary")).toHaveCSS("background-color", "rgb(87, 85, 217)");
  await expect(page.locator("#bg-primary")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("#bg-secondary")).toHaveCSS("background-color", "rgb(241, 241, 252)");
  await expect(page.locator("#bg-secondary")).toHaveCSS("color", "rgb(59, 67, 81)");
  await expect(page.locator("#bg-dark")).toHaveCSS("background-color", "rgb(48, 55, 66)");
  await expect(page.locator("#bg-dark")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("#bg-gray")).toHaveCSS("background-color", "rgb(247, 248, 249)");
  await expect(page.locator("#bg-success")).toHaveCSS("background-color", "rgb(50, 182, 67)");
  await expect(page.locator("#bg-warning")).toHaveCSS("background-color", "rgb(255, 183, 0)");
  await expect(page.locator("#bg-error")).toHaveCSS("background-color", "rgb(232, 86, 0)");

  const cursor = {
    "#cursor-hand": "pointer",
    "#cursor-move": "move",
    "#cursor-zoom-in": "zoom-in",
    "#cursor-zoom-out": "zoom-out",
    "#cursor-not-allowed": "not-allowed",
    "#cursor-auto": "auto",
  };
  for (const [selector, value] of Object.entries(cursor)) {
    await expect(page.locator(selector)).toHaveCSS("cursor", value);
  }

  await expect(page.locator("#display-block")).toHaveCSS("display", "block");
  await expect(page.locator("#display-inline")).toHaveCSS("display", "inline");
  await expect(page.locator("#display-inline-block")).toHaveCSS("display", "inline-block");
  await expect(page.locator("#display-flex")).toHaveCSS("display", "flex");
  await expect(page.locator("#display-inline-flex")).toHaveCSS("display", "inline-flex");
  await expect(page.locator("#display-none")).toHaveCSS("display", "none");
  await expect(page.locator("#display-hide")).toHaveCSS("display", "none");
  await expect(page.locator("#display-visible")).toHaveCSS("visibility", "visible");
  await expect(page.locator("#display-invisible")).toHaveCSS("visibility", "hidden");

  await expect(page.locator("#divider")).toHaveCSS("border-top-width", "1px");
  await expect(page.locator("#divider")).toHaveCSS("border-top-color", "rgb(241, 243, 245)");
  await expect(page.locator("#divider")).toHaveCSS("height", "1px");
  await expect(page.locator("#divider")).toHaveCSS("margin", "8px 0px");
  await expect(page.locator("#divider-content")).toHaveCSS("margin", "16px 0px");
  await expect(page.locator("#divider-vert")).toHaveCSS("padding", "16px");

  const pseudo = await pseudoStyles(page);
  expect(pseudo["#divider-content::after"]).toMatchObject({
    backgroundColor: "rgb(255, 255, 255)",
    color: "rgb(188, 195, 206)",
    content: '"OR"',
    display: "inline-block",
    fontSize: "14px",
    padding: "0px 8px",
    transform: "matrix(1, 0, 0, 1, 0, -13)",
  });
  expect(pseudo["#divider-vert::before"]).toMatchObject({
    borderLeftColor: "rgb(218, 222, 228)",
    borderLeftWidth: "1px",
    bottom: "8px",
    content: '""',
    display: "block",
    left: "160px",
    position: "absolute",
    top: "8px",
  });
  expect(pseudo["#divider-vert-content::after"].content).toBe('"OR"');
  expect(pseudo["#clearfix::after"]).toMatchObject({
    clear: "both",
    content: '""',
    display: "table",
  });
});

test("keeps legacy position, spacing, shape, and text contracts", async ({ page }) => {
  await render(page, spectraCss);

  await expect(page.locator("#float-left")).toHaveCSS("float", "left");
  await expect(page.locator("#float-right")).toHaveCSS("float", "right");
  await expect(page.locator("#pos-relative")).toHaveCSS("position", "relative");
  await expect(page.locator("#pos-absolute")).toHaveCSS("position", "absolute");
  await expect(page.locator("#pos-fixed")).toHaveCSS("position", "fixed");
  await expect(page.locator("#pos-sticky")).toHaveCSS("position", "sticky");
  await expect(page.locator("#centered")).toHaveCSS("margin-left", "148px");
  await expect(page.locator("#centered")).toHaveCSS("margin-right", "148px");
  await expect(page.locator("#flex-centered")).toHaveCSS("align-items", "center");
  await expect(page.locator("#flex-centered")).toHaveCSS("justify-content", "center");

  await expect(page.locator("#m-0")).toHaveCSS("margin", "0px");
  await expect(page.locator("#m-1")).toHaveCSS("margin", "4px");
  await expect(page.locator("#m-2")).toHaveCSS("margin", "8px");
  await expect(page.locator("#mb-1")).toHaveCSS("margin-bottom", "4px");
  await expect(page.locator("#ml-1")).toHaveCSS("margin-left", "4px");
  await expect(page.locator("#mr-1")).toHaveCSS("margin-right", "4px");
  await expect(page.locator("#mt-1")).toHaveCSS("margin-top", "4px");
  await expect(page.locator("#mx-1")).toHaveCSS("margin-left", "4px");
  await expect(page.locator("#mx-1")).toHaveCSS("margin-right", "4px");
  await expect(page.locator("#my-1")).toHaveCSS("margin-bottom", "4px");
  await expect(page.locator("#my-1")).toHaveCSS("margin-top", "4px");
  await expect(page.locator("#mx-2")).toHaveCSS("margin-left", "8px");
  await expect(page.locator("#p-0")).toHaveCSS("padding", "0px");
  await expect(page.locator("#p-1")).toHaveCSS("padding", "4px");
  await expect(page.locator("#p-2")).toHaveCSS("padding", "8px");
  await expect(page.locator("#pb-1")).toHaveCSS("padding-bottom", "4px");
  await expect(page.locator("#pl-1")).toHaveCSS("padding-left", "4px");
  await expect(page.locator("#pr-1")).toHaveCSS("padding-right", "4px");
  await expect(page.locator("#pt-1")).toHaveCSS("padding-top", "4px");
  await expect(page.locator("#px-1")).toHaveCSS("padding-left", "4px");
  await expect(page.locator("#py-1")).toHaveCSS("padding-bottom", "4px");
  await expect(page.locator("#px-2")).toHaveCSS("padding-right", "8px");

  await expect(page.locator("#rounded")).toHaveCSS("border-radius", "2px");
  await expect(page.locator("#circle")).toHaveCSS("border-radius", "50%");

  await expect(page.locator("#text-left")).toHaveCSS("text-align", "left");
  await expect(page.locator("#text-right")).toHaveCSS("text-align", "right");
  await expect(page.locator("#text-center")).toHaveCSS("text-align", "center");
  await expect(page.locator("#text-justify")).toHaveCSS("text-align", "justify");
  await expect(page.locator("#text-lowercase")).toHaveCSS("text-transform", "lowercase");
  await expect(page.locator("#text-uppercase")).toHaveCSS("text-transform", "uppercase");
  await expect(page.locator("#text-capitalize")).toHaveCSS("text-transform", "capitalize");
  await expect(page.locator("#text-normal")).toHaveCSS("font-weight", "400");
  await expect(page.locator("#text-bold")).toHaveCSS("font-weight", "700");
  await expect(page.locator("#text-italic")).toHaveCSS("font-style", "italic");
  expect(await numericStyle(page, "#text-large", "fontSize")).toBeCloseTo(19.2, 1);
  expect(await numericStyle(page, "#text-small", "fontSize")).toBeCloseTo(14.4, 1);
  expect(await numericStyle(page, "#text-tiny", "fontSize")).toBeCloseTo(12.8, 1);
  await expect(page.locator("#text-muted")).toHaveCSS("opacity", "0.8");
  await expect(page.locator("#text-ellipsis")).toHaveCSS("overflow", "hidden");
  await expect(page.locator("#text-ellipsis")).toHaveCSS("text-overflow", "ellipsis");
  await expect(page.locator("#text-ellipsis")).toHaveCSS("white-space", "nowrap");
  await expect(page.locator("#text-clip")).toHaveCSS("text-overflow", "clip");
  await expect(page.locator("#text-break")).toHaveCSS("word-break", "break-word");
  await expect(page.locator("#text-assistive")).toHaveCSS("position", "absolute");
  await expect(page.locator("#text-assistive")).toHaveCSS("height", "1px");
  await expect(page.locator("#text-assistive")).toHaveCSS("clip", "rect(0px, 0px, 0px, 0px)");
  await expect(page.locator("#text-hide")).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  await expect(page.locator("#text-hide")).toHaveCSS("font-size", "0px");
});

test("keeps utility !important behavior", async ({ page }) => {
  await render(page, spectraCss);
  await page.locator("#text-primary").evaluate((element) => {
    element.setAttribute("style", "color: rgb(9 9 9)");
  });
  await page.locator("#display-none").evaluate((element) => {
    element.setAttribute("style", "display: flex");
  });
  await page.locator("#divider").evaluate((element) => {
    element.setAttribute("style", "border-top-color: rgb(9 9 9)");
  });

  await expect(page.locator("#text-primary")).toHaveCSS("color", "rgb(87, 85, 217)");
  await expect(page.locator("#display-none")).toHaveCSS("display", "none");
  await expect(page.locator("#divider")).toHaveCSS("border-top-color", "rgb(9, 9, 9)");
});

test("supports global and nested utility token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-text-primary: rgb(1 2 3);
        --spectra-color-text-secondary: rgb(4 5 6);
        --spectra-color-primary: rgb(7 8 9);
        --spectra-color-on-accent: rgb(10 11 12);
        --spectra-color-border-light: rgb(13 14 15);
        --spectra-color-border: rgb(16 17 18);
        --spectra-color-text-subtle: rgb(19 20 21);
        --spectra-space-1: 11px;
        --spectra-space-2: 22px;
        --spectra-space-4: 33px;
        --spectra-border-width: 3px;
        --spectra-border-radius: 5px;
        --spectra-font-size-sm: 13px;
      }
      .theme-a {
        --spectra-color-text-primary: rgb(23 24 25);
        --spectra-color-primary: rgb(26 27 28);
        --spectra-color-on-accent: rgb(29 30 31);
        --spectra-color-border-light: rgb(32 33 34);
        --spectra-space-1: 35px;
        --spectra-space-2: 36px;
        --spectra-border-radius: 37px;
      }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <span id="global-text" class="text-primary">global</span>
      <div id="global-bg" class="bg-primary">global bg</div>
      <div id="global-divider" class="divider"></div>
      <div id="global-m" class="m-1">global m</div>
      <div id="global-rounded" class="s-rounded">global rounded</div>
      <div class="theme-a">
        <span id="a-text" class="text-primary">theme a</span>
        <div id="a-bg" class="bg-primary">theme a bg</div>
        <div id="a-divider" class="divider"></div>
        <div id="a-m" class="m-1">theme a m</div>
        <div id="a-rounded" class="s-rounded">theme a rounded</div>
      </div>
      <span id="after-text" class="text-primary">after</span>
      <div id="after-m" class="m-1">after m</div>
    `;
  });

  await expect(page.locator("#global-text")).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(page.locator("#global-bg")).toHaveCSS("background-color", "rgb(7, 8, 9)");
  await expect(page.locator("#global-bg")).toHaveCSS("color", "rgb(10, 11, 12)");
  await expect(page.locator("#global-divider")).toHaveCSS("border-top-color", "rgb(13, 14, 15)");
  await expect(page.locator("#global-divider")).toHaveCSS("border-top-width", "3px");
  await expect(page.locator("#global-divider")).toHaveCSS("margin", "22px 0px");
  await expect(page.locator("#global-m")).toHaveCSS("margin", "11px");
  await expect(page.locator("#global-rounded")).toHaveCSS("border-radius", "5px");

  await expect(page.locator("#a-text")).toHaveCSS("color", "rgb(23, 24, 25)");
  await expect(page.locator("#a-bg")).toHaveCSS("background-color", "rgb(26, 27, 28)");
  await expect(page.locator("#a-bg")).toHaveCSS("color", "rgb(29, 30, 31)");
  await expect(page.locator("#a-divider")).toHaveCSS("border-top-color", "rgb(32, 33, 34)");
  await expect(page.locator("#a-divider")).toHaveCSS("margin", "36px 0px");
  await expect(page.locator("#a-m")).toHaveCSS("margin", "35px");
  await expect(page.locator("#a-rounded")).toHaveCSS("border-radius", "37px");

  await expect(page.locator("#after-text")).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(page.locator("#after-m")).toHaveCSS("margin", "11px");
});

test("keeps legacy visited link rules for utilities", async () => {
  for (const variant of [
    "primary",
    "secondary",
    "gray",
    "light",
    "dark",
    "success",
    "warning",
    "error",
  ]) {
    expect(spectraCss).toContain(`a.text-${variant}:visited`);
    expect(spectraCss).toContain(`--spectra-color-text-${variant}-visited`);
  }
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .text-primary { color: rgb(1 2 3) !important; }
      .divider { border-top-color: rgb(4 5 6); margin: 9px 0; }
      .m-1 { margin: 7px !important; }
    `,
  );

  await expect(page.locator("#text-primary")).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(page.locator("#divider")).toHaveCSS("border-top-color", "rgb(4, 5, 6)");
  await expect(page.locator("#divider")).toHaveCSS("margin", "9px 0px");
  await expect(page.locator("#m-1")).toHaveCSS("margin", "7px");
});

test("matches legacy link hover and focus states", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  for (const selector of ["#link-primary", "#link-secondary", "#link-success"]) {
    await Promise.all([legacy.locator(selector).hover(), spectra.locator(selector).hover()]);
    expect(await utilityStyles(spectra, [selector])).toEqual(
      await utilityStyles(legacy, [selector]),
    );
  }

  for (const selector of ["#link-primary", "#link-secondary", "#link-success"]) {
    await Promise.all([legacy.locator(selector).focus(), spectra.locator(selector).focus()]);
    expect(await utilityStyles(spectra, [selector])).toEqual(
      await utilityStyles(legacy, [selector]),
    );
  }
  await context.close();
});
